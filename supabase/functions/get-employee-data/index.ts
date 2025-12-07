import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { employeeId, companyId } = await req.json()

    console.log('Fetching employee data:', employeeId, 'company:', companyId)

    if (!employeeId || !companyId) {
      return new Response(
        JSON.stringify({ success: false, message: 'Employee ID and company ID are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Fetch employee with assessment results
    const { data: employee, error: empError } = await supabase
      .from('company_users')
      .select('*')
      .eq('id', employeeId)
      .eq('company_id', companyId)
      .maybeSingle()

    if (empError || !employee) {
      console.error('Employee not found:', empError)
      return new Response(
        JSON.stringify({ success: false, message: 'Employee not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch assessment results if completed
    let assessmentResults = null
    if (employee.assessment_result_id) {
      const { data: results, error: resultsError } = await supabase
        .from('assessment_results')
        .select('*')
        .eq('id', employee.assessment_result_id)
        .maybeSingle()

      if (!resultsError && results) {
        assessmentResults = results
      }
    }

    console.log('Employee data fetched successfully')

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
          assessment_result_id: employee.assessment_result_id
        },
        assessmentResults
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
