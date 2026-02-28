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

    const { service_name } = await req.json();
    if (!service_name) {
      return new Response(JSON.stringify({ status: "error", message: "service_name required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch integration config
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
    const start = Date.now();

    let result: { status: string; message: string; latency_ms?: number };

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
          const res = await fetch(healthUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ping: true, timestamp: new Date().toISOString() }),
          });
          const contentType = res.headers.get("content-type") || "";
          if (!res.ok) {
            const body = await res.text();
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
        const apiKey = creds.api_key;
        if (!apiKey) {
          result = { status: "error", message: "ElevenLabs API key required" };
          break;
        }
        const res = await fetch("https://api.elevenlabs.io/v1/user", {
          headers: { "xi-api-key": apiKey },
        });
        result = res.ok
          ? { status: "healthy", message: "ElevenLabs connection verified" }
          : { status: "error", message: `ElevenLabs returned ${res.status}` };
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
