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

  // Auth check
  const secret = req.headers.get("x-api-secret");
  const expected = Deno.env.get("N8N_WEBHOOK_SECRET");
  if (!secret || secret !== expected) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: { order_id?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { order_id } = body;
  if (!order_id) {
    return new Response(JSON.stringify({ error: "order_id is required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // Get order info
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("order_number, shipping_name, guest_email, user_id, created_at")
    .eq("id", order_id)
    .single();

  if (orderError) {
    return new Response(
      JSON.stringify({ error: "Order lookup failed", details: orderError.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Get order items joined with products to get seller_id
  const { data: items, error: itemsError } = await supabase
    .from("order_items")
    .select("product_name, quantity, unit_price, total_price, product_id, products(seller_id, delivery_option, delivery_prep_days, pickup_prep_days)")
    .eq("order_id", order_id);

  if (itemsError) {
    return new Response(
      JSON.stringify({ error: "Order items lookup failed", details: itemsError.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Group items by seller_id
  const sellerMap: Record<string, {
    seller_id: string;
    items: { product_name: string; quantity: number; unit_price: number; total_price: number; product_id: string | null }[];
  }> = {};

  for (const item of items || []) {
    const sellerId = (item as any).products?.seller_id;
    if (!sellerId) continue; // skip items with no seller

    if (!sellerMap[sellerId]) {
      sellerMap[sellerId] = { seller_id: sellerId, items: [] };
    }
    sellerMap[sellerId].items.push({
      product_name: item.product_name,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.total_price,
      product_id: item.product_id,
    });
  }

  // Fetch seller profiles
  const sellerIds = Object.keys(sellerMap);
  const sellers = [];

  if (sellerIds.length > 0) {
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, email, full_name, company_name")
      .in("id", sellerIds);

    if (profilesError) {
      return new Response(
        JSON.stringify({ error: "Profiles lookup failed", details: profilesError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    for (const profile of profiles || []) {
      sellers.push({
        seller_id: profile.id,
        seller_email: profile.email,
        seller_name: profile.full_name,
        company_name: profile.company_name,
        items: sellerMap[profile.id].items,
      });
    }
  }

  return new Response(
    JSON.stringify({
      order_id,
      order_number: order.order_number,
      order_date: order.created_at,
      buyer_name: order.shipping_name,
      buyer_email: order.guest_email,
      buyer_user_id: order.user_id,
      sellers,
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
