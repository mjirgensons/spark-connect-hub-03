import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-api-secret",
};

const ALLOWED_TABLES = ["products", "seller_knowledge_base"] as const;
type AllowedTable = (typeof ALLOWED_TABLES)[number];

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

  let body: { table?: string; ids?: string[] };
  try {
    body = await req.json();
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Invalid JSON payload", details: String(err) }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const { table, ids } = body;

  if (!table || !ALLOWED_TABLES.includes(table as AllowedTable)) {
    return new Response(
      JSON.stringify({
        error: `Invalid table. Must be one of: ${ALLOWED_TABLES.join(", ")}`,
      }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (!Array.isArray(ids) || ids.length === 0) {
    return new Response(
      JSON.stringify({ error: "ids must be a non-empty array of UUIDs" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Products: only pinecone_synced (updated_at has its own trigger)
  // seller_knowledge_base: pinecone_synced + updated_at
  const updatePayload: Record<string, unknown> =
    table === "products"
      ? { pinecone_synced: true }
      : { pinecone_synced: true, updated_at: new Date().toISOString() };

  const { data, error } = await supabase
    .from(table)
    .update(updatePayload)
    .in("id", ids)
    .select("id");

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message, code: error.code, details: error.details }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({ success: true, updated: data?.length ?? 0 }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
