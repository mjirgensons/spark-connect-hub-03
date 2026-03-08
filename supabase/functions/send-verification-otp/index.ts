import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

  let body: { email?: string }
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }

  const email = body.email?.trim().toLowerCase()
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return new Response(JSON.stringify({ success: false, error: 'Invalid email address.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  // Rate limit: 1 code per 60 seconds
  const { data: recentCodes } = await supabase
    .from('email_verification_codes')
    .select('id')
    .eq('email', email)
    .gte('created_at', new Date(Date.now() - 60_000).toISOString())
    .limit(1)

  if (recentCodes && recentCodes.length > 0) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Please wait 60 seconds before requesting a new code.',
      retry_after: 60,
    }), {
      status: 429,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }

  // Max 5 codes per hour
  const { count } = await supabase
    .from('email_verification_codes')
    .select('id', { count: 'exact', head: true })
    .eq('email', email)
    .gte('created_at', new Date(Date.now() - 3_600_000).toISOString())

  if (count !== null && count >= 5) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Too many verification attempts. Please try again in 1 hour.',
    }), {
      status: 429,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }

  // Generate 6-digit code
  const arr = new Uint32Array(1)
  crypto.getRandomValues(arr)
  const code = String(arr[0] % 1_000_000).padStart(6, '0')

  // Insert code
  const expiresAt = new Date(Date.now() + 10 * 60_000).toISOString()
  const { error: insertErr } = await supabase
    .from('email_verification_codes')
    .insert({ email, code, expires_at: expiresAt, verified: false, attempts: 0 })

  if (insertErr) {
    return new Response(JSON.stringify({ success: false, error: 'Failed to create verification code.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }

  // Get n8n webhook URL from site_settings
  const { data: setting } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', 'otp_email_webhook_url')
    .maybeSingle()

  const webhookUrl = setting?.value
  if (!webhookUrl) {
    console.error('[send-verification-otp] otp_email_webhook_url not configured in site_settings')
    // Still return success — code is saved, admin can fix webhook config
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }

  // Call n8n WF-8 email dispatcher
  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-secret': 'fitmatch-n8n-secret-2026',
      },
      body: JSON.stringify({
        template_key: 'email_verification_otp',
        to_email: email,
        to_name: '',
        variables: { otp_code: code },
      }),
    })
  } catch (err) {
    console.error('[send-verification-otp] Failed to call n8n webhook:', err)
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  })
})
