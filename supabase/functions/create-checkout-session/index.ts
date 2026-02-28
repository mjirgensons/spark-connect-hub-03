import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import Stripe from "https://esm.sh/stripe@17.7.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { order_id } = await req.json();
    if (!order_id) throw new Error("order_id is required");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const siteUrl = Deno.env.get("SITE_URL") || "https://spark-connect-hub-03.lovable.app";

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Try to get Stripe key from integrations table, fallback to env
    let stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const { data: stripeIntegration } = await supabase
      .from("integrations")
      .select("encrypted_credentials")
      .eq("service_name", "stripe")
      .eq("is_enabled", true)
      .maybeSingle();

    if (stripeIntegration?.encrypted_credentials) {
      const creds = stripeIntegration.encrypted_credentials as Record<string, string>;
      if (creds.secret_key) stripeKey = creds.secret_key;
    }

    if (!stripeKey) {
      return new Response(
        JSON.stringify({ error: "Stripe is not configured. Please add STRIPE_SECRET_KEY." }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch order
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select("*")
      .eq("id", order_id)
      .single();

    if (orderErr || !order) {
      return new Response(
        JSON.stringify({ error: "Order not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch order items
    const { data: items, error: itemsErr } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", order_id);

    if (itemsErr || !items?.length) {
      return new Response(
        JSON.stringify({ error: "No order items found" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-01-27.acacia" });

    // Build line items
    const lineItems = items.map((item) => ({
      price_data: {
        currency: "cad",
        product_data: {
          name: item.product_name,
          ...(item.product_image ? { images: [item.product_image] } : {}),
        },
        unit_amount: Math.round(item.unit_price * 100),
      },
      quantity: item.quantity,
    }));

    // Add shipping as a line item if > 0
    if (order.shipping_cost > 0) {
      lineItems.push({
        price_data: {
          currency: "cad",
          product_data: { name: `Shipping (${order.shipping_method || "standard"})` },
          unit_amount: Math.round(order.shipping_cost * 100),
        },
        quantity: 1,
      });
    }

    const customerEmail = order.guest_email || undefined;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      currency: "cad",
      line_items: lineItems,
      ...(customerEmail ? { customer_email: customerEmail } : {}),
      metadata: {
        order_id: order.id,
        order_number: order.order_number,
      },
      automatic_tax: { enabled: false },
      success_url: `${siteUrl}/order-confirmation/${order.id}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/checkout?cancelled=true`,
    });

    // Update order with Stripe session ID
    await supabase
      .from("orders")
      .update({ stripe_checkout_session_id: session.id })
      .eq("id", order_id);

    return new Response(
      JSON.stringify({ url: session.url }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("create-checkout-session error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
