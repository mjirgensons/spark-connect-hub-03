import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-api-secret",
};

const PLATFORM_FEE_RATE = 0.10; // 10% platform commission

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Auth: only n8n or service calls
  const apiSecret = req.headers.get("x-api-secret");
  const expectedSecret = Deno.env.get("N8N_WEBHOOK_SECRET");
  if (!apiSecret || apiSecret !== expectedSecret) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const { order_ids, transfer_group, payment_intent_id } = body;

    if (!order_ids || !Array.isArray(order_ids) || order_ids.length === 0) {
      return new Response(
        JSON.stringify({ error: "order_ids array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Get Stripe key
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
        JSON.stringify({ error: "Stripe not configured" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Fetch all orders with seller info
    const { data: orders, error: ordersErr } = await supabase
      .from("orders")
      .select("id, seller_id, total, subtotal, shipping_cost, tax_amount, stripe_transfer_group")
      .in("id", order_ids);

    if (ordersErr || !orders?.length) {
      return new Response(
        JSON.stringify({ error: "Orders not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results: Array<{
      order_id: string;
      seller_id: string | null;
      status: string;
      transfer_id?: string;
      error?: string;
    }> = [];

    for (const order of orders) {
      if (!order.seller_id) {
        results.push({ order_id: order.id, seller_id: null, status: "skipped", error: "No seller_id on order" });
        continue;
      }

      // Check if transfer already exists for this order
      const { data: existingPayout } = await supabase
        .from("seller_payouts")
        .select("id")
        .eq("order_id", order.id)
        .eq("seller_id", order.seller_id)
        .maybeSingle();

      if (existingPayout) {
        results.push({ order_id: order.id, seller_id: order.seller_id, status: "already_processed" });
        continue;
      }

      // Get seller's Stripe Connect account
      const { data: sellerProfile } = await supabase
        .from("profiles")
        .select("stripe_account_id, stripe_charges_enabled")
        .eq("id", order.seller_id)
        .single();

      if (!sellerProfile?.stripe_account_id || !sellerProfile.stripe_charges_enabled) {
        results.push({
          order_id: order.id,
          seller_id: order.seller_id,
          status: "skipped",
          error: "Seller has no active Stripe Connect account",
        });
        continue;
      }

      // Calculate amounts
      const grossCents = Math.round((Number(order.subtotal) + Number(order.shipping_cost)) * 100);
      const platformFeeCents = Math.round(grossCents * PLATFORM_FEE_RATE);
      const stripeFeeCents = Math.round(grossCents * 0.029) + 30;
      const hstOnCommissionCents = Math.round(platformFeeCents * 0.13);
      const sellerPayoutCents = grossCents - platformFeeCents;

      try {
        const transferParams: any = {
          amount: sellerPayoutCents,
          currency: "cad",
          destination: sellerProfile.stripe_account_id,
          metadata: {
            order_id: order.id,
            platform_fee_cents: String(platformFeeCents),
            gross_cents: String(grossCents),
          },
        };

        if (transfer_group || order.stripe_transfer_group) {
          transferParams.transfer_group = transfer_group || order.stripe_transfer_group;
        }

        if (payment_intent_id) {
          transferParams.source_transaction = payment_intent_id;
        }

        const transfer = await stripe.transfers.create(transferParams);

        // Record in seller_payouts
        await supabase.from("seller_payouts").insert({
          seller_id: order.seller_id,
          order_id: order.id,
          gross_amount_cents: grossCents,
          platform_fee_cents: platformFeeCents,
          stripe_fee_cents: stripeFeeCents,
          seller_payout_cents: sellerPayoutCents,
          hst_on_commission_cents: hstOnCommissionCents,
          stripe_transfer_id: transfer.id,
          payout_status: "completed",
          released_at: new Date().toISOString(),
        });

        // Update order with transfer info
        await supabase
          .from("orders")
          .update({
            stripe_transfer_id: transfer.id,
            platform_fee_cents: platformFeeCents,
            seller_payout_cents: sellerPayoutCents,
            funds_released_at: new Date().toISOString(),
          })
          .eq("id", order.id);

        results.push({
          order_id: order.id,
          seller_id: order.seller_id,
          status: "transferred",
          transfer_id: transfer.id,
        });
      } catch (transferErr: any) {
        console.error(`Transfer failed for order ${order.id}:`, transferErr);

        await supabase.from("seller_payouts").insert({
          seller_id: order.seller_id,
          order_id: order.id,
          gross_amount_cents: grossCents,
          platform_fee_cents: platformFeeCents,
          stripe_fee_cents: stripeFeeCents,
          seller_payout_cents: sellerPayoutCents,
          hst_on_commission_cents: hstOnCommissionCents,
          payout_status: "failed",
        });

        results.push({
          order_id: order.id,
          seller_id: order.seller_id,
          status: "failed",
          error: transferErr.message,
        });
      }
    }

    return new Response(
      JSON.stringify({ results }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("process-seller-transfers error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
