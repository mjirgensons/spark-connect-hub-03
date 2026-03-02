import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-secret',
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

  const secret = req.headers.get('x-api-secret')
  if (secret !== Deno.env.get('N8N_WEBHOOK_SECRET')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
    console.log('Received payload:', JSON.stringify(body, null, 2))
  } catch (err) {
    console.error('JSON parse error:', err)
    return new Response(JSON.stringify({ error: 'Invalid JSON', details: String(err) }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }

  // Validate required fields
  const missing: string[] = []

  if (!body.email || typeof body.email !== 'string' || !body.email.includes('@')) {
    missing.push('email (must be a string containing @)')
  }
  if (!body.consent_type || typeof body.consent_type !== 'string') {
    missing.push('consent_type')
  }
  if (!body.consent_category || typeof body.consent_category !== 'string') {
    missing.push('consent_category')
  }
  if (typeof body.granted !== 'boolean') {
    missing.push('granted (must be boolean)')
  }
  if (!body.consent_text || typeof body.consent_text !== 'string') {
    missing.push('consent_text')
  }
  if (!body.source || typeof body.source !== 'string') {
    missing.push('source')
  }

  if (missing.length > 0) {
    return new Response(JSON.stringify({ error: 'Missing or invalid fields', fields: missing }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  try {
    const row = {
      email: (body.email as string).trim(),
      user_id: body.user_id ?? null,
      consent_type: body.consent_type as string,
      consent_category: body.consent_category as string,
      granted: body.granted as boolean,
      consent_text: body.consent_text as string,
      source: body.source as string,
      ip_address: body.ip_address ?? null,
      user_agent: body.user_agent ?? null,
    }

    const { data, error } = await supabase
      .from('email_consent_log')
      .insert(row)
      .select()

    if (error) {
      console.error('DB insert error:', error)
      return new Response(JSON.stringify({ error: 'Database error', message: error.message, code: error.code, details: error.details }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    console.log('Insert success:', data)
    return new Response(JSON.stringify({ success: true, data }), {
      status: 201,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  } catch (err) {
    console.error('Unexpected error:', err)
    return new Response(JSON.stringify({ error: 'Unexpected server error', detail: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }
})
