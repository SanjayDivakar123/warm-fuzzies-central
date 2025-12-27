import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Input validation helpers
function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return typeof str === 'string' && uuidRegex.test(str)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.log('No authorization header provided');
      return new Response(
        JSON.stringify({ success: false, message: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Verify user's JWT
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    
    if (authError || !user) {
      console.log('Invalid token:', authError?.message);
      return new Response(
        JSON.stringify({ success: false, message: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { employeeId, companyId } = body;

    // Input validation
    if (!employeeId || !companyId) {
      return new Response(
        JSON.stringify({ success: false, message: 'Employee ID and company ID are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!isValidUUID(employeeId)) {
      return new Response(
        JSON.stringify({ success: false, message: 'Invalid employee ID format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!isValidUUID(companyId)) {
      return new Response(
        JSON.stringify({ success: false, message: 'Invalid company ID format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Fetching employee data:', employeeId, 'company:', companyId)

    // Create service role client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify caller is an admin for this company
    const { data: adminCheck } = await supabase
      .from('company_users')
      .select('role')
      .eq('company_id', companyId)
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .eq('status', 'active')
      .maybeSingle();

    if (!adminCheck) {
      console.log('User is not a company admin');
      return new Response(
        JSON.stringify({ success: false, message: 'Forbidden: You must be a company admin' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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
