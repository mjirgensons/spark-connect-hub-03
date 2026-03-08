import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

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
    const { email, consent_type, session_id, page_url, marketing_opt_in } = await req.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ error: "Invalid email" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const userAgent = req.headers.get("user-agent") ?? "";
    const now = new Date().toISOString();
    const sixMonths = new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000).toISOString();

    // Skip duplicate within 5 minutes
    const { data: recent } = await supabase
      .from("marketing_consents")
      .select("id")
      .eq("email", email)
      .eq("consent_type", "implied_inquiry")
      .gte("consent_at", new Date(Date.now() - 5 * 60 * 1000).toISOString())
      .limit(1);

    if (!recent || recent.length === 0) {
      await supabase.from("marketing_consents").insert({
        email,
        consent_type: "implied_inquiry",
        consent_source: "chatbot_registration",
        implied_expires_at: sixMonths,
        casl_proof: { page_url, session_id, timestamp: now, user_agent: userAgent },
      });
    }

    if (marketing_opt_in === true) {
      const { data: recentExpress } = await supabase
        .from("marketing_consents")
        .select("id")
        .eq("email", email)
        .eq("consent_type", "express_marketing")
        .gte("consent_at", new Date(Date.now() - 5 * 60 * 1000).toISOString())
        .limit(1);

      if (!recentExpress || recentExpress.length === 0) {
        await supabase.from("marketing_consents").insert({
          email,
          consent_type: "express_marketing",
          consent_source: "chatbot_registration",
          casl_proof: { page_url, session_id, timestamp: now, user_agent: userAgent },
        });
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
