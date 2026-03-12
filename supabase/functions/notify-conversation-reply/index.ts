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

    // ── Throttle checks ──

    // Step 1: Fetch settings
    const { data: settingsRows } = await adminClient
      .from("site_settings")
      .select("key, value")
      .in("key", [
        "message_notification_cooldown_minutes",
        "message_notification_daily_limit",
        "message_send_rate_limit_per_minute",
      ]);

    const settingsMap: Record<string, number> = {};
    for (const row of settingsRows ?? []) {
      settingsMap[row.key] = parseInt(row.value, 10) || 0;
    }
    const cooldownMinutes = settingsMap["message_notification_cooldown_minutes"] ?? 0;
    const dailyLimit = settingsMap["message_notification_daily_limit"] ?? 0;
    const senderRateLimit = settingsMap["message_send_rate_limit_per_minute"] ?? 0;

    const escalationTemplates = ["chatbot_escalation_buyer", "chatbot_escalation_seller"];
    const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

    // Step 2: Cooldown check
    if (cooldownMinutes > 0) {
      const cutoff = new Date(Date.now() - cooldownMinutes * 60 * 1000).toISOString();
      const { count } = await adminClient
        .from("communication_logs")
        .select("id", { count: "exact", head: true })
        .in("template_key", escalationTemplates)
        .eq("to_address", recipientProfile.email)
        .gte("created_at", cutoff);

      if ((count ?? 0) > 0) {
        return new Response(
          JSON.stringify({ success: true, throttled: true, reason: "cooldown" }),
          { headers: jsonHeaders }
        );
      }
    }

    // Step 3: Daily cap check
    if (dailyLimit > 0) {
      const cutoff24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { count } = await adminClient
        .from("communication_logs")
        .select("id", { count: "exact", head: true })
        .in("template_key", escalationTemplates)
        .eq("to_address", recipientProfile.email)
        .gte("created_at", cutoff24h);

      if ((count ?? 0) >= dailyLimit) {
        return new Response(
          JSON.stringify({ success: true, throttled: true, reason: "daily_limit" }),
          { headers: jsonHeaders }
        );
      }
    }

    // Step 4: Sender rate check
    if (senderRateLimit > 0) {
      const cutoff1m = new Date(Date.now() - 60 * 1000).toISOString();
      const { count } = await adminClient
        .from("conversation_messages")
        .select("id", { count: "exact", head: true })
        .eq("sender_id", senderId)
        .gte("created_at", cutoff1m);

      if ((count ?? 0) >= senderRateLimit) {
        return new Response(
          JSON.stringify({ success: true, throttled: true, reason: "sender_rate" }),
          { headers: jsonHeaders }
        );
      }
    }

    // ── All checks passed — fire to n8n ──
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
