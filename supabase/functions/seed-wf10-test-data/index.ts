import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-secret, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }

  // Auth: x-api-secret OR valid admin JWT
  const secret = req.headers.get('x-api-secret')
  const authHeader = req.headers.get('authorization')
  let isAuthorized = false

  if (secret === Deno.env.get('N8N_WEBHOOK_SECRET')) {
    isAuthorized = true
  } else if (authHeader) {
    const token = authHeader.replace('Bearer ', '')
    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    )
    const { data: { user } } = await supabaseAuth.auth.getUser()
    if (user) {
      const adminCheck = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      )
      const { data: adminRow } = await adminCheck
        .from('admin_emails')
        .select('id')
        .eq('email', user.email || '')
        .maybeSingle()
      if (adminRow) isAuthorized = true
    }
  }

  if (!isAuthorized) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  try {
    const testEmail = 'wf10-test@example.com'

    // 1. Check if test profile exists (we can't create one without an auth user)
    let profileId: string | null = null

    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', testEmail)
      .maybeSingle()

    if (existingProfile) {
      profileId = existingProfile.id
    }
    // If no profile exists, we proceed without user_id — that's fine for testing

    // 2. Ensure test order (only if we have a profile)
    let orderId: string | null = null
    const testOrderNumber = 'WF10-TEST-001'

    if (profileId) {
      const { data: existingOrder } = await supabase
        .from('orders')
        .select('id')
        .eq('order_number', testOrderNumber)
        .maybeSingle()

      if (existingOrder) {
        orderId = existingOrder.id
      } else {
        const { data: newOrder, error: orderErr } = await supabase.from('orders').insert({
          order_number: testOrderNumber,
          user_id: profileId,
          status: 'pending',
          payment_status: 'failed',
          subtotal: 499.99,
          shipping_cost: 0,
          tax_amount: 65.00,
          tax_rate: 0.13,
          total: 564.99,
          currency: 'CAD',
          shipping_name: 'WF10 Tester',
          shipping_address_line_1: '123 Test Street',
          shipping_city: 'Toronto',
          shipping_province: 'ON',
          shipping_postal_code: 'M5V 1A1',
          shipping_country: 'CA',
          guest_email: testEmail,
          notes: 'WF-10 test order — safe to delete',
        }).select('id').single()

        if (!orderErr && newOrder) {
          orderId = newOrder.id
        }
      }
    }

    // 3. Insert outbound communication log
    const mailgunMessageId = `<wf10-test-${Date.now()}@mg.fitmatch.ca>`

    const { data: commLog, error: commErr } = await supabase.from('communication_logs').insert({
      direction: 'outbound',
      user_id: profileId,
      user_email: testEmail,
      user_type: 'client',
      template_key: 'payment_failed',
      subject: 'Payment Issue — Order WF10-TEST-001',
      html_body: '<p>WF‑10 test outbound email.</p>',
      plain_text_body: 'WF‑10 test outbound email.',
      from_address: 'orders@fitmatch.ca',
      to_address: testEmail,
      reply_to: 'support@mg.fitmatch.ca',
      mailgun_message_id: mailgunMessageId,
      status: 'sent',
      related_entity_type: orderId ? 'order' : 'communication_log',
      related_entity_id: orderId || undefined,
      locale: 'en-CA',
      pinecone_synced: false,
      error_message: null,
    }).select('id').single()

    if (commErr) {
      return new Response(JSON.stringify({ error: 'Failed to create communication log', detail: commErr.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    // If no order, set related_entity_id to the comm log's own id
    if (!orderId && commLog) {
      await supabase.from('communication_logs').update({
        related_entity_id: commLog.id,
      }).eq('id', commLog.id)
    }

    return new Response(JSON.stringify({
      success: true,
      profile_id: profileId,
      order_id: orderId,
      outbound_log_id: commLog.id,
      mailgun_message_id: mailgunMessageId,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Unexpected error', detail: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }
})
