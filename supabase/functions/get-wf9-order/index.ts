import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-api-secret",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Auth check
  const secret = req.headers.get("x-api-secret");
  if (secret !== Deno.env.get("N8N_WEBHOOK_SECRET")) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const { order_number, stripe_checkout_session_id, stripe_payment_intent_id } = body ?? {};

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let query;
    if (order_number) {
      query = supabase
        .from("orders")
        .select("*")
        .eq("order_number", order_number)
        .limit(1)
        .single();
    } else if (stripe_checkout_session_id) {
      query = supabase
        .from("orders")
        .select("*")
        .eq("stripe_checkout_session_id", stripe_checkout_session_id)
        .limit(1)
        .single();
    } else if (stripe_payment_intent_id) {
      query = supabase
        .from("orders")
        .select("*")
        .eq("stripe_payment_intent_id", stripe_payment_intent_id)
        .limit(1)
        .single();
    } else {
      return new Response(
        JSON.stringify({ error: "order_number, stripe_checkout_session_id, or stripe_payment_intent_id required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data, error } = await query;

    if (error || !data) {
      return new Response(JSON.stringify({ error: "not_found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ order: data }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message, details: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
