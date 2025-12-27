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

function isValidResults(results: unknown): boolean {
  if (!results || typeof results !== 'object') return false
  // Basic validation - ensure it's an object and not too large
  const jsonStr = JSON.stringify(results)
  return jsonStr.length <= 50000 // Max 50KB for results JSON
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { employeeId, companyId, results } = body

    // Input validation
    if (!employeeId || !companyId || !results) {
      return new Response(
        JSON.stringify({ success: false, message: 'Employee ID, company ID, and results are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate UUID formats
    if (!isValidUUID(employeeId)) {
      console.log('Invalid employee ID format')
      return new Response(
        JSON.stringify({ success: false, message: 'Invalid employee ID format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!isValidUUID(companyId)) {
      console.log('Invalid company ID format')
      return new Response(
        JSON.stringify({ success: false, message: 'Invalid company ID format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!isValidResults(results)) {
      console.log('Invalid results format or size')
      return new Response(
        JSON.stringify({ success: false, message: 'Invalid results format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Saving assessment for employee:', employeeId, 'company:', companyId)

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verify the employee belongs to this company
    const { data: employee, error: lookupError } = await supabase
      .from('company_users')
      .select('*')
      .eq('id', employeeId)
      .eq('company_id', companyId)
      .maybeSingle()

    if (lookupError || !employee) {
      console.error('Employee not found:', lookupError)
      return new Response(
        JSON.stringify({ success: false, message: 'Employee not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if already completed
    if (employee.assessment_completed_at) {
      console.log('Assessment already completed for employee')
      return new Response(
        JSON.stringify({ success: false, message: 'Assessment already completed' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Insert into assessment_results
    // Use the employee's user_id if they have one, otherwise generate a temporary UUID
    const userId = employee.user_id || crypto.randomUUID()
    
    const { data: assessmentResult, error: insertError } = await supabase
      .from('assessment_results')
      .insert({
        user_id: userId,
        assessment_type: results.assessmentType || 'professional_25q',
        results: results
      })
      .select('id')
      .single()

    if (insertError) {
      console.error('Error inserting assessment result:', insertError)
      return new Response(
        JSON.stringify({ success: false, message: 'Failed to save assessment results' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Assessment result saved with ID:', assessmentResult.id)

    // Update company_users with the assessment result reference
    const { error: updateError } = await supabase
      .from('company_users')
      .update({
        assessment_completed_at: new Date().toISOString(),
        assessment_result_id: assessmentResult.id,
        status: 'active'
      })
      .eq('id', employeeId)

    if (updateError) {
      console.error('Error updating employee record:', updateError)
      return new Response(
        JSON.stringify({ success: false, message: 'Failed to update employee record' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Employee record updated successfully')

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Assessment saved successfully',
        assessmentResultId: assessmentResult.id
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
