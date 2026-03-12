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

  let table = "communication_logs";
  let limit = 50;
  try {
    const body = await req.json();
    if (body?.table === "conversation_messages") {
      table = "conversation_messages";
    }
    if (body?.limit && Number.isInteger(body.limit) && body.limit > 0) {
      limit = body.limit;
    }
  } catch {
    // no body or invalid JSON — use defaults
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  if (table === "conversation_messages") {
    const { data, error } = await supabase
      .from("conversation_messages")
      .select(`
        id,
        conversation_id,
        sender_id,
        content,
        created_at,
        conversations!conversation_messages_conversation_id_fkey (
          seller_id,
          buyer_id,
          subject
        )
      `)
      .eq("pinecone_synced", false)
      .order("created_at", { ascending: true })
      .limit(limit);

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message, details: error.details }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Flatten the joined conversation data
    const records = (data ?? []).map((row: any) => ({
      id: row.id,
      conversation_id: row.conversation_id,
      sender_id: row.sender_id,
      content: row.content,
      created_at: row.created_at,
      seller_id: row.conversations?.seller_id ?? null,
      buyer_id: row.conversations?.buyer_id ?? null,
      conversation_subject: row.conversations?.subject ?? null,
    }));

    return new Response(
      JSON.stringify(records),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Default: communication_logs
  const { data, error } = await supabase
    .from("communication_logs")
    .select("id, direction, user_id, user_email, user_type, template_key, subject, plain_text_body, from_address, to_address, related_entity_type, related_entity_id, created_at")
    .or("pinecone_synced.is.false,pinecone_synced.is.null")
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message, details: error.details }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify(data ?? []),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
