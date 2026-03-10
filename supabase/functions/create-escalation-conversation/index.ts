import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-api-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  // Auth: x-api-secret must match N8N_WEBHOOK_SECRET
  const secret = req.headers.get("x-api-secret");
  const expected = Deno.env.get("N8N_WEBHOOK_SECRET");
  if (!secret || secret !== expected) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  let body: {
    chat_session_id?: string;
    seller_id?: string;
    buyer_id?: string;
    buyer_email?: string;
    subject?: string;
    first_message?: string;
  };

  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  const { chat_session_id, seller_id, buyer_id, buyer_email, subject, first_message } = body;

  // Validate required fields
  if (!buyer_id) {
    return new Response(
      JSON.stringify({ success: false, error: "buyer_id required" }),
      { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  if (!seller_id || !chat_session_id || !first_message) {
    return new Response(
      JSON.stringify({ success: false, error: "seller_id, chat_session_id, and first_message are required" }),
      { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    // Look up chat_sessions row by session_id to get the internal uuid
    const { data: chatSession, error: sessionErr } = await supabase
      .from("chat_sessions")
      .select("id")
      .eq("session_id", chat_session_id)
      .maybeSingle();

    if (sessionErr) throw sessionErr;
    if (!chatSession) {
      return new Response(
        JSON.stringify({ success: false, error: "chat_session not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate seller exists
    const { data: sellerProfile, error: sellerErr } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", seller_id)
      .maybeSingle();

    if (sellerErr) throw sellerErr;
    if (!sellerProfile) {
      return new Response(
        JSON.stringify({ success: false, error: "seller_id not found in profiles" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Insert conversation
    const { data: conversation, error: convErr } = await supabase
      .from("conversations")
      .insert({
        seller_id,
        buyer_id,
        subject: subject || "Chatbot Escalation",
        status: "escalated",
        escalation_chat_session_id: chatSession.id,
        seller_unread_count: 1,
      })
      .select("id")
      .single();

    if (convErr) throw convErr;

    // Insert first message
    const { error: msgErr } = await supabase
      .from("conversation_messages")
      .insert({
        conversation_id: conversation.id,
        sender_id: buyer_id,
        content: first_message,
      });

    if (msgErr) throw msgErr;

    console.log(`Escalation conversation created: ${conversation.id} for session ${chat_session_id}`);

    return new Response(
      JSON.stringify({ success: true, conversation_id: conversation.id }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (err) {
    console.error("Error creating escalation conversation:", err);
    return new Response(
      JSON.stringify({ success: false, error: String(err) }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
