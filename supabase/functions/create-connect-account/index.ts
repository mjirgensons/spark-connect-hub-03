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
    const siteUrl = Deno.env.get("SITE_URL") || "https://spark-connect-hub-03.lovable.app";

    // Auth: get seller from JWT
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

    // Get seller profile
    const { data: profile, error: profileErr } = await supabase
      .from("profiles")
      .select("email, full_name, company_name, stripe_account_id, user_type")
      .eq("id", userId)
      .single();

    if (profileErr || !profile) {
      return new Response(JSON.stringify({ error: "Profile not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (profile.user_type !== "seller") {
      return new Response(JSON.stringify({ error: "Only sellers can connect Stripe" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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
        JSON.stringify({ error: "Stripe is not configured" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    let accountId = profile.stripe_account_id;

    // Create Connect account if none exists
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        country: "CA",
        email: profile.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: "individual",
        business_profile: {
          name: profile.company_name || profile.full_name,
          product_description: "Kitchen products sold on FitMatch marketplace",
        },
        metadata: {
          fitmatch_user_id: userId,
        },
      });

      accountId = account.id;

      // Save to profile
      await supabase
        .from("profiles")
        .update({
          stripe_account_id: accountId,
          stripe_onboarding_status: "pending",
        })
        .eq("id", userId);
    }

    // Create Account Link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${siteUrl}/seller/dashboard?stripe_refresh=true`,
      return_url: `${siteUrl}/seller/dashboard?stripe_return=true`,
      type: "account_onboarding",
    });

    return new Response(
      JSON.stringify({ url: accountLink.url, account_id: accountId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("create-connect-account error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
