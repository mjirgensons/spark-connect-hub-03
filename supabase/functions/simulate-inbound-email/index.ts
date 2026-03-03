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

  // Auth: accept either x-api-secret OR a valid admin JWT
  const secret = req.headers.get('x-api-secret')
  const authHeader = req.headers.get('authorization')
  let isAuthorized = false

  if (secret === Deno.env.get('N8N_WEBHOOK_SECRET')) {
    isAuthorized = true
  } else if (authHeader) {
    // Verify JWT and check admin status
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

  let body: { communication_log_id: string; from_email: string; reply_body: string }
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }

  const { communication_log_id, from_email, reply_body } = body
  if (!communication_log_id || !from_email || !reply_body) {
    return new Response(JSON.stringify({ error: 'Missing required fields: communication_log_id, from_email, reply_body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const { data: log, error: logError } = await supabase
    .from('communication_logs')
    .select('*')
    .eq('id', communication_log_id)
    .eq('direction', 'outbound')
    .maybeSingle()

  if (logError || !log) {
    return new Response(JSON.stringify({ error: 'Outbound communication log not found', detail: logError?.message }), {
      status: 404,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }

  const simulatedMessageId = `<simulated-${crypto.randomUUID()}@mg.fitmatch.ca>`

  const payload = {
    sender: from_email,
    recipient: log.to_address || log.user_email,
    subject: `Re: ${log.subject}`,
    'body-plain': `(Simulated) ${reply_body}`,
    'Message-Id': simulatedMessageId,
    'In-Reply-To': log.mailgun_message_id,
  }

  const wf10Url = 'https://sundeco.app.n8n.cloud/webhook/inbound-email'

  try {
    const resp = await fetch(wf10Url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const respText = await resp.text()

    return new Response(JSON.stringify({
      success: resp.ok,
      status: resp.status,
      wf10_response_text: respText.slice(0, 500),
      simulated_message_id: simulatedMessageId,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  } catch (err) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to reach WF-10',
      detail: String(err),
    }), {
      status: 502,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }
})
