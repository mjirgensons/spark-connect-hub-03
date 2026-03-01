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
    return new Response(JSON.stringify({ error: 'Invalid JSON payload', detail: String(err) }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }

  // Sanitise: ensure user_id is null not undefined, metadata is object
  if (!body.user_id) body.user_id = null
  if (typeof body.metadata !== 'object' || body.metadata === null) {
    body.metadata = {}
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  try {
    const { data, error } = await supabase
      .from('communication_logs')
      .insert(body)
      .select()

    if (error) {
      console.error('DB insert error:', error)
      return new Response(JSON.stringify({ error: error.message, code: error.code, details: error.details }), {
        status: 400,
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
