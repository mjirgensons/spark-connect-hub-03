import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { order_ids } = await req.json();
    if (!order_ids || !Array.isArray(order_ids) || order_ids.length === 0) {
      throw new Error("order_ids array is required");
    }

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

    // Fetch all orders
    const { data: orders, error: ordersErr } = await supabase
      .from("orders")
      .select("*")
      .in("id", order_ids);

    if (ordersErr || !orders?.length) {
      return new Response(
        JSON.stringify({ error: "Orders not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch all order items across all orders
    const { data: allItems, error: itemsErr } = await supabase
      .from("order_items")
      .select("*")
      .in("order_id", order_ids);

    if (itemsErr || !allItems?.length) {
      return new Response(
        JSON.stringify({ error: "No order items found" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Build line items
    const lineItems = allItems.map((item: any) => ({
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

    // Add shipping from each order that has shipping_cost > 0
    const totalShipping = orders.reduce((sum: number, o: any) => sum + (Number(o.shipping_cost) || 0), 0);
    if (totalShipping > 0) {
      lineItems.push({
        price_data: {
          currency: "cad",
          product_data: { name: "Shipping" },
          unit_amount: Math.round(totalShipping * 100),
        },
        quantity: 1,
      });
    }

    // Use first order for customer email and success redirect
    const primaryOrder = orders[0];
    const customerEmail = primaryOrder.guest_email || undefined;

    // Generate transfer group for Connect transfers
    const transferGroup = `txg_${primaryOrder.id.slice(0, 8)}_${Date.now()}`;

    const orderMeta = {
      order_ids: order_ids.join(","),
      order_count: String(order_ids.length),
      primary_order_id: primaryOrder.id,
      transfer_group: transferGroup,
    };

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      currency: "cad",
      line_items: lineItems,
      ...(customerEmail ? { customer_email: customerEmail } : {}),
      metadata: orderMeta,
      payment_intent_data: {
        metadata: orderMeta,
        transfer_group: transferGroup,
      },
      automatic_tax: { enabled: false },
      success_url: `${siteUrl}/order-confirmation/${primaryOrder.id}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/checkout?cancelled=true`,
    });

    // Update all orders with the shared Stripe session ID and transfer group
    for (const oid of order_ids) {
      await supabase
        .from("orders")
        .update({
          stripe_checkout_session_id: session.id,
          stripe_transfer_group: transferGroup,
        })
        .eq("id", oid);
    }

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
