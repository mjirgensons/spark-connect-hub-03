const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
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

  let body: { webhookPath?: string; payload?: Record<string, unknown> }
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }

  const { webhookPath, payload } = body

  if (!webhookPath || typeof webhookPath !== 'string') {
    return new Response(JSON.stringify({ error: 'webhookPath is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }

  const n8nBaseUrl = Deno.env.get('N8N_WEBHOOK_URL')
  if (!n8nBaseUrl) {
    return new Response(JSON.stringify({ error: 'N8N_WEBHOOK_URL not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }

  // Build the full n8n webhook URL — strip trailing slash from base, prepend webhookPath
  const base = n8nBaseUrl.replace(/\/webhook\/?$/, '').replace(/\/$/, '')
  const url = `${base}${webhookPath}`

  try {
    const n8nRes = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-secret': Deno.env.get('N8N_WEBHOOK_SECRET') ?? '',
      },
      body: JSON.stringify(payload ?? {}),
    })

    let data;
    try {
      data = await n8nRes.json();
    } catch {
      const text = await n8nRes.text();
      data = { text };
    }

    return new Response(JSON.stringify(data), {
      status: n8nRes.status,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 502,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }
})
