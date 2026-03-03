import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-secret, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

function jsonResponse(status: number, body: any) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return jsonResponse(405, { success: false, stage: 'auth', error: 'Method not allowed' })
  }

  // Auth: accept either x-api-secret OR a valid admin JWT
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
    return jsonResponse(401, { success: false, stage: 'auth', error: 'unauthorized' })
  }

  let body: { communication_log_id: string; from_email: string; reply_body: string }
  try {
    body = await req.json()
  } catch {
    return jsonResponse(400, { success: false, stage: 'parse', error: 'Invalid JSON' })
  }

  const { communication_log_id, from_email, reply_body } = body
  if (!communication_log_id || !from_email || !reply_body) {
    return jsonResponse(400, { success: false, stage: 'parse', error: 'Missing required fields: communication_log_id, from_email, reply_body' })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Load outbound log
  const { data: log, error: logError } = await supabase
    .from('communication_logs')
    .select('*')
    .eq('id', communication_log_id)
    .eq('direction', 'outbound')
    .single()

  if (logError || !log) {
    return jsonResponse(404, {
      success: false,
      stage: 'load-log',
      error: logError || 'OUTBOUND_LOG_NOT_FOUND',
    })
  }

  // Validate mailgun_message_id
  if (!log.mailgun_message_id || typeof log.mailgun_message_id !== 'string' || !log.mailgun_message_id.trim()) {
    return jsonResponse(400, {
      success: false,
      stage: 'validate-mailgun-id',
      error: 'Selected communication log has no mailgun_message_id. Use an email sent by WF-8.',
      outbound_log_id: log.id,
    })
  }

  // Build Mailgun-style payload
  const simulatedMessageId = `<simulated-${crypto.randomUUID()}@mg.fitmatch.ca>`
  const payload = {
    sender: from_email,
    recipient: log.to_address || log.user_email,
    subject: `Re: ${log.subject}`,
    'body-plain': reply_body,
    'Message-Id': simulatedMessageId,
    'In-Reply-To': log.mailgun_message_id,
  }

  // POST to WF-10
  const wf10Url = 'https://sundeco.app.n8n.cloud/webhook/inbound-email'

  try {
    const wf10Resp = await fetch(wf10Url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const wf10Text = await wf10Resp.text()

    return jsonResponse(wf10Resp.ok ? 200 : 500, {
      success: wf10Resp.ok,
      stage: 'done',
      wf10_status: wf10Resp.status,
      wf10_response_text: wf10Text.slice(0, 500),
      outbound_log: {
        id: log.id,
        user_email: log.user_email,
        to_address: log.to_address,
        subject: log.subject,
        mailgun_message_id: log.mailgun_message_id,
        related_entity_type: log.related_entity_type,
        related_entity_id: log.related_entity_id,
      },
      payload_sent_to_wf10: payload,
    })
  } catch (err) {
    return jsonResponse(502, {
      success: false,
      stage: 'done',
      error: 'Failed to reach WF-10',
      detail: String(err),
    })
  }
})
