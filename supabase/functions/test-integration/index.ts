import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const reqBody = await req.json();
    const { service_name, webhook_test_url, webhook_test_payload } = reqBody;

    const start = Date.now();
    let result: { status: string; message: string; latency_ms?: number };

    // Direct webhook test mode (no integration lookup needed)
    if (webhook_test_url) {
      try {
        const payload = webhook_test_payload || { test: true, timestamp: new Date().toISOString() };
        let res = await fetch(webhook_test_url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        let body = await res.text();
        // If n8n says POST not registered, retry with GET
        if (!res.ok && body.includes("not registered for POST")) {
          res = await fetch(webhook_test_url);
          body = await res.text();
        }
        const isHtml = body.trim().startsWith("<!") || body.includes("<html");
        result = res.ok
          ? { status: "healthy", message: `Webhook responded with ${res.status}` }
          : {
              status: "error",
              message: isHtml
                ? `Returned HTML (status ${res.status}) — check if workflow is active`
                : `Returned ${res.status}: ${body.substring(0, 200)}`,
            };
        result.latency_ms = Date.now() - start;
        return new Response(JSON.stringify(result), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (e) {
        result = { status: "error", message: `Unreachable: ${e.message}`, latency_ms: Date.now() - start };
        return new Response(JSON.stringify(result), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Service-based health check — requires integration lookup
    if (!service_name) {
      return new Response(JSON.stringify({ status: "error", message: "service_name required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: integration, error } = await supabase
      .from("integrations")
      .select("*")
      .eq("service_name", service_name)
      .maybeSingle();

    if (error || !integration) {
      return new Response(
        JSON.stringify({ status: "error", message: "Integration not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const config = integration.config || {};
    const creds = integration.encrypted_credentials || {};

    switch (service_name) {
      case "mailgun": {
        const apiKey = creds.api_key;
        const domain = config.domain;
        if (!apiKey || !domain) {
          result = { status: "error", message: "API key and domain required" };
          break;
        }
        const region = config.region === "EU" ? "api.eu.mailgun.net" : "api.mailgun.net";
        const res = await fetch(`https://${region}/v3/domains/${domain}`, {
          headers: { Authorization: `Basic ${btoa(`api:${apiKey}`)}` },
        });
        result = res.ok
          ? { status: "healthy", message: `Domain ${domain} verified` }
          : { status: "error", message: `Mailgun returned ${res.status}` };
        break;
      }
      case "stripe": {
        const secretKey = creds.secret_key;
        if (!secretKey) {
          result = { status: "error", message: "Secret key required" };
          break;
        }
        const res = await fetch("https://api.stripe.com/v1/balance", {
          headers: { Authorization: `Bearer ${secretKey}` },
        });
        const body = await res.json();
        result = res.ok
          ? { status: "healthy", message: "Stripe connection verified" }
          : { status: "error", message: body.error?.message || `Stripe returned ${res.status}` };
        break;
      }
      case "n8n": {
        const webhookBaseUrl = config.webhook_base_url || config.base_url || integration.webhook_url;
        if (!webhookBaseUrl) {
          result = { status: "error", message: "n8n webhook base URL required" };
          break;
        }
        try {
          const healthUrl = `${webhookBaseUrl.replace(/\/+$/, "")}/webhook/health-check`;
          let res = await fetch(healthUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ping: true, timestamp: new Date().toISOString() }),
          });
          let body = await res.text();
          // If n8n says POST not registered, retry with GET
          if (!res.ok && body.includes("not registered for POST")) {
            res = await fetch(healthUrl);
            body = await res.text();
          }
          if (!res.ok) {
            const isHtml = body.trim().startsWith("<!") || body.includes("<html");
            result = {
              status: "error",
              message: isHtml
                ? `n8n returned HTML (status ${res.status}) — likely a login page or missing workflow. Ensure the health-check workflow is active.`
                : `n8n returned ${res.status}: ${body.substring(0, 200)}`,
            };
          } else {
            result = { status: "healthy", message: "n8n webhook responding" };
          }
        } catch (e) {
          result = { status: "error", message: `n8n unreachable: ${e.message}` };
        }
        break;
      }
      case "chatbot":
      case "b2c-chatbot":
      case "b2b-chatbot": {
        const webhookUrl = config.webhook_url;
        if (!webhookUrl) {
          result = { status: "error", message: "Chatbot webhook URL required" };
          break;
        }
        try {
          const res = await fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ test: true, message: "Health check" }),
          });
          result = res.ok
            ? { status: "healthy", message: "Chatbot webhook responding" }
            : { status: "error", message: `Chatbot returned ${res.status}` };
        } catch (e) {
          result = { status: "error", message: `Chatbot unreachable: ${e.message}` };
        }
        break;
      }
      case "elevenlabs": {
        result = { status: "error", message: "ElevenLabs integration has been removed" };
        break;
      }
      default:
        result = { status: "error", message: `Unknown service: ${service_name}` };
    }

    result.latency_ms = Date.now() - start;

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ status: "error", message: e.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
