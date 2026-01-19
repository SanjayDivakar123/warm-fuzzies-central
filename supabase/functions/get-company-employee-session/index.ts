import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return typeof str === 'string' && uuidRegex.test(str)
}

function isValidInviteCode(code: string): boolean {
  const codeRegex = /^[A-Z0-9]{8}$/
  return typeof code === 'string' && codeRegex.test(code.toUpperCase())
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { employeeId, companyId, inviteCode } = body ?? {}

    if (!employeeId || !companyId || !inviteCode) {
      return new Response(
        JSON.stringify({ success: false, message: 'employeeId, companyId, and inviteCode are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!isValidUUID(employeeId) || !isValidUUID(companyId)) {
      return new Response(
        JSON.stringify({ success: false, message: 'Invalid id format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!isValidInviteCode(inviteCode)) {
      return new Response(
        JSON.stringify({ success: false, message: 'Invalid invite code format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data: employee, error: empError } = await supabase
      .from('company_users')
      .select('*')
      .eq('id', employeeId)
      .eq('company_id', companyId)
      .eq('invite_code', inviteCode.toUpperCase())
      .maybeSingle()

    if (empError) {
      console.error('Employee lookup error:', empError)
      return new Response(
        JSON.stringify({ success: false, message: 'Failed to load employee' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!employee) {
      return new Response(
        JSON.stringify({ success: false, message: 'Invalid session' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (employee.status === 'revoked') {
      return new Response(
        JSON.stringify({ success: false, message: 'Access revoked' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let assessmentResults: any = null
    if (employee.assessment_result_id) {
      const { data: resultRow, error: resultError } = await supabase
        .from('assessment_results')
        .select('results')
        .eq('id', employee.assessment_result_id)
        .maybeSingle()

      if (resultError) {
        console.error('Assessment result fetch error:', resultError)
      } else {
        assessmentResults = resultRow
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        employee: {
          id: employee.id,
          email: employee.email,
          role: employee.role,
          status: employee.status,
          invite_code: employee.invite_code,
          user_id: employee.user_id,
          assessment_completed_at: employee.assessment_completed_at,
          assessment_result_id: employee.assessment_result_id,
        },
        assessmentResults,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ success: false, message: 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
