import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

  // Extract authenticated user from JWT (if present)
  let buyerId: string | null = null;
  const authHeader = req.headers.get("Authorization");
  if (authHeader) {
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
      const anonClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user } } = await anonClient.auth.getUser();
      if (user) {
        buyerId = user.id;
      }
    } catch {
      // Guest user — buyer_id stays null
    }
  }

  // Debug: log URL construction
  console.log("N8N_WEBHOOK_URL =", n8nBaseUrl)
  console.log("webhookPath =", webhookPath)

  // Build the full n8n webhook URL
  const base = n8nBaseUrl.replace(/\/webhook.*$/, '')
  const url = `${base}${webhookPath}`

  console.log("chatbot-proxy →", url)

  // Inject buyer_id into the payload forwarded to n8n
  const forwardPayload = { ...(payload ?? {}), buyer_id: buyerId };

  try {
    const n8nRes = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-secret': Deno.env.get('N8N_WEBHOOK_SECRET') ?? '',
      },
      body: JSON.stringify(forwardPayload),
    })

    const responseText = await n8nRes.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      data = { text: responseText };
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
