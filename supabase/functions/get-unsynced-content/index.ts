import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-api-secret",
};

const ALLOWED_TABLES = ["products", "seller_knowledge_base", "platform_knowledge_base"] as const;
type AllowedTable = (typeof ALLOWED_TABLES)[number];

const TABLE_COLUMNS: Record<AllowedTable, string> = {
  products: "id, seller_id, title, description, category_id, created_at",
  seller_knowledge_base: "id, seller_id, title, content, kb_type, kb_scope, created_at",
  platform_knowledge_base: "id, title, content, kb_type, created_at",
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

  let table: string | undefined;
  try {
    const body = await req.json();
    table = body?.table;
  } catch {
    // no body or invalid JSON
  }

  if (!table || !ALLOWED_TABLES.includes(table as AllowedTable)) {
    return new Response(
      JSON.stringify({
        error: `Invalid or missing table. Must be one of: ${ALLOWED_TABLES.join(", ")}`,
      }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const columns = TABLE_COLUMNS[table as AllowedTable];

  const { data, error } = await supabase
    .from(table)
    .select(columns)
    .eq("pinecone_synced", false);

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify(data ?? []),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
