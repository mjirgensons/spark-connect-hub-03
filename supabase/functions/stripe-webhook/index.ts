import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import Stripe from "https://esm.sh/stripe@17.7.0?target=deno";

serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    let stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Try integrations table for stripe key
    const { data: stripeInt } = await supabase
      .from("integrations")
      .select("encrypted_credentials")
      .eq("service_name", "stripe")
      .eq("is_enabled", true)
      .maybeSingle();

    if (stripeInt?.encrypted_credentials) {
      const creds = stripeInt.encrypted_credentials as Record<string, string>;
      if (creds.secret_key) stripeKey = creds.secret_key;
    }

    if (!stripeKey) {
      return new Response("Stripe not configured", { status: 503 });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-01-27.acacia" });
    const body = await req.text();
    let event: Stripe.Event;

    // Verify signature if webhook secret is configured
    if (webhookSecret) {
      const sig = req.headers.get("stripe-signature");
      if (!sig) return new Response("Missing signature", { status: 400 });
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } else {
      event = JSON.parse(body) as Stripe.Event;
    }

    // ── WF-9: Map Stripe event type → site_settings key ──
    const EVENT_TO_SETTING: Record<string, string> = {
      "checkout.session.completed": "stripe_checkout_completed_webhook_url",
      "checkout.session.expired":   "stripe_checkout_expired_webhook_url",
      "charge.refunded":            "stripe_charge_refunded_webhook_url",
    };

    // Helper: read a single WF-9 URL from site_settings
    const getWf9Url = async (eventType: string): Promise<string | null> => {
      const settingKey = EVENT_TO_SETTING[eventType];
      if (!settingKey) return null;

      const { data, error } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", settingKey)
        .maybeSingle();

      if (error) {
        console.error(`[stripe-webhook] Error reading site_settings key "${settingKey}":`, error.message);
        return null;
      }

      const url = data?.value?.trim() || null;
      if (!url) {
        console.warn(`[stripe-webhook] Missing WF-9 webhook URL for ${eventType} (key: ${settingKey})`);
      }
      return url;
    };

    // Helper: forward the full Stripe event to the WF-9 URL
    const forwardToWf9 = async (eventType: string) => {
      const url = await getWf9Url(eventType);

      if (!url) {
        await supabase.from("webhook_logs").insert({
          event_type: eventType,
          direction: "outbound",
          webhook_url: `wf9:${EVENT_TO_SETTING[eventType] || eventType} (not configured)`,
          request_payload: { event_id: event.id },
          status: "skipped",
          error_message: `Missing WF-9 webhook URL for ${eventType}`,
        });
        return; // skip silently — return 200 to Stripe
      }

      const start = Date.now();
      try {
        // Plain POST to n8n — no Supabase keys leaked
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(event),
        });
        const resBody = await res.text().catch(() => "");
        await supabase.from("webhook_logs").insert({
          event_type: eventType,
          direction: "outbound",
          webhook_url: url,
          request_payload: { event_id: event.id, type: eventType },
          response_status: res.status,
          response_body: resBody.slice(0, 2000),
          duration_ms: Date.now() - start,
          status: res.ok ? "delivered" : "failed",
          error_message: res.ok ? null : `HTTP ${res.status}`,
        });
      } catch (err) {
        await supabase.from("webhook_logs").insert({
          event_type: eventType,
          direction: "outbound",
          webhook_url: url,
          request_payload: { event_id: event.id },
          duration_ms: Date.now() - start,
          status: "failed",
          error_message: err.message,
        });
      }
    };

    // ── Handle events ──
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.order_id;
      if (orderId) {
        await supabase
          .from("orders")
          .update({
            payment_status: "paid",
            stripe_payment_intent_id: (session.payment_intent as string) || null,
            paid_at: new Date().toISOString(),
            status: "confirmed",
          })
          .eq("id", orderId);
      }
      await forwardToWf9("checkout.session.completed");
    } else if (event.type === "checkout.session.expired") {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.order_id;
      if (orderId) {
        await supabase
          .from("orders")
          .update({ payment_status: "failed" })
          .eq("id", orderId);
      }
      await forwardToWf9("checkout.session.expired");
    } else if (event.type === "charge.refunded") {
      const charge = event.data.object as Stripe.Charge;
      const paymentIntent = charge.payment_intent as string;
      if (paymentIntent) {
        await supabase
          .from("orders")
          .update({ payment_status: "refunded", status: "refunded" })
          .eq("stripe_payment_intent_id", paymentIntent);
      }
      await forwardToWf9("charge.refunded");
    }

    // Log inbound webhook
    await supabase.from("webhook_logs").insert({
      event_type: event.type,
      direction: "inbound",
      webhook_url: `stripe-webhook/${event.type}`,
      request_payload: { event_id: event.id, type: event.type },
      response_status: 200,
      status: "delivered",
    });

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("stripe-webhook error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 400 });
  }
});
