import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-api-secret",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders, status: 200 });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const secret = req.headers.get("x-api-secret");
  if (secret !== Deno.env.get("N8N_WEBHOOK_SECRET")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Invalid JSON payload", details: String(err) }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const { action } = body;

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // ACTION: upsert_session
  if (action === "upsert_session") {
    const {
      session_id, seller_id, buyer_id, buyer_email,
      user_role, chatbot_mode, status, consent_given
    } = body as Record<string, unknown>;

    const { error } = await supabase
      .from("chat_sessions")
      .upsert({
        session_id,
        seller_id,
        buyer_id: buyer_id || null,
        buyer_email: buyer_email || null,
        user_role: user_role || "guest",
        chatbot_mode: chatbot_mode || "buyer_inquiry",
        status: status || "active",
        consent_given: consent_given || false,
        last_active_at: new Date().toISOString(),
      }, { onConflict: "session_id" });

    if (error) {
      return new Response(JSON.stringify({ error: error.message, code: error.code }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // ACTION: log_message
  if (action === "log_message") {
    const {
      session_id, message_type, content,
      confidence_score, was_cached, latency_ms
    } = body as Record<string, unknown>;

    const { error } = await supabase
      .from("chat_messages")
      .insert({
        session_id,
        message_type,
        content,
        confidence_score: confidence_score || null,
        was_cached: was_cached || false,
        latency_ms: latency_ms || null,
      });

    if (error) {
      return new Response(JSON.stringify({ error: error.message, code: error.code }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // ACTION: escalate_session
  if (action === "escalate_session") {
    const { session_id, escalation_reason } = body as Record<string, unknown>;

    const { error } = await supabase
      .from("chat_sessions")
      .update({
        status: "escalated",
        escalated_at: new Date().toISOString(),
        escalation_reason,
      })
      .eq("session_id", session_id);

    if (error) {
      return new Response(JSON.stringify({ error: error.message, code: error.code }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ error: "Unknown action" }), {
    status: 400,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
