import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * stripe-webhook-test
 * Sends a synthetic or replayed Stripe event through the WF-9 forwarding logic.
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
    const {
      stripe_event_type,
      provider = "stripe",
      endpoint_key,
      replay_payload,
      is_replay = false,
    } = body;

    // Resolve endpoint_key from event type if not provided
    const EVENT_TO_ENDPOINT: Record<string, string> = {
      "checkout.session.completed": "wf9_checkout_completed",
      "checkout.session.expired": "wf9_checkout_expired",
      "charge.refunded": "wf9_charge_refunded",
    };

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

    const resolvedEndpointKey = endpoint_key || EVENT_TO_ENDPOINT[stripe_event_type] || stripe_event_type;

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

    // Build or reuse payload
    const now = Math.floor(Date.now() / 1000);
    const testId = `evt_test_wf9_${Date.now()}`;
    let eventPayload: Record<string, unknown>;

    if (is_replay && replay_payload) {
      // Replay: use the original payload as-is
      eventPayload = replay_payload;
    } else {
      // Synthetic test
      if (stripe_event_type === "checkout.session.completed") {
        eventPayload = {
          id: testId, object: "event", type: "checkout.session.completed",
          livemode: false, created: now, _test: true,
          data: { object: { id: `cs_test_${Date.now()}`, object: "checkout.session", payment_status: "paid", amount_total: 29900, currency: "cad", customer_email: "wf9-test@example.com", payment_intent: `pi_test_${Date.now()}`, metadata: { order_id: "test-order-wf9", source: "admin-stripe-wf9-test" } } },
        };
      } else if (stripe_event_type === "checkout.session.expired") {
        eventPayload = {
          id: testId, object: "event", type: "checkout.session.expired",
          livemode: false, created: now, _test: true,
          data: { object: { id: `cs_test_${Date.now()}`, object: "checkout.session", payment_status: "unpaid", metadata: { order_id: "test-order-wf9", source: "admin-stripe-wf9-test" } } },
        };
      } else {
        eventPayload = {
          id: testId, object: "event", type: "charge.refunded",
          livemode: false, created: now, _test: true,
          data: { object: { id: `ch_test_${Date.now()}`, object: "charge", amount: 29900, amount_refunded: 29900, currency: "cad", payment_intent: `pi_test_${Date.now()}`, receipt_email: "wf9-test@example.com" } },
        };
      }
    }

    const eventId = (eventPayload as any).id || testId;

    // Forward to the configured URL
    const start = Date.now();
    let responseStatus: number;
    let responseBody: string;

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventPayload),
      });
      responseStatus = res.status;
      responseBody = await res.text();
    } catch (err) {
      await supabase.from("webhook_logs").insert({
        event_type: is_replay ? `replay:${stripe_event_type}` : `test:${stripe_event_type}`,
        event_id: eventId,
        provider,
        endpoint_key: resolvedEndpointKey,
        direction: "outbound",
        webhook_url: url,
        request_payload: eventPayload,
        duration_ms: Date.now() - start,
        status: "failed",
        error_message: err.message,
        is_replay,
        is_test: !is_replay,
      });
      return new Response(
        JSON.stringify({ status: "error", message: `Network error: ${err.message}`, duration_ms: Date.now() - start }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const durationMs = Date.now() - start;
    const ok = responseStatus >= 200 && responseStatus < 300;

    await supabase.from("webhook_logs").insert({
      event_type: is_replay ? `replay:${stripe_event_type}` : `test:${stripe_event_type}`,
      event_id: eventId,
      provider,
      endpoint_key: resolvedEndpointKey,
      direction: "outbound",
      webhook_url: url,
      request_payload: eventPayload,
      response_status: responseStatus,
      response_body: responseBody.slice(0, 2000),
      duration_ms: durationMs,
      status: ok ? "delivered" : "failed",
      error_message: ok ? null : `HTTP ${responseStatus}`,
      is_replay,
      is_test: !is_replay,
    });

    return new Response(
      JSON.stringify({
        status: ok ? "success" : "error",
        http_status: responseStatus,
        duration_ms: durationMs,
        message: ok
          ? `${is_replay ? "Replay" : "Test"} request sent successfully (HTTP ${responseStatus}). Check WF-9 / n8n logs if needed.`
          : `${is_replay ? "Replay" : "Test"} failed (HTTP ${responseStatus}). Please verify the URL and that WF-9 is reachable.`,
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
