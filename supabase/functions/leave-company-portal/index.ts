import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function isValidUUID(value: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i
  return typeof value === 'string' && uuidRegex.test(value)
}

function isValidInviteCode(value: string): boolean {
  return typeof value === 'string' && /^[A-Z0-9]{8}$/.test(value.toUpperCase())
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ success: false, message: 'Method not allowed' }, 405)
  }

  try {
    const { companyUserId, companyId, inviteCode } = await req.json()

    if (!companyUserId || !companyId) {
      return jsonResponse({ success: false, message: 'companyUserId and companyId are required' }, 400)
    }

    if (!isValidUUID(companyUserId) || !isValidUUID(companyId)) {
      return jsonResponse({ success: false, message: 'Invalid id format' }, 400)
    }

    if (inviteCode && !isValidInviteCode(inviteCode)) {
      return jsonResponse({ success: false, message: 'Invalid invite code format' }, 400)
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const authHeader = req.headers.get('Authorization') ?? ''

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data: member, error: memberError } = await supabase
      .from('company_users')
      .select('id, company_id, user_id, email, role, status, invite_code')
      .eq('id', companyUserId)
      .eq('company_id', companyId)
      .maybeSingle()

    if (memberError) {
      console.error('Member lookup error:', memberError)
      return jsonResponse({ success: false, message: 'Failed to load portal membership' }, 500)
    }

    if (!member || member.status === 'revoked') {
      return jsonResponse({ success: false, message: 'Portal membership not found' }, 404)
    }

    let authorized = false
    if (inviteCode && member.invite_code === inviteCode.toUpperCase()) {
      authorized = true
    }

    if (!authorized && authHeader) {
      const authClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } },
      })
      const {
        data: { user },
      } = await authClient.auth.getUser()

      const userEmail = user?.email?.toLowerCase()
      const memberEmail = member.email?.toLowerCase()
      authorized = Boolean(user?.id && (member.user_id === user.id || memberEmail === userEmail))
    }

    if (!authorized) {
      return jsonResponse({ success: false, message: 'You can only leave your own portal membership' }, 403)
    }

    if (member.role === 'admin') {
      const { count, error: countError } = await supabase
        .from('company_users')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .eq('role', 'admin')
        .neq('status', 'revoked')

      if (countError) {
        console.error('Admin count error:', countError)
        return jsonResponse({ success: false, message: 'Could not verify admin coverage' }, 500)
      }

      if ((count ?? 0) <= 1) {
        return jsonResponse(
          {
            success: false,
            message: 'You are the only active admin. Add another admin before leaving this portal.',
          }
        )
      }
    }

    const { error: primaryError } = await supabase
      .from('task_assignments')
      .update({ primary_assignee_id: null })
      .eq('primary_assignee_id', companyUserId)

    if (primaryError) {
      console.error('Error clearing primary assignments:', primaryError)
    }

    const { error: secondaryError } = await supabase
      .from('task_assignments')
      .update({ secondary_assignee_id: null })
      .eq('secondary_assignee_id', companyUserId)

    if (secondaryError) {
      console.error('Error clearing secondary assignments:', secondaryError)
    }

    const { error: deleteError } = await supabase
      .from('company_users')
      .delete()
      .eq('id', companyUserId)
      .eq('company_id', companyId)

    if (deleteError) {
      console.error('Membership delete error:', deleteError)
      return jsonResponse({ success: false, message: 'Unable to leave this portal right now' }, 500)
    }

    return jsonResponse({ success: true, message: 'You have left this portal.' })
  } catch (error) {
    console.error('Unexpected leave-company-portal error:', error)
    return jsonResponse({ success: false, message: 'An unexpected error occurred' }, 500)
  }
})
