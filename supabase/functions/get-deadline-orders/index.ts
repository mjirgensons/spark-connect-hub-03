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

  const apiSecret = req.headers.get("x-api-secret");
  const expectedSecret = Deno.env.get("N8N_WEBHOOK_SECRET");
  if (!apiSecret || apiSecret !== expectedSecret) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  let body: { action?: string; order_id?: string; notification_key?: string };
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  // Handle mark_sent action
  if (body.action === "mark_sent") {
    const { order_id, notification_key } = body;
    if (!order_id || !notification_key) {
      return new Response(
        JSON.stringify({ error: "order_id and notification_key are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch current deadline_notifications_sent
    const { data: order, error: fetchErr } = await supabase
      .from("orders")
      .select("deadline_notifications_sent")
      .eq("id", order_id)
      .single();

    if (fetchErr || !order) {
      return new Response(
        JSON.stringify({ error: "Order not found", details: fetchErr?.message }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const notifications = (order.deadline_notifications_sent as Record<string, string>) || {};
    notifications[notification_key] = new Date().toISOString();

    const updatePayload: Record<string, any> = { deadline_notifications_sent: notifications };
    if (notification_key === "delivery_check") {
      updatePayload.delivery_check_sent_at = new Date().toISOString();
    }

    const { error: updateErr } = await supabase
      .from("orders")
      .update(updatePayload)
      .eq("id", order_id);

    if (updateErr) {
      return new Response(
        JSON.stringify({ error: "Update failed", details: updateErr.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Default action: fetch all deadline orders
  const selectFields = "id, order_number, status, guest_email, user_id, seller_id, must_acknowledge_by, must_ship_by, delivery_expected_by, tracking_number, tracking_url, deadline_notifications_sent, shipping_name";

  const now = new Date().toISOString();

  // Helper to enrich orders with buyer/seller info
  async function enrichOrders(orders: any[], category: string) {
    if (!orders || orders.length === 0) return [];

    const userIds = [...new Set(orders.flatMap((o: any) => [o.user_id, o.seller_id].filter(Boolean)))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", userIds);

    const profileMap: Record<string, any> = {};
    for (const p of profiles || []) {
      profileMap[p.id] = p;
    }

    return orders.map((o: any) => {
      const buyerProfile = o.user_id ? profileMap[o.user_id] : null;
      const sellerProfile = o.seller_id ? profileMap[o.seller_id] : null;
      return {
        ...o,
        category,
        buyer_name: buyerProfile?.full_name || o.shipping_name || null,
        buyer_email: buyerProfile?.email || o.guest_email || null,
        seller_name: sellerProfile?.full_name || null,
        seller_email: sellerProfile?.email || null,
      };
    });
  }

  try {
    const results: any[] = [];

    // 1. ack_reminder: paid, within 6h of deadline, not yet sent
    const { data: ackReminder, error: e1 } = await supabase
      .from("orders")
      .select(selectFields)
      .eq("status", "paid")
      .not("must_acknowledge_by", "is", null)
      .gt("must_acknowledge_by", now)
      .lte("must_acknowledge_by", new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString())
      .is("deadline_notifications_sent->ack_reminder", null);
    if (e1) throw e1;
    results.push(...await enrichOrders(ackReminder || [], "ack_reminder"));

    // 2. ack_overdue: paid, past deadline
    const { data: ackOverdue, error: e2 } = await supabase
      .from("orders")
      .select(selectFields)
      .eq("status", "paid")
      .not("must_acknowledge_by", "is", null)
      .lte("must_acknowledge_by", now)
      .is("deadline_notifications_sent->ack_overdue", null);
    if (e2) throw e2;
    results.push(...await enrichOrders(ackOverdue || [], "ack_overdue"));

    // 3. ship_reminder: preparing, within 24h of deadline
    const { data: shipReminder, error: e3 } = await supabase
      .from("orders")
      .select(selectFields)
      .eq("status", "preparing")
      .not("must_ship_by", "is", null)
      .gt("must_ship_by", now)
      .lte("must_ship_by", new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString())
      .is("deadline_notifications_sent->ship_reminder", null);
    if (e3) throw e3;
    results.push(...await enrichOrders(shipReminder || [], "ship_reminder"));

    // 4. ship_overdue: preparing, past deadline
    const { data: shipOverdue, error: e4 } = await supabase
      .from("orders")
      .select(selectFields)
      .eq("status", "preparing")
      .not("must_ship_by", "is", null)
      .lte("must_ship_by", now)
      .is("deadline_notifications_sent->ship_overdue", null);
    if (e4) throw e4;
    results.push(...await enrichOrders(shipOverdue || [], "ship_overdue"));

    // 5. ship_overdue_48h: preparing, 48h+ past deadline
    const { data: shipOverdue48, error: e5 } = await supabase
      .from("orders")
      .select(selectFields)
      .eq("status", "preparing")
      .not("must_ship_by", "is", null)
      .lte("must_ship_by", new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString())
      .is("deadline_notifications_sent->ship_overdue_48h", null);
    if (e5) throw e5;
    results.push(...await enrichOrders(shipOverdue48 || [], "ship_overdue_48h"));

    // 6. delivery_check: shipped/in_transit/ready_for_pickup, past expected delivery
    const { data: deliveryCheck, error: e6 } = await supabase
      .from("orders")
      .select(selectFields)
      .in("status", ["shipped", "in_transit", "ready_for_pickup"])
      .not("delivery_expected_by", "is", null)
      .lte("delivery_expected_by", now)
      .is("delivery_check_sent_at", null);
    if (e6) throw e6;
    results.push(...await enrichOrders(deliveryCheck || [], "delivery_check"));

    return new Response(
      JSON.stringify({ orders: results, count: results.length }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: "Query failed", details: err.message || String(err) }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
