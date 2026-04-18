import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { findReusableAssessmentsForEmail } from '../_shared/reusableAssessments.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const PRIVILEGED_ROLES = ['admin', 'hr', 'partner'] as const

function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return typeof str === 'string' && uuidRegex.test(str)
}

function isValidInviteCode(code: string): boolean {
  const codeRegex = /^[A-Z0-9]{8}$/
  return typeof code === 'string' && codeRegex.test(code.toUpperCase())
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function buildCompanySnapshotAssessmentType(employee: any): string {
  if (employee.assessment_category && employee.assessment_type) {
    return `${employee.assessment_category}_${employee.assessment_type}`
  }

  if (employee.assessment_type) {
    return `professional_${employee.assessment_type}`
  }

  return 'professional_25q'
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { employeeId, companyId, inviteCode, sourceId, sourceTable } = body ?? {}

    if (!employeeId || !companyId || !inviteCode || !sourceId || !sourceTable) {
      return new Response(
        JSON.stringify({ success: false, message: 'employeeId, companyId, inviteCode, sourceId, and sourceTable are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    if (!isValidUUID(employeeId) || !isValidUUID(companyId) || !isValidUUID(sourceId)) {
      return new Response(
        JSON.stringify({ success: false, message: 'Invalid id format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    if (!['assessment_results', 'assessment_progress'].includes(sourceTable)) {
      return new Response(
        JSON.stringify({ success: false, message: 'Invalid sourceTable' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    if (!isValidInviteCode(inviteCode)) {
      return new Response(
        JSON.stringify({ success: false, message: 'Invalid invite code format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data: employee, error: employeeError } = await supabase
      .from('company_users')
      .select('*')
      .eq('id', employeeId)
      .eq('company_id', companyId)
      .eq('invite_code', inviteCode.toUpperCase())
      .maybeSingle()

    if (employeeError) {
      console.error('Employee lookup error:', employeeError)
      return new Response(
        JSON.stringify({ success: false, message: 'Failed to load employee' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    if (!employee) {
      return new Response(
        JSON.stringify({ success: false, message: 'Invalid employee session' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    if (employee.status === 'revoked') {
      return new Response(
        JSON.stringify({ success: false, message: 'Access revoked' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    if (employee.assessment_result_id || employee.assessment_completed_at) {
      return new Response(
        JSON.stringify({ success: false, message: 'This invite already has a completed assessment attached.' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const reusableAssessments = await findReusableAssessmentsForEmail(supabase, employee.email, {
      companyAssessmentCategory: employee.assessment_category,
      companyAssessmentType: employee.assessment_type,
    })

    const selectedAssessment = reusableAssessments.find(
      (assessment) => assessment.id === sourceId && assessment.sourceTable === sourceTable,
    )
    if (!selectedAssessment) {
      return new Response(
        JSON.stringify({ success: false, message: 'The selected saved assessment is not available for this email.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    let sourceAssessmentType = selectedAssessment.assessmentType
    let sourceResults: Record<string, unknown> = {}
    let sourceCompletedAt = selectedAssessment.completedAt

    if (sourceTable === 'assessment_results') {
      const { data: sourceRow, error: sourceError } = await supabase
        .from('assessment_results')
        .select('id, assessment_type, created_at, updated_at, results')
        .eq('id', sourceId)
        .maybeSingle()

      if (sourceError || !sourceRow) {
        console.error('Source result lookup error:', sourceError)
        return new Response(
          JSON.stringify({ success: false, message: 'Failed to load the saved assessment you selected.' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
      }

      sourceAssessmentType = sourceRow.assessment_type
      sourceResults = isRecord(sourceRow.results) ? sourceRow.results : {}
      sourceCompletedAt =
        (typeof sourceResults.completedAt === 'string' && sourceResults.completedAt) ||
        sourceRow.updated_at ||
        sourceRow.created_at
    } else {
      const { data: sourceProgressRow, error: sourceProgressError } = await supabase
        .from('assessment_progress')
        .select('id, assessment_type, created_at, dominant_color, scores, results')
        .eq('id', sourceId)
        .maybeSingle()

      if (sourceProgressError || !sourceProgressRow) {
        console.error('Source progress lookup error:', sourceProgressError)
        return new Response(
          JSON.stringify({ success: false, message: 'Failed to load the completed assessment you selected.' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
      }

      const progressResults = isRecord(sourceProgressRow.results) ? sourceProgressRow.results : {}
      sourceAssessmentType = sourceProgressRow.assessment_type
      sourceCompletedAt =
        (typeof progressResults.lastSavedAt === 'string' && progressResults.lastSavedAt) ||
        sourceProgressRow.created_at

      sourceResults = {
        dominantColor: sourceProgressRow.dominant_color,
        scores: isRecord(sourceProgressRow.scores) ? sourceProgressRow.scores : {},
        totalQuestions:
          typeof progressResults.totalQuestions === 'number' ? progressResults.totalQuestions : null,
        assessmentType: sourceProgressRow.assessment_type,
        completedAt: sourceCompletedAt,
      }
    }

    const completionTimestamp = new Date().toISOString()
    const snapshotAssessmentType = buildCompanySnapshotAssessmentType(employee)

    let linkedUserId: string | null = employee.user_id || null
    if (PRIVILEGED_ROLES.includes(employee.role)) {
      if (!linkedUserId && employee.email) {
        linkedUserId = await findAuthUserIdByEmail(supabase, employee.email)
      }

      if (!linkedUserId) {
        return new Response(
          JSON.stringify({
            success: false,
            message: 'This admin invite is missing its account link. Please ask a company admin to resend or recreate the admin invite before importing a saved assessment.',
            errorCode: 'ADMIN_ACCOUNT_LINK_REQUIRED',
          }),
          { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
      }
    }

    const snapshotUserId = PRIVILEGED_ROLES.includes(employee.role) ? linkedUserId : employee.id
    const importedResults = {
      ...sourceResults,
      assessmentType: snapshotAssessmentType,
      completedAt: completionTimestamp,
      companyId,
      importedFrom: {
        sourceId,
        sourceTable,
        assessmentType: sourceAssessmentType,
        sourceKind: selectedAssessment.sourceKind,
        sourceLabel: selectedAssessment.sourceLabel,
        importedAt: completionTimestamp,
        originalCompletedAt: sourceCompletedAt,
      },
    }

    const { data: insertedSnapshot, error: snapshotError } = await supabase
      .from('assessment_results')
      .insert({
        user_id: snapshotUserId,
        assessment_type: snapshotAssessmentType,
        results: importedResults,
      })
      .select('id, results')
      .single()

    if (snapshotError) {
      console.error('Snapshot insert error:', snapshotError)
      return new Response(
        JSON.stringify({ success: false, message: 'Failed to create the company assessment snapshot.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const { error: updateEmployeeError } = await supabase
      .from('company_users')
      .update({
        user_id: linkedUserId,
        assessment_completed_at: completionTimestamp,
        assessment_result_id: insertedSnapshot.id,
        status: 'active',
      })
      .eq('id', employee.id)

    if (updateEmployeeError) {
      console.error('Employee update error:', updateEmployeeError)
      return new Response(
        JSON.stringify({ success: false, message: 'Failed to attach the saved assessment to this company invite.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const { data: cancelledReminders, error: cancelError } = await supabase
      .from('scheduled_reminders')
      .update({
        status: 'cancelled',
        next_occurrence_at: null,
      })
      .eq('company_user_id', employee.id)
      .eq('status', 'pending')
      .select('id')

    if (cancelError) {
      console.error('Error cancelling reminders (non-fatal):', cancelError)
    } else if (cancelledReminders && cancelledReminders.length > 0) {
      console.log(`Auto-cancelled ${cancelledReminders.length} pending reminder(s) for imported assessment`)
    }

    try {
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
            dominant_color:
              (typeof importedResults.dominantColor === 'string' && importedResults.dominantColor) ||
              (typeof importedResults.primaryColor === 'string' && importedResults.primaryColor) ||
              'blue',
            secondary_color:
              typeof importedResults.secondaryColor === 'string' ? importedResults.secondaryColor : null,
            scores:
              isRecord(importedResults.scores)
                ? importedResults.scores
                : isRecord(importedResults.colorScores)
                  ? importedResults.colorScores
                  : {},
          },
        }),
      }).catch((err) => console.error('Slack notification error (non-fatal):', err))
    } catch (slackError) {
      console.error('Error checking Slack settings (non-fatal):', slackError)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Saved assessment imported successfully',
        employee: {
          id: employee.id,
          email: employee.email,
          role: employee.role,
          status: 'active',
          invite_code: employee.invite_code,
          user_id: linkedUserId,
          assessment_completed_at: completionTimestamp,
          assessment_result_id: insertedSnapshot.id,
          assessment_category: employee.assessment_category,
          assessment_type: employee.assessment_type,
        },
        assessmentResults: {
          results: insertedSnapshot.results,
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ success: false, message: 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
