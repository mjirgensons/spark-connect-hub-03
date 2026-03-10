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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ success: false, error: "Missing auth" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const n8nSecret = Deno.env.get("N8N_WEBHOOK_SECRET")!;

    // Verify JWT and get sender
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userErr } = await anonClient.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ success: false, error: "Invalid auth" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const senderId = user.id;

    const { conversation_id, message_content } = await req.json();
    if (!conversation_id || !message_content) {
      return new Response(JSON.stringify({ success: false, error: "Missing fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceKey);

    // Get conversation
    const { data: conv, error: convErr } = await adminClient
      .from("conversations")
      .select("buyer_id, seller_id")
      .eq("id", conversation_id)
      .single();
    if (convErr || !conv) {
      return new Response(JSON.stringify({ success: false, error: "Conversation not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const isBuyer = senderId === conv.buyer_id;
    const recipientId = isBuyer ? conv.seller_id : conv.buyer_id;

    // Get profiles
    const { data: profiles } = await adminClient
      .from("profiles")
      .select("id, full_name, email")
      .in("id", [senderId, recipientId]);

    const senderProfile = profiles?.find((p: any) => p.id === senderId);
    const recipientProfile = profiles?.find((p: any) => p.id === recipientId);

    if (!senderProfile || !recipientProfile || !recipientProfile.email) {
      return new Response(JSON.stringify({ success: false, error: "Profile not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fire to n8n
    await fetch("https://sundeco.app.n8n.cloud/webhook/conversation-reply-notify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-secret": n8nSecret,
      },
      body: JSON.stringify({
        sender_name: senderProfile.full_name || "User",
        sender_role: isBuyer ? "buyer" : "seller",
        recipient_email: recipientProfile.email,
        recipient_name: recipientProfile.full_name || "User",
        recipient_role: isBuyer ? "seller" : "buyer",
        message_preview: String(message_content).substring(0, 200),
        conversation_id,
      }),
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
