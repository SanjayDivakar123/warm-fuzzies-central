import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-recovery-token',
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return typeof email === 'string' && email.length <= 255 && emailRegex.test(email)
}

function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return typeof str === 'string' && uuidRegex.test(str)
}

async function findAuthUserIdByEmail(supabase: any, email: string): Promise<string | null> {
  const normalizedEmail = email.toLowerCase()
  let page = 1

  while (page <= 10) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 1000,
    })

    if (error) throw error

    const users = data?.users || []
    const match = users.find((user: any) => (user.email || '').toLowerCase() === normalizedEmail)
    if (match?.id) return match.id

    if (users.length < 1000) break
    page += 1
  }

  return null
}

function extractRecoveryToken(req: Request): string | null {
  const headerToken = req.headers.get('x-recovery-token')
  if (headerToken) return headerToken

  const authHeader = req.headers.get('authorization')
  if (authHeader?.toLowerCase().startsWith('bearer ')) {
    return authHeader.slice(7).trim()
  }

  return null
}

function canonicalizeEmail(email: string): string {
  const [rawLocal, rawDomain] = email.toLowerCase().trim().split('@')
  if (!rawLocal || !rawDomain) return email.toLowerCase().trim()

  let local = rawLocal
  const domain = rawDomain

  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    local = local.split('+')[0].replace(/\./g, '')
  }

  return `${local}@${domain}`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ success: false, message: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    const expectedToken = Deno.env.get('RECOVERY_ADMIN_TOKEN')
    if (!expectedToken) {
      return new Response(
        JSON.stringify({ success: false, message: 'Recovery token is not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const providedToken = extractRecoveryToken(req)
    if (!providedToken || providedToken !== expectedToken) {
      return new Response(
        JSON.stringify({ success: false, message: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const body = await req.json()
    const email = String(body?.email || '').toLowerCase().trim()
    const canonicalInputEmail = canonicalizeEmail(email)
    const companyId = body?.companyId ? String(body.companyId).trim() : null
    const dryRun = Boolean(body?.dryRun)

    if (!email || !isValidEmail(email)) {
      return new Response(
        JSON.stringify({ success: false, message: 'A valid email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (companyId && !isValidUUID(companyId)) {
      return new Response(
        JSON.stringify({ success: false, message: 'Invalid companyId format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const authUserId = await findAuthUserIdByEmail(supabase, email)

    let companyUsersQuery = supabase
      .from('company_users')
      .select('id, company_id, email, status, user_id, assessment_result_id, assessment_completed_at')
      .eq('email', email)

    if (companyId) {
      companyUsersQuery = companyUsersQuery.eq('company_id', companyId)
    }

    const { data: companyUsers, error: companyUsersError } = await companyUsersQuery

    if (companyUsersError) {
      throw companyUsersError
    }

    let candidatesQuery = supabase
      .from('candidates')
      .select('id, company_id, email, status, converted_to_employee_id, assessment_result_id, assessment_completed_at')
      .eq('email', email)

    if (companyId) {
      candidatesQuery = candidatesQuery.eq('company_id', companyId)
    }

    const { data: candidates, error: candidatesError } = await candidatesQuery

    if (candidatesError) {
      throw candidatesError
    }

    let companyMatches = companyUsers || []
    let candidateMatches = candidates || []

    if (companyMatches.length === 0 && candidateMatches.length === 0) {
      const localPart = email.split('@')[0]

      if (localPart && localPart.length >= 3) {
        let similarCompanyUsersQuery = supabase
          .from('company_users')
          .select('id, company_id, email, status, user_id, assessment_result_id, assessment_completed_at')
          .ilike('email', `%${localPart}%`)
          .limit(25)

        if (companyId) {
          similarCompanyUsersQuery = similarCompanyUsersQuery.eq('company_id', companyId)
        }

        const { data: similarCompanyUsers } = await similarCompanyUsersQuery

        let similarCandidatesQuery = supabase
          .from('candidates')
          .select('id, company_id, email, status, converted_to_employee_id, assessment_result_id, assessment_completed_at')
          .ilike('email', `%${localPart}%`)
          .limit(25)

        if (companyId) {
          similarCandidatesQuery = similarCandidatesQuery.eq('company_id', companyId)
        }

        const { data: similarCandidates } = await similarCandidatesQuery

        const normalizedCompanyUsers = (similarCompanyUsers || []).map((row: any) => ({
          ...row,
          canonical_email: canonicalizeEmail(row.email || ''),
        }))

        const normalizedCandidates = (similarCandidates || []).map((row: any) => ({
          ...row,
          canonical_email: canonicalizeEmail(row.email || ''),
        }))

        companyMatches = normalizedCompanyUsers.filter((row: any) => row.canonical_email === canonicalInputEmail)
        candidateMatches = normalizedCandidates.filter((row: any) => row.canonical_email === canonicalInputEmail)

        if (companyMatches.length === 0 && candidateMatches.length === 0) {
          return new Response(
            JSON.stringify({
              success: false,
              message: 'No company_users or candidates rows found for this email',
              email,
              suggestions: {
                company_users: normalizedCompanyUsers.map((r: any) => ({ id: r.id, company_id: r.company_id, email: r.email })),
                candidates: normalizedCandidates.map((r: any) => ({ id: r.id, company_id: r.company_id, email: r.email })),
              },
            }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      }
    }

    if (companyMatches.length === 0 && candidateMatches.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'No company_users or candidates rows found for this email',
          email,
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const companyUserIds = new Set<string>()
    const userIdsToSearch = new Set<string>()

    if (authUserId) {
      userIdsToSearch.add(authUserId)
    }

    for (const cu of companyMatches) {
      companyUserIds.add(cu.id)
      if (cu.id) userIdsToSearch.add(cu.id)
      if (cu.user_id) userIdsToSearch.add(cu.user_id)
    }

    for (const c of candidateMatches) {
      if (c.id) userIdsToSearch.add(c.id)
      if (c.converted_to_employee_id) companyUserIds.add(c.converted_to_employee_id)
    }

    const userIdList = Array.from(userIdsToSearch)

    let recoveredResult: any = null

    if (userIdList.length > 0) {
      const { data: resultRows, error: resultError } = await supabase
        .from('assessment_results')
        .select('id, user_id, assessment_type, created_at, updated_at')
        .in('user_id', userIdList)
        .order('updated_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })
        .limit(1)

      if (resultError) {
        throw resultError
      }

      recoveredResult = resultRows?.[0] || null
    }

    if (!recoveredResult) {
      for (const c of candidateMatches) {
        if (c.assessment_result_id) {
          recoveredResult = {
            id: c.assessment_result_id,
            user_id: c.id,
            assessment_type: null,
            created_at: c.assessment_completed_at,
            updated_at: c.assessment_completed_at,
          }
          break
        }
      }
    }

    if (!recoveredResult) {
      for (const cu of companyMatches) {
        if (cu.assessment_result_id) {
          recoveredResult = {
            id: cu.assessment_result_id,
            user_id: cu.user_id || cu.id,
            assessment_type: null,
            created_at: cu.assessment_completed_at,
            updated_at: cu.assessment_completed_at,
          }
          break
        }
      }
    }

    if (!recoveredResult) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'No recoverable assessment result found for this email',
          email,
          inspectedUserIds: userIdList,
          companyUserCount: companyMatches.length,
          candidateCount: candidateMatches.length,
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const completionTimestamp = new Date().toISOString()
    const updates: Array<Record<string, unknown>> = []

    for (const cu of companyMatches) {
      if (!cu.assessment_result_id || !cu.assessment_completed_at || ['invited', 'assessment_pending'].includes(cu.status)) {
        const updatePayload: any = {
          assessment_result_id: recoveredResult.id,
          assessment_completed_at: cu.assessment_completed_at || completionTimestamp,
          status: ['invited', 'assessment_pending'].includes(cu.status) ? 'active' : cu.status,
        }

        if (!cu.user_id && authUserId) {
          updatePayload.user_id = authUserId
        }

        updates.push({ table: 'company_users', id: cu.id, payload: updatePayload })

        if (!dryRun) {
          const { error } = await supabase
            .from('company_users')
            .update(updatePayload)
            .eq('id', cu.id)

          if (error) throw error
        }
      }
    }

    for (const c of candidateMatches) {
      if (!c.assessment_result_id || !c.assessment_completed_at || ['invited', 'applied', 'assessment_pending'].includes(c.status)) {
        const updatePayload: any = {
          assessment_result_id: recoveredResult.id,
          assessment_completed_at: c.assessment_completed_at || completionTimestamp,
          status: ['invited', 'applied', 'assessment_pending'].includes(c.status) ? 'assessment_completed' : c.status,
        }

        updates.push({ table: 'candidates', id: c.id, payload: updatePayload })

        if (!dryRun) {
          const { error } = await supabase
            .from('candidates')
            .update(updatePayload)
            .eq('id', c.id)

          if (error) throw error
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        dryRun,
        email,
        companyId,
        recoveredResult,
        companyUsersMatched: companyMatches.length,
        candidatesMatched: candidateMatches.length,
        updates,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Recovery function error:', error)
    return new Response(
      JSON.stringify({ success: false, message: 'Unexpected recovery failure' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
