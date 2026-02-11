import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const WEBHOOK_URL = Deno.env.get("N8N_WEBHOOK_URL");
    if (!WEBHOOK_URL) {
      console.error("N8N_WEBHOOK_URL secret is not configured");
      return new Response(JSON.stringify({ error: "Service configuration error" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const body = await req.json();

    // Validate required fields
    const requiredFields = ["name", "email", "phone", "projectType", "layout", "primaryWall", "ceilingHeight", "style", "budget", "bundle", "timeline"];
    for (const field of requiredFields) {
      if (!body[field] || (typeof body[field] === "string" && body[field].trim() === "")) {
        return new Response(JSON.stringify({ error: `Missing required field: ${field}` }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
    }

    // Build consistent payload with all fields always present
    const payload = {
      name: String(body.name).trim(),
      email: String(body.email).trim(),
      phone: String(body.phone).trim(),
      projectType: String(body.projectType).trim(),
      layout: String(body.layout).trim(),
      primaryWall: `${String(body.primaryWall).trim()} mm`,
      secondaryWall: body.secondaryWall ? `${String(body.secondaryWall).trim()} mm` : "",
      ceilingHeight: `${String(body.ceilingHeight).trim()} mm`,
      obstacles: body.obstacles ? String(body.obstacles).trim() : "",
      style: String(body.style).trim(),
      budget: String(body.budget).trim(),
      bundle: String(body.bundle).trim(),
      timeline: String(body.timeline).trim(),
      layoutOther: body.layoutOther ? String(body.layoutOther).trim() : "",
      styleOther: body.styleOther ? String(body.styleOther).trim() : "",
    };

    const webhookResponse = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const responseText = await webhookResponse.text();

    return new Response(JSON.stringify({ success: true, status: webhookResponse.status }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: "Unable to process request. Please try again." }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
