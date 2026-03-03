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

  // Auth: x-api-secret OR valid admin JWT
  const secret = req.headers.get('x-api-secret')
  const authHeader = req.headers.get('authorization')
  let isAuthorized = false

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

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
      const { data: adminRow } = await supabase
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

  const testEmail = 'wf10-test@example.com'
  const fullName = 'WF10 Tester'
  const userType = 'client'

  try {
    // Check if user already exists in auth.users via admin API
    const { data: existingUsers } = await supabase.auth.admin.listUsers()
    const existingUser = existingUsers?.users?.find(u => u.email === testEmail)

    let userId: string

    if (existingUser) {
      userId = existingUser.id
      // Ensure profile is up to date
      await supabase.from('profiles').upsert({
        id: userId,
        email: testEmail,
        full_name: fullName,
        user_type: userType,
      }, { onConflict: 'id' })
    } else {
      // Create auth user — the handle_new_user trigger will create the profile
      const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
        email: testEmail,
        password: 'WF10-test-2024!',
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          user_type: userType,
        },
      })

      if (createErr) {
        return new Response(JSON.stringify({ error: 'Failed to create auth user', detail: createErr.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        })
      }

      userId = newUser.user.id

      // Update profile in case trigger values differ
      await supabase.from('profiles').update({
        full_name: fullName,
        user_type: userType,
      }).eq('id', userId)
    }

    return new Response(JSON.stringify({
      success: true,
      profile_id: userId,
      email: testEmail,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Unexpected error', detail: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }
})
