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

  const apiSecret = req.headers.get("x-api-secret");
  const apiKey = req.headers.get("apikey");
  const isAllowed =
    apiSecret === Deno.env.get("N8N_WEBHOOK_SECRET") ||
    apiKey === Deno.env.get("SUPABASE_ANON_KEY");

  if (!isAllowed) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const order = body?.order as OrderPayload | undefined;
    const items = body?.items as OrderItemPayload[] | undefined;

    if (!order || !Array.isArray(items) || items.length === 0) {
      return new Response(JSON.stringify({ error: "order and items are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: createdOrder, error: orderError } = await supabase
      .from("orders")
      .insert(order)
      .select("id, order_number")
      .single();

    if (orderError || !createdOrder) {
      throw orderError ?? new Error("Failed to create order");
    }

    const orderItems = items.map((item) => ({
      order_id: createdOrder.id,
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

    return new Response(
      JSON.stringify({
        order_id: createdOrder.id,
        order_number: createdOrder.order_number,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message, details: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
