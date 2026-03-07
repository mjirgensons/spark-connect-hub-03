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

  // Auth: x-api-secret only
  const apiSecret = req.headers.get("x-api-secret");
  const expectedSecret = Deno.env.get("N8N_WEBHOOK_SECRET");
  if (!apiSecret || apiSecret !== expectedSecret) {
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

  // Fetch order
  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .select(
      "id, order_number, status, created_at, must_acknowledge_by, must_ship_by, shipped_at, tracking_number, tracking_url, shipping_name, shipping_phone, shipping_address_line_1, shipping_city, shipping_province, shipping_postal_code, guest_email, user_id"
    )
    .eq("id", order_id)
    .single();

  if (orderErr || !order) {
    return new Response(
      JSON.stringify({ error: "Order not found", details: orderErr?.message }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Get buyer email from profile or guest_email
  let buyer_email = order.guest_email || null;
  if (!buyer_email && order.user_id) {
    const { data: buyerProfile } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", order.user_id)
      .single();
    buyer_email = buyerProfile?.email || null;
  }

  // Fetch order items with product details
  const { data: items, error: itemsErr } = await supabase
    .from("order_items")
    .select(
      "id, product_name, quantity, unit_price, total_price, product_id, products(seller_id, delivery_option, delivery_price, pickup_city, pickup_province, pickup_address)"
    )
    .eq("order_id", order_id);

  if (itemsErr) {
    return new Response(
      JSON.stringify({ error: "Failed to fetch order items", details: itemsErr.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Get unique seller IDs
  const sellerIds = [
    ...new Set(
      (items || [])
        .map((i: any) => i.products?.seller_id)
        .filter(Boolean)
    ),
  ];

  // Fetch seller profiles
  let sellers: any[] = [];
  if (sellerIds.length > 0) {
    const { data: sellerProfiles, error: sellerErr } = await supabase
      .from("profiles")
      .select("id, full_name, email, company_name")
      .in("id", sellerIds);

    if (sellerErr) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch seller profiles", details: sellerErr.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    sellers = (sellerProfiles || []).map((s: any) => ({
      id: s.id,
      name: s.full_name,
      email: s.email,
      business_name: s.company_name,
    }));
  }

  // Clean order response
  const orderResponse = {
    id: order.id,
    order_number: order.order_number,
    status: order.status,
    created_at: order.created_at,
    must_acknowledge_by: order.must_acknowledge_by,
    must_ship_by: order.must_ship_by,
    shipped_at: order.shipped_at,
    tracking_number: order.tracking_number,
    tracking_url: order.tracking_url,
    shipping_name: order.shipping_name,
    shipping_email: buyer_email,
    shipping_phone: order.shipping_phone,
    shipping_address_line_1: order.shipping_address_line_1,
    shipping_city: order.shipping_city,
    shipping_province: order.shipping_province,
    shipping_postal_code: order.shipping_postal_code,
  };

  return new Response(
    JSON.stringify({ order: orderResponse, items: items || [], sellers }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
