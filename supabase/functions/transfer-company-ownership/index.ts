import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from 'npm:resend@4.0.0'

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
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return typeof value === 'string' && uuidRegex.test(value)
}

function normalizeEmail(email: string | null | undefined): string {
  return (email || '').trim().toLowerCase()
}

function maskEmail(email: string): string {
  const [name, domain] = email.split('@')
  if (!name || !domain) return email
  const visible = name.slice(0, Math.min(2, name.length))
  return `${visible}${'*'.repeat(Math.max(2, name.length - visible.length))}@${domain}`
}

function generateCode(): string {
  const bytes = new Uint32Array(1)
  crypto.getRandomValues(bytes)
  return String(bytes[0] % 1_000_000).padStart(6, '0')
}

async function hashCode(companyId: string, requestId: string, code: string): Promise<string> {
  const input = `${companyId}:${requestId}:${code.trim()}`
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input))
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

async function getCaller(req: Request) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) throw new Error('Unauthorized')

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  const authClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  })

  const {
    data: { user },
    error,
  } = await authClient.auth.getUser()

  if (error || !user?.id || !user.email) throw new Error('Unauthorized')
  return { id: user.id, email: normalizeEmail(user.email) }
}

async function sendConfirmationEmail(params: {
  to: string
  companyName: string
  targetEmail: string
  code: string
}) {
  const apiKey = Deno.env.get('RESEND_API_KEY')
  if (!apiKey) throw new Error('Missing RESEND_API_KEY configuration')

  const companyName = escapeHtml(params.companyName)
  const targetEmail = escapeHtml(params.targetEmail)
  const resend = new Resend(apiKey)
  const { error } = await resend.emails.send({
    from: 'Role Color Finder <onboarding@resend.dev>',
    to: [params.to],
    subject: `Confirm ownership transfer for ${params.companyName}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #111827; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 24px;">
        <h1 style="font-size: 22px; margin-bottom: 12px;">Confirm ownership transfer</h1>
        <p>You requested to transfer ownership of <strong>${companyName}</strong> to <strong>${targetEmail}</strong>.</p>
        <p>Use this confirmation code in Role Color Finder:</p>
        <p style="font-size: 32px; letter-spacing: 8px; font-weight: 700; background: #f3f4f6; border-radius: 12px; padding: 18px; text-align: center;">${params.code}</p>
        <p>This code expires in 15 minutes. If you did not request this transfer, you can ignore this email and no ownership change will happen.</p>
      </div>
    `,
    text: `Confirm ownership transfer for ${params.companyName}. Code: ${params.code}. This transfers ownership to ${params.targetEmail}. The code expires in 15 minutes.`,
  })

  if (error) throw new Error(error.message || 'Failed to send confirmation email')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ success: false, message: 'Method not allowed' }, 405)
  }

  try {
    const body = await req.json()
    const action = body?.action
    const companyId = body?.companyId
    const targetCompanyUserId = body?.targetCompanyUserId

    if (!['initiate', 'confirm'].includes(action)) {
      return jsonResponse({ success: false, message: 'Invalid action' }, 400)
    }
    if (!isValidUUID(companyId) || !isValidUUID(targetCompanyUserId)) {
      return jsonResponse({ success: false, message: 'Invalid id format' }, 400)
    }

    const caller = await getCaller(req)
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id, name, admin_email')
      .eq('id', companyId)
      .maybeSingle()

    if (companyError) throw companyError
    if (!company) return jsonResponse({ success: false, message: 'Company not found' }, 404)

    if (normalizeEmail(company.admin_email) !== caller.email) {
      return jsonResponse({ success: false, message: 'Only the current portal owner can transfer ownership' }, 403)
    }

    const { data: ownerRecord } = await supabase
      .from('company_users')
      .select('id, user_id, email, role, status')
      .eq('company_id', companyId)
      .eq('email', caller.email)
      .eq('role', 'admin')
      .neq('status', 'revoked')
      .maybeSingle()

    if (!ownerRecord || (ownerRecord.user_id && ownerRecord.user_id !== caller.id)) {
      return jsonResponse({ success: false, message: 'Current owner admin record was not found' }, 403)
    }

    const { data: target, error: targetError } = await supabase
      .from('company_users')
      .select('id, email, role, status')
      .eq('id', targetCompanyUserId)
      .eq('company_id', companyId)
      .maybeSingle()

    if (targetError) throw targetError
    if (!target || target.role !== 'admin' || target.status === 'revoked') {
      return jsonResponse({ success: false, message: 'Ownership can only be transferred to an active admin' }, 400)
    }
    if (normalizeEmail(target.email) === caller.email) {
      return jsonResponse({ success: false, message: 'You already own this portal' }, 400)
    }

    if (action === 'initiate') {
      await supabase
        .from('ownership_transfer_requests')
        .update({ consumed_at: new Date().toISOString() })
        .eq('company_id', companyId)
        .is('consumed_at', null)

      const code = generateCode()
      const requestId = crypto.randomUUID()
      const codeHash = await hashCode(companyId, requestId, code)
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString()

      const { error: insertError } = await supabase
        .from('ownership_transfer_requests')
        .insert({
          id: requestId,
          company_id: companyId,
          requested_by_user_id: caller.id,
          requested_by_email: caller.email,
          target_company_user_id: targetCompanyUserId,
          target_email: normalizeEmail(target.email),
          code_hash: codeHash,
          expires_at: expiresAt,
        })

      if (insertError) throw insertError

      await sendConfirmationEmail({
        to: caller.email,
        companyName: company.name,
        targetEmail: target.email,
        code,
      })

      return jsonResponse({
        success: true,
        requestId,
        sentTo: maskEmail(caller.email),
        expiresAt,
      })
    }

    const requestId = body?.requestId
    const code = `${body?.code || ''}`.trim()
    const typedCompanyName = `${body?.typedCompanyName || ''}`.trim()

    if (!isValidUUID(requestId) || !/^\d{6}$/.test(code)) {
      return jsonResponse({ success: false, message: 'Enter the 6-digit confirmation code from your email' }, 400)
    }
    if (typedCompanyName !== company.name) {
      return jsonResponse({ success: false, message: 'Portal name does not match' }, 400)
    }

    const { data: transferRequest, error: requestError } = await supabase
      .from('ownership_transfer_requests')
      .select('*')
      .eq('id', requestId)
      .eq('company_id', companyId)
      .eq('target_company_user_id', targetCompanyUserId)
      .is('consumed_at', null)
      .maybeSingle()

    if (requestError) throw requestError
    if (!transferRequest) return jsonResponse({ success: false, message: 'Transfer request not found or already used' }, 404)
    if (new Date(transferRequest.expires_at).getTime() < Date.now()) {
      return jsonResponse({ success: false, message: 'Confirmation code expired. Send a new confirmation email.' }, 400)
    }

    const expectedHash = await hashCode(companyId, requestId, code)
    if (transferRequest.code_hash !== expectedHash) {
      return jsonResponse({ success: false, message: 'Confirmation code is incorrect' }, 400)
    }

    const { error: updateError } = await supabase
      .from('companies')
      .update({ admin_email: normalizeEmail(target.email) })
      .eq('id', companyId)

    if (updateError) throw updateError

    await supabase
      .from('ownership_transfer_requests')
      .update({ consumed_at: new Date().toISOString() })
      .eq('id', requestId)

    return jsonResponse({
      success: true,
      message: `${target.email} is now the portal owner.`,
      newOwnerEmail: normalizeEmail(target.email),
    })
  } catch (error) {
    console.error('transfer-company-ownership error:', error)
    const message = error instanceof Error ? error.message : 'An unexpected error occurred'
    const status = message === 'Unauthorized' ? 401 : 500
    return jsonResponse({ success: false, message }, status)
  }
})
