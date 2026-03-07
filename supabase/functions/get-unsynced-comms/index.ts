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

  let limit = 100;
  try {
    const body = await req.json();
    if (body?.limit && Number.isInteger(body.limit) && body.limit > 0) {
      limit = body.limit;
    }
  } catch {
    // no body or invalid JSON — use default limit
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data, error } = await supabase
    .from("communication_logs")
    .select("*")
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
    JSON.stringify({ success: true, count: data.length, records: data }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
