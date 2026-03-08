const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders })
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

  // Debug: log URL construction
  console.log("N8N_WEBHOOK_URL =", n8nBaseUrl)
  console.log("webhookPath =", webhookPath)

  // Build the full n8n webhook URL
  // N8N_WEBHOOK_URL may be "https://x.app.n8n.cloud/webhook/UUID" or just "https://x.app.n8n.cloud"
  // webhookPath is "/webhook/seller-chatbot", so strip everything from /webhook onward in the base
  const base = n8nBaseUrl.replace(/\/webhook.*$/, '')
  const url = `${base}${webhookPath}`

  console.log("chatbot-proxy →", url)

  try {
    const n8nRes = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-secret': Deno.env.get('N8N_WEBHOOK_SECRET') ?? '',
      },
      body: JSON.stringify(payload ?? {}),
    })

    const responseText = await n8nRes.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      data = { text: responseText };
    }
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
