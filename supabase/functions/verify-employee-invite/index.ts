import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { inviteCode, companyId } = await req.json()

    console.log('Verifying invite code:', inviteCode, 'for company:', companyId)

    if (!inviteCode || !companyId) {
      return new Response(
        JSON.stringify({ success: false, message: 'Invite code and company ID are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Look up the employee by invite code and company
    const { data: employee, error: lookupError } = await supabase
      .from('company_users')
      .select('*')
      .eq('invite_code', inviteCode.toUpperCase())
      .eq('company_id', companyId)
      .maybeSingle()

    if (lookupError) {
      console.error('Error looking up employee:', lookupError)
      return new Response(
        JSON.stringify({ success: false, message: 'Error verifying invite code' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!employee) {
      console.log('No employee found with invite code:', inviteCode)
      return new Response(
        JSON.stringify({ success: false, message: 'Invalid invite code' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (employee.status === 'revoked') {
      console.log('Employee access revoked:', employee.email)
      return new Response(
        JSON.stringify({ success: false, message: 'Your access has been revoked. Please contact your administrator.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update employee status to active and set joined_at if first time
    if (employee.status === 'invited') {
      const { error: updateError } = await supabase
        .from('company_users')
        .update({
          status: 'active',
          joined_at: new Date().toISOString()
        })
        .eq('id', employee.id)

      if (updateError) {
        console.error('Error updating employee status:', updateError)
      } else {
        console.log('Employee status updated to active:', employee.email)
      }
    }

    console.log('Invite code verified successfully for:', employee.email)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Invite code verified',
        employee: {
          id: employee.id,
          email: employee.email,
          role: employee.role,
          status: 'active',
          invite_code: employee.invite_code,
          user_id: employee.user_id,
          assessment_completed_at: employee.assessment_completed_at,
          assessment_result_id: employee.assessment_result_id
        }
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
