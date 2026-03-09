import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

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

  let body: { email?: string; code?: string }
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }

  const email = body.email?.trim().toLowerCase()
  const code = body.code?.trim()

  if (!email || !code) {
    return new Response(JSON.stringify({ success: false, error: 'Email and code are required.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  // Look for matching valid code
  const { data: match } = await supabase
    .from('email_verification_codes')
    .select('id, attempts')
    .eq('email', email)
    .eq('code', code)
    .eq('verified', false)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (match) {
    // Valid code found — mark verified
    await supabase
      .from('email_verification_codes')
      .update({ verified: true })
      .eq('id', match.id)

    // Fire-and-forget welcome email (don't block on success)
    (async () => {
      try {
        // Get webhook URL from site_settings
        const { data: webhookSetting } = await supabase
          .from('site_settings')
          .select('value')
          .eq('key', 'otp_email_webhook_url')
          .maybeSingle()

        if (!webhookSetting?.value) {
          console.error('otp_email_webhook_url not configured in site_settings')
          return
        }

        // Get user's full_name from profiles
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('email', email)
          .maybeSingle()

        const userName = profile?.full_name || 'there'
        const toName = profile?.full_name || ''

        // Send welcome email via n8n webhook
        await fetch(webhookSetting.value, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-secret': 'fitmatch-n8n-secret-2026',
          },
          body: JSON.stringify({
            template_key: 'account_welcome',
            to_email: email,
            to_name: toName,
            variables: {
              user_name: userName,
              login_url: 'https://spark-connect-hub-03.lovable.app',
            },
          }),
        })
      } catch (error) {
        console.error('Failed to send welcome email:', error)
      }
    })()

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }

  // No match — find latest code for this email to increment attempts
  const { data: latest } = await supabase
    .from('email_verification_codes')
    .select('id, attempts')
    .eq('email', email)
    .eq('verified', false)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (latest) {
    const newAttempts = (latest.attempts ?? 0) + 1
    await supabase
      .from('email_verification_codes')
      .update({ attempts: newAttempts })
      .eq('id', latest.id)

    if (newAttempts >= 5) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Too many failed attempts. Please request a new code.',
      }), {
        status: 429,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }
  }

  return new Response(JSON.stringify({ success: false, error: 'Invalid or expired code.' }), {
    status: 400,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  })
})
