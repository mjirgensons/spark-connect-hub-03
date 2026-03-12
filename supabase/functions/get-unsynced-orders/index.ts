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

  const { data: orders, error } = await supabase
    .from("orders")
    .select(`
      id,
      order_number,
      status,
      subtotal,
      shipping_cost,
      tax_amount,
      total,
      currency,
      shipping_name,
      shipping_city,
      shipping_province,
      shipping_postal_code,
      shipping_method,
      tracking_number,
      tracking_url,
      estimated_delivery,
      notes,
      created_at,
      paid_at,
      shipped_at,
      delivered_at,
      delivery_confirmed_at,
      seller_id,
      user_id,
      order_items (
        product_name,
        quantity,
        unit_price,
        total_price
      ),
      buyer:profiles!orders_user_id_fkey (
        full_name
      ),
      seller:profiles!orders_seller_id_fkey (
        full_name,
        company_name,
        business_address
      )
    `)
    .eq("pinecone_synced", false)
    .order("created_at", { ascending: true })
    .limit(50);

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message, details: error.details }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Flatten joined profile data
  const result = (orders ?? []).map((o: any) => ({
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
    buyer_name: o.buyer?.full_name ?? null,
    seller_business_name: o.seller?.company_name ?? null,
    seller_business_address: o.seller?.business_address ?? null,
    order_items: o.order_items ?? [],
  }));

  return new Response(
    JSON.stringify({ success: true, data: result }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
