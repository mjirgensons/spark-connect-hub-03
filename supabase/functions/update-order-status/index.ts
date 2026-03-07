import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-api-secret",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

  // Dual auth: x-api-secret OR valid JWT (seller must own items in order)
  const apiSecret = req.headers.get("x-api-secret");
  const expectedSecret = Deno.env.get("N8N_WEBHOOK_SECRET");
  const authHeader = req.headers.get("authorization");

  let authedSellerId: string | null = null;
  let isServiceAuth = false;

  if (apiSecret && apiSecret === expectedSecret) {
    isServiceAuth = true;
  } else if (authHeader?.startsWith("Bearer ")) {
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claimsData, error: claimsError } = await userClient.auth.getUser();
    if (claimsError || !claimsData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    authedSellerId = claimsData.user.id;
  } else {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Parse body
  let body: {
    order_id?: string;
    status?: string;
    tracking_number?: string;
    tracking_url?: string;
    cancellation_reason?: string;
    shipped_at?: string;
    delivered_at?: string;
    cancelled_at?: string;
  };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { order_id, status } = body;
  if (!order_id || !status) {
    return new Response(JSON.stringify({ error: "order_id and status are required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const validStatuses = ["paid", "preparing", "shipped", "ready_for_pickup", "in_transit", "delivered", "cancelled", "completed"];

  const TRANSITIONS: Record<string, string[]> = {
    paid: ["preparing", "cancelled"],
    preparing: ["shipped", "ready_for_pickup", "cancelled"],
    shipped: ["in_transit", "cancelled"],
    in_transit: ["delivered"],
    ready_for_pickup: ["delivered", "cancelled"],
    delivered: ["completed"],
    completed: [],
    cancelled: [],
  };

  if (!validStatuses.includes(status)) {
    return new Response(
      JSON.stringify({ error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // If JWT auth, verify permission based on requested status
  if (!isServiceAuth && authedSellerId) {
    if (status === "delivered") {
      // Buyer confirming delivery: must be the order owner
      const { data: orderRow, error: orderErr } = await supabaseAdmin
        .from("orders")
        .select("user_id")
        .eq("id", order_id)
        .single();

      if (orderErr || !orderRow) {
        return new Response(
          JSON.stringify({ error: "Order not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Allow if user is the buyer OR a seller for this order
      const isBuyer = orderRow.user_id === authedSellerId;
      if (!isBuyer) {
        // Fall back to seller check
        const { data: sellerItems } = await supabaseAdmin
          .from("order_items")
          .select("id, products(seller_id)")
          .eq("order_id", order_id);

        const isSeller = (sellerItems || []).some(
          (item: any) => item.products?.seller_id === authedSellerId
        );
        if (!isSeller) {
          return new Response(
            JSON.stringify({ error: "Forbidden: you are not authorized for this order" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    } else {
      // All other statuses: seller ownership check
      const { data: sellerItems, error: sellerErr } = await supabaseAdmin
        .from("order_items")
        .select("id, products(seller_id)")
        .eq("order_id", order_id);

      if (sellerErr) {
        return new Response(
          JSON.stringify({ error: "Failed to verify seller ownership", details: sellerErr.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const isSeller = (sellerItems || []).some(
        (item: any) => item.products?.seller_id === authedSellerId
      );
      if (!isSeller) {
        return new Response(
          JSON.stringify({ error: "Forbidden: you are not a seller for this order" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }
  }

  // Build update payload
  const updatePayload: Record<string, any> = { status };
  if (body.tracking_number) updatePayload.tracking_number = body.tracking_number;
  if (body.tracking_url) updatePayload.tracking_url = body.tracking_url;
  if (body.cancellation_reason) updatePayload.cancellation_reason = body.cancellation_reason;
  if (body.shipped_at) updatePayload.shipped_at = body.shipped_at;
  if (body.delivered_at) updatePayload.delivered_at = body.delivered_at;
  if (body.cancelled_at) updatePayload.cancelled_at = body.cancelled_at;
  if (status === "delivered" && !body.delivered_at) {
    updatePayload.delivered_at = new Date().toISOString();
  }
  if (status === "delivered") {
    updatePayload.delivery_confirmed_at = new Date().toISOString();
  }

  const { error: updateError } = await supabaseAdmin
    .from("orders")
    .update(updatePayload)
    .eq("id", order_id);

  if (updateError) {
    return new Response(
      JSON.stringify({ error: "Update failed", details: updateError.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({ success: true, order_id }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
