import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * stripe-webhook-test
 * Sends a synthetic Stripe event through the WF-9 forwarding logic
 * so n8n receives a realistic test payload without real Stripe traffic.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const { stripe_event_type } = body;

    // Validate event type
    const EVENT_TO_SETTING: Record<string, string> = {
      "checkout.session.completed": "stripe_checkout_completed_webhook_url",
      "checkout.session.expired": "stripe_checkout_expired_webhook_url",
      "charge.refunded": "stripe_charge_refunded_webhook_url",
    };

    const settingKey = EVENT_TO_SETTING[stripe_event_type];
    if (!settingKey) {
      return new Response(
        JSON.stringify({ status: "error", message: `Unsupported event type: ${stripe_event_type}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Load URL from site_settings
    const { data, error } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", settingKey)
      .maybeSingle();

    if (error) {
      return new Response(
        JSON.stringify({ status: "error", message: `DB error: ${error.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const url = data?.value?.trim();
    if (!url) {
      return new Response(
        JSON.stringify({ status: "error", message: `No URL configured for key "${settingKey}". Save a URL first.` }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build synthetic event matching real Stripe shape
    const now = Math.floor(Date.now() / 1000);
    const testId = `evt_test_wf9_${Date.now()}`;
    let syntheticEvent: Record<string, unknown>;

    if (stripe_event_type === "checkout.session.completed") {
      syntheticEvent = {
        id: testId,
        object: "event",
        type: "checkout.session.completed",
        livemode: false,
        created: now,
        data: {
          object: {
            id: `cs_test_${Date.now()}`,
            object: "checkout.session",
            payment_status: "paid",
            amount_total: 29900,
            currency: "cad",
            customer_email: "wf9-test@example.com",
            payment_intent: `pi_test_${Date.now()}`,
            metadata: { order_id: "test-order-wf9", source: "admin-stripe-wf9-test" },
          },
        },
        _test: true,
      };
    } else if (stripe_event_type === "checkout.session.expired") {
      syntheticEvent = {
        id: testId,
        object: "event",
        type: "checkout.session.expired",
        livemode: false,
        created: now,
        data: {
          object: {
            id: `cs_test_${Date.now()}`,
            object: "checkout.session",
            payment_status: "unpaid",
            metadata: { order_id: "test-order-wf9", source: "admin-stripe-wf9-test" },
          },
        },
        _test: true,
      };
    } else {
      syntheticEvent = {
        id: testId,
        object: "event",
        type: "charge.refunded",
        livemode: false,
        created: now,
        data: {
          object: {
            id: `ch_test_${Date.now()}`,
            object: "charge",
            amount: 29900,
            amount_refunded: 29900,
            currency: "cad",
            payment_intent: `pi_test_${Date.now()}`,
            receipt_email: "wf9-test@example.com",
          },
        },
        _test: true,
      };
    }

    // Forward to the configured URL
    const start = Date.now();
    let responseStatus: number;
    let responseBody: string;

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(syntheticEvent),
      });
      responseStatus = res.status;
      responseBody = await res.text();
    } catch (err) {
      // Log the failure
      await supabase.from("webhook_logs").insert({
        event_type: `test:${stripe_event_type}`,
        direction: "outbound",
        webhook_url: url,
        request_payload: { event_id: testId, type: stripe_event_type, test: true },
        duration_ms: Date.now() - start,
        status: "failed",
        error_message: err.message,
      });

      return new Response(
        JSON.stringify({ status: "error", message: `Network error: ${err.message}`, duration_ms: Date.now() - start }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const durationMs = Date.now() - start;
    const ok = responseStatus >= 200 && responseStatus < 300;

    // Log the test result
    await supabase.from("webhook_logs").insert({
      event_type: `test:${stripe_event_type}`,
      direction: "outbound",
      webhook_url: url,
      request_payload: { event_id: testId, type: stripe_event_type, test: true },
      response_status: responseStatus,
      response_body: responseBody.slice(0, 2000),
      duration_ms: durationMs,
      status: ok ? "delivered" : "failed",
      error_message: ok ? null : `HTTP ${responseStatus}`,
    });

    return new Response(
      JSON.stringify({
        status: ok ? "success" : "error",
        http_status: responseStatus,
        duration_ms: durationMs,
        message: ok
          ? `Test request sent successfully (HTTP ${responseStatus}). Check WF-9 / n8n logs if needed.`
          : `Test failed (HTTP ${responseStatus}). Please verify the URL and that WF-9 is reachable.`,
        response_preview: responseBody.slice(0, 500),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ status: "error", message: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
