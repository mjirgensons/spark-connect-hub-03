import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-api-secret",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders, status: 200 });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const secret = req.headers.get("x-api-secret");
  if (secret !== Deno.env.get("N8N_WEBHOOK_SECRET")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // 1. Fetch unsynced orders
  const { data: orders, error: ordersError } = await supabase
    .from("orders")
    .select(`
      id, order_number, status, subtotal, shipping_cost, tax_amount, total,
      currency, shipping_name, shipping_city, shipping_province,
      shipping_postal_code, shipping_method, tracking_number, tracking_url,
      estimated_delivery, notes, created_at, paid_at, shipped_at,
      delivered_at, delivery_confirmed_at, seller_id, user_id
    `)
    .eq("pinecone_synced", false)
    .order("created_at", { ascending: true })
    .limit(50);

  if (ordersError) {
    return new Response(
      JSON.stringify({ error: ordersError.message, details: ordersError.details }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Filter out orphan orders (both user_id and seller_id are null)
  const validOrders = (orders ?? []).filter(
    (o: any) => o.user_id !== null || o.seller_id !== null
  );

  if (validOrders.length === 0) {
    return new Response(
      JSON.stringify({ success: true, data: [] }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const orderIds = validOrders.map((o: any) => o.id);
  const buyerIds = [...new Set(orders.map((o: any) => o.user_id).filter(Boolean))];
  const sellerIds = [...new Set(orders.map((o: any) => o.seller_id).filter(Boolean))];

  // 2-4. Parallel fetches for order_items, buyer profiles, seller profiles
  const [itemsRes, buyersRes, sellersRes] = await Promise.all([
    supabase
      .from("order_items")
      .select("order_id, product_name, quantity, unit_price, total_price")
      .in("order_id", orderIds),
    buyerIds.length > 0
      ? supabase.from("profiles").select("id, full_name").in("id", buyerIds)
      : Promise.resolve({ data: [], error: null }),
    sellerIds.length > 0
      ? supabase.from("profiles").select("id, full_name, company_name, business_address").in("id", sellerIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  // Build lookup maps
  const itemsByOrder: Record<string, any[]> = {};
  for (const item of itemsRes.data ?? []) {
    (itemsByOrder[item.order_id] ??= []).push({
      product_name: item.product_name,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.total_price,
    });
  }

  const buyerMap: Record<string, string> = {};
  for (const b of buyersRes.data ?? []) {
    buyerMap[b.id] = b.full_name;
  }

  const sellerMap: Record<string, any> = {};
  for (const s of sellersRes.data ?? []) {
    sellerMap[s.id] = { company_name: s.company_name, business_address: s.business_address };
  }

  // 5. Assemble result
  const result = orders.map((o: any) => ({
    id: o.id,
    order_number: o.order_number,
    status: o.status,
    subtotal: o.subtotal,
    shipping_cost: o.shipping_cost,
    tax_amount: o.tax_amount,
    total: o.total,
    currency: o.currency,
    shipping_name: o.shipping_name,
    shipping_city: o.shipping_city,
    shipping_province: o.shipping_province,
    shipping_postal_code: o.shipping_postal_code,
    shipping_method: o.shipping_method,
    tracking_number: o.tracking_number,
    tracking_url: o.tracking_url,
    estimated_delivery: o.estimated_delivery,
    notes: o.notes,
    created_at: o.created_at,
    paid_at: o.paid_at,
    shipped_at: o.shipped_at,
    delivered_at: o.delivered_at,
    delivery_confirmed_at: o.delivery_confirmed_at,
    seller_id: o.seller_id,
    buyer_id: o.user_id,
    buyer_name: o.user_id ? (buyerMap[o.user_id] ?? null) : null,
    seller_business_name: o.seller_id ? (sellerMap[o.seller_id]?.company_name ?? null) : null,
    seller_business_address: o.seller_id ? (sellerMap[o.seller_id]?.business_address ?? null) : null,
    order_items: itemsByOrder[o.id] ?? [],
  }));

  return new Response(
    JSON.stringify({ success: true, data: result }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
