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
    // Use the employee's id as the user_id to ensure uniqueness per employee
    // This avoids collisions when employees don't have a linked auth user_id
    const userId = employee.user_id || employeeId
    const assessmentType = results.assessmentType || 'professional_25q'
    
    // First check if an assessment already exists for this user/type combo
    const { data: existingResult } = await supabase
      .from('assessment_results')
      .select('id')
      .eq('user_id', userId)
      .eq('assessment_type', assessmentType)
      .maybeSingle()

    let assessmentResultId: string

    if (existingResult) {
      // Update existing result
      const { error: updateResultError } = await supabase
        .from('assessment_results')
        .update({ results: results, updated_at: new Date().toISOString() })
        .eq('id', existingResult.id)

      if (updateResultError) {
        console.error('Error updating assessment result:', updateResultError)
        return new Response(
          JSON.stringify({ success: false, message: 'Failed to update assessment results' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      assessmentResultId = existingResult.id
      console.log('Updated existing assessment result:', assessmentResultId)
    } else {
      // Insert new result
      const { data: newResult, error: insertError } = await supabase
        .from('assessment_results')
        .insert({
          user_id: userId,
          assessment_type: assessmentType,
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
      assessmentResultId = newResult.id
      console.log('Created new assessment result:', assessmentResultId)
    }

    // Update company_users with the assessment result reference
    const { error: updateError } = await supabase
      .from('company_users')
      .update({
        assessment_completed_at: new Date().toISOString(),
        assessment_result_id: assessmentResultId,
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

    // Auto-cancel any pending scheduled reminders for this employee
    const { data: cancelledReminders, error: cancelError } = await supabase
      .from('scheduled_reminders')
      .update({ 
        status: 'cancelled',
        next_occurrence_at: null 
      })
      .eq('company_user_id', employeeId)
      .eq('status', 'pending')
      .select('id')

    if (cancelError) {
      console.error('Error cancelling reminders (non-fatal):', cancelError)
    } else if (cancelledReminders && cancelledReminders.length > 0) {
      console.log(`Auto-cancelled ${cancelledReminders.length} pending reminder(s) for employee`)
    }

    // === SLACK NOTIFICATION ===
    // Send Slack notification for assessment completion
    try {
      const { data: companyData } = await supabase
        .from('companies')
        .select('slack_notifications_enabled, slack_bot_token')
        .eq('id', companyId)
        .single()

      if (companyData?.slack_notifications_enabled && companyData?.slack_bot_token) {
        console.log('Sending Slack notification for assessment completion')
        
        // Extract scores from results
        const scores = results.scores || results.colorScores || {}
        const dominantColor = results.dominantColor || results.primaryColor || 'blue'
        const secondaryColor = results.secondaryColor || null

        // Fire and forget - don't wait for response
        fetch(`${supabaseUrl}/functions/v1/send-slack-notification`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            company_id: companyId,
            event_type: 'assessment_completed',
            data: {
              employee_name: employee.full_name,
              email: employee.email,
              dominant_color: dominantColor,
              secondary_color: secondaryColor,
              scores: scores,
            }
          })
        }).catch(err => console.error('Slack notification error (non-fatal):', err))
      }
    } catch (slackError) {
      console.error('Error checking Slack settings (non-fatal):', slackError)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Assessment saved successfully',
        assessmentResultId: assessmentResultId
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
