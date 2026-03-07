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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: authErr } = await userClient.auth.getUser();
    if (authErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = userData.user.id;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_account_id")
      .eq("id", userId)
      .single();

    if (!profile?.stripe_account_id) {
      return new Response(
        JSON.stringify({
          connected: false,
          charges_enabled: false,
          payouts_enabled: false,
          onboarding_status: "not_started",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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
    const account = await stripe.accounts.retrieve(profile.stripe_account_id);

    const chargesEnabled = account.charges_enabled || false;
    const payoutsEnabled = account.payouts_enabled || false;
    let onboardingStatus = "pending";
    if (chargesEnabled && payoutsEnabled) {
      onboardingStatus = "complete";
    } else if (account.details_submitted) {
      onboardingStatus = "under_review";
    }

    // Update profile with latest status
    await supabase
      .from("profiles")
      .update({
        stripe_charges_enabled: chargesEnabled,
        stripe_payouts_enabled: payoutsEnabled,
        stripe_onboarding_status: onboardingStatus,
      })
      .eq("id", userId);

    return new Response(
      JSON.stringify({
        connected: true,
        charges_enabled: chargesEnabled,
        payouts_enabled: payoutsEnabled,
        onboarding_status: onboardingStatus,
        details_submitted: account.details_submitted || false,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("get-connect-status error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
