import { supabase } from "@/integrations/supabase/client";

interface WebhookPayload {
  eventType: string;
  data: Record<string, unknown>;
}

/**
 * Dispatches a webhook to the n8n integration URL and logs the attempt.
 * Non-blocking — failures are caught and logged, never thrown.
 */
export async function dispatchWebhook(
  payload: WebhookPayload,
  endpointPath = "/webhook/order-created"
): Promise<void> {
  const start = Date.now();
  let webhookUrl = "";
  let responseStatus: number | null = null;
  let responseBody = "";
  let status: "delivered" | "failed" = "failed";
  let errorMessage: string | null = null;

  try {
    // Read webhook_url from the n8n integration row
    const { data: integration, error: intErr } = await supabase
      .from("integrations")
      .select("webhook_url, config")
      .eq("service_name", "n8n")
      .eq("is_enabled", true)
      .maybeSingle();

    if (intErr || !integration?.webhook_url) {
      console.warn("[webhook] n8n integration not configured or disabled");
      return; // silently skip
    }

    webhookUrl = integration.webhook_url.replace(/\/+$/, "") + endpointPath;

    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: payload.eventType,
        timestamp: new Date().toISOString(),
        ...payload.data,
      }),
    });

    responseStatus = res.status;
    responseBody = await res.text().catch(() => "");
    status = res.ok ? "delivered" : "failed";
    if (!res.ok) errorMessage = `HTTP ${res.status}: ${responseBody.slice(0, 500)}`;
  } catch (err: unknown) {
    errorMessage = err instanceof Error ? err.message : String(err);
  }

  const durationMs = Date.now() - start;

  // Log to webhook_logs (fire-and-forget)
  supabase
    .from("webhook_logs")
    .insert([{
      event_type: payload.eventType,
      direction: "outbound" as const,
      webhook_url: webhookUrl || "n8n (not configured)",
      request_payload: payload.data as unknown as Record<string, unknown>,
      response_status: responseStatus,
      response_body: responseBody.slice(0, 2000),
      duration_ms: durationMs,
      status,
      error_message: errorMessage,
    }])
    .then(({ error }) => {
      if (error) console.warn("[webhook] Failed to log webhook attempt:", error.message);
    });
}
