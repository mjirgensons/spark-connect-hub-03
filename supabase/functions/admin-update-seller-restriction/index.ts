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
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

  // Dual auth: x-api-secret OR valid JWT + is_admin()
  const apiSecret = req.headers.get("x-api-secret");
  const expectedSecret = Deno.env.get("N8N_WEBHOOK_SECRET");
  const authHeader = req.headers.get("authorization");

  let isAuthorized = false;

  if (apiSecret && apiSecret === expectedSecret) {
    isAuthorized = true;
  } else if (authHeader?.startsWith("Bearer ")) {
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    // Check admin
    const { data: adminRow } = await supabaseAdmin
      .from("admin_emails")
      .select("id")
      .eq("email", userData.user.email || "")
      .maybeSingle();
    if (adminRow) isAuthorized = true;
  }

  if (!isAuthorized) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { seller_id, restriction_status, reason } = await req.json();

    if (!seller_id || !restriction_status) {
      return new Response(
        JSON.stringify({ error: "seller_id and restriction_status are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const validStatuses = ["active", "warning", "restricted", "suspended"];
    if (!validStatuses.includes(restriction_status)) {
      return new Response(
        JSON.stringify({ error: `Invalid restriction_status. Must be one of: ${validStatuses.join(", ")}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update profile
    const updateData: Record<string, unknown> = {
      seller_restriction_status: restriction_status,
      seller_restriction_reason: reason || null,
      seller_restricted_at: restriction_status === "active" ? null : new Date().toISOString(),
    };

    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update(updateData)
      .eq("id", seller_id);

    if (profileError) {
      return new Response(
        JSON.stringify({ error: "Failed to update profile", details: profileError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If restricted/suspended: hide approved products
    if (restriction_status === "restricted" || restriction_status === "suspended") {
      const { error: hideError } = await supabaseAdmin
        .from("products")
        .update({ listing_status: "hidden_enforcement" })
        .eq("seller_id", seller_id)
        .eq("listing_status", "approved");

      if (hideError) {
        console.error("Failed to hide products:", hideError);
      }
    }

    // If active: restore hidden_enforcement products
    if (restriction_status === "active") {
      const { error: restoreError } = await supabaseAdmin
        .from("products")
        .update({ listing_status: "approved" })
        .eq("seller_id", seller_id)
        .eq("listing_status", "hidden_enforcement");

      if (restoreError) {
        console.error("Failed to restore products:", restoreError);
      }
    }

    return new Response(
      JSON.stringify({ success: true, updated_status: restriction_status }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Invalid request body", details: String(err) }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
