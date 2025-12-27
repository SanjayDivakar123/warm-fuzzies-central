import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Input validation helpers
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return typeof email === 'string' && email.length <= 255 && emailRegex.test(email)
}

function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return typeof str === 'string' && uuidRegex.test(str)
}

function isValidInviteCode(code: string): boolean {
  // Invite codes are 8 uppercase alphanumeric characters
  const codeRegex = /^[A-Z0-9]{8}$/
  return typeof code === 'string' && codeRegex.test(code.toUpperCase())
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { inviteCode, companyId, email } = body

    // Input validation
    if (!inviteCode || !companyId || !email) {
      return new Response(
        JSON.stringify({ success: false, message: 'Invite code, email, and company ID are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate input formats
    if (!isValidInviteCode(inviteCode)) {
      console.log('Invalid invite code format:', inviteCode)
      return new Response(
        JSON.stringify({ success: false, message: 'Invalid invite code format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!isValidUUID(companyId)) {
      console.log('Invalid company ID format:', companyId)
      return new Response(
        JSON.stringify({ success: false, message: 'Invalid company ID format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!isValidEmail(email)) {
      console.log('Invalid email format:', email)
      return new Response(
        JSON.stringify({ success: false, message: 'Invalid email format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Verifying invite code for company:', companyId)

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Look up the employee by invite code, email, and company
    const { data: employee, error: lookupError } = await supabase
      .from('company_users')
      .select('*')
      .eq('invite_code', inviteCode.toUpperCase())
      .eq('email', email.toLowerCase().trim())
      .eq('company_id', companyId)
      .maybeSingle()

    if (lookupError) {
      console.error('Error looking up employee:', lookupError)
      return new Response(
        JSON.stringify({ success: false, message: 'Error verifying credentials' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!employee) {
      console.log('No employee found with provided credentials')
      return new Response(
        JSON.stringify({ success: false, message: 'Invalid email or invite code combination' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (employee.status === 'revoked') {
      console.log('Employee access revoked')
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
        console.log('Employee status updated to active')
      }
    }

    console.log('Credentials verified successfully')

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Credentials verified',
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
