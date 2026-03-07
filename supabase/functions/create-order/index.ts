import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-api-secret, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type OrderPayload = {
  user_id: string | null;
  guest_email: string | null;
  subtotal: number;
  shipping_cost: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  shipping_name: string;
  shipping_address_line_1: string;
  shipping_address_line_2: string | null;
  shipping_city: string;
  shipping_province: string;
  shipping_postal_code: string;
  shipping_phone: string | null;
  shipping_method: string;
  payment_status: string;
  status: string;
  order_number: string;
  seller_id: string | null;
};

type OrderItemPayload = {
  product_id: string | null;
  product_name: string;
  product_sku: string | null;
  product_image: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Auth: accept requests with a valid apikey (Supabase gateway validates it)
  // or the n8n webhook secret for server-to-server calls
  const apiKey = req.headers.get("apikey") || req.headers.get("authorization");
  const apiSecret = req.headers.get("x-api-secret");
  if (!apiKey && apiSecret !== Deno.env.get("N8N_WEBHOOK_SECRET")) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const ordersPayload = body?.orders as Array<{
      order: OrderPayload;
      items: OrderItemPayload[];
    }>;

    if (!Array.isArray(ordersPayload) || ordersPayload.length === 0) {
      return new Response(JSON.stringify({ error: "orders array is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const createdOrders: Array<{ order_id: string; order_number: string; seller_id: string | null }> = [];

    for (const entry of ordersPayload) {
      const { order, items } = entry;
      if (!order || !Array.isArray(items) || items.length === 0) continue;

      const fallbackOrderNumber = `FM-${new Date()
        .toISOString()
        .slice(0, 10)
        .replace(/-/g, "")}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;

      const normalizedOrder = {
        ...order,
        order_number:
          order.order_number && order.order_number !== "placeholder"
            ? order.order_number
            : fallbackOrderNumber,
      };

      const { data: created, error: orderError } = await supabase
        .from("orders")
        .insert(normalizedOrder)
        .select("id, order_number, seller_id")
        .single();

      if (orderError || !created) throw orderError ?? new Error("Failed to create order");

      const orderItems = items.map((item) => ({
        order_id: created.id,
        product_id: item.product_id,
        product_name: item.product_name,
        product_sku: item.product_sku,
        product_image: item.product_image,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
      }));

      const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
      if (itemsError) throw itemsError;

      createdOrders.push({
        order_id: created.id,
        order_number: created.order_number,
        seller_id: created.seller_id,
      });
    }

    return new Response(
      JSON.stringify({ orders: createdOrders }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message, details: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
