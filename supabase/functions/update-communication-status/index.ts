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
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Invalid JSON payload', detail: String(err) }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }

  const { mailgun_message_id, status, opened_at, clicked_at, error_message } = body as {
    mailgun_message_id?: string
    status?: string
    opened_at?: string | null
    clicked_at?: string | null
    error_message?: string | null
  }

  if (!mailgun_message_id || typeof mailgun_message_id !== 'string') {
    return new Response(JSON.stringify({ error: 'mailgun_message_id is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }

  if (!status || typeof status !== 'string') {
    return new Response(JSON.stringify({ error: 'status is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  try {
    // Fetch existing row first to check current opened_at / clicked_at
    const { data: existing, error: fetchError } = await supabase
      .from('communication_logs')
      .select('id, opened_at, clicked_at')
      .eq('mailgun_message_id', mailgun_message_id)
      .limit(1)
      .maybeSingle()

    if (fetchError) {
      return new Response(JSON.stringify({ error: fetchError.message, code: fetchError.code, details: fetchError.details }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    if (!existing) {
      return new Response(JSON.stringify({ error: 'No communication log found for this message ID' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    // Build update payload — only include fields that should change
    const updates: Record<string, unknown> = { status }

    // First-open wins
    if (opened_at !== undefined && opened_at !== null && existing.opened_at === null) {
      updates.opened_at = opened_at
    }

    // First-click wins
    if (clicked_at !== undefined && clicked_at !== null && existing.clicked_at === null) {
      updates.clicked_at = clicked_at
    }

    // error_message: overwrite if provided in body
    if ('error_message' in body) {
      updates.error_message = error_message ?? null
    }

    const { data, error } = await supabase
      .from('communication_logs')
      .update(updates)
      .eq('id', existing.id)
      .select()
      .single()

    if (error) {
      return new Response(JSON.stringify({ error: error.message, code: error.code, details: error.details }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Unexpected server error', detail: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }
})
