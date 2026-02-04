// Supabase Edge Function: api-users
// Handles /v1/users/* REST API endpoints for external API access
// This is a dedicated endpoint for user-related operations

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
  'Content-Type': 'application/json',
};

// SHA-256 hash function for API key validation
async function sha256(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Validate API key and return company context
async function validateApiKey(rawKey: string, supabase: any): Promise<{ valid: boolean; company_id?: string; permissions?: string[]; error?: string }> {
  if (!rawKey) {
    return { valid: false, error: 'Missing API key' };
  }

  if (!rawKey.startsWith('rcf_')) {
    return { valid: false, error: 'Invalid API key format. Keys must start with rcf_' };
  }

  const keyPrefix = rawKey.substring(0, 8);

  const { data: keys, error } = await supabase
    .from('company_api_keys')
    .select('id, company_id, key_hash, key_prefix, permissions, is_active, expires_at')
    .eq('key_prefix', keyPrefix)
    .eq('is_active', true);

  if (error) {
    console.error('DB error:', error);
    return { valid: false, error: 'Database error' };
  }

  if (!keys || keys.length === 0) {
    return { valid: false, error: 'API key not found or inactive' };
  }

  const now = new Date();
  const keyHash = await sha256(rawKey);
  const match = keys.find((k: any) => {
    const notExpired = !k.expires_at || new Date(k.expires_at) > now;
    return notExpired && k.key_hash === keyHash;
  });

  if (!match) {
    return { valid: false, error: 'Invalid or expired API key' };
  }

  // Update last_used_at
  await supabase
    .from('company_api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', match.id);

  return {
    valid: true,
    company_id: match.company_id,
    permissions: match.permissions || [],
  };
}

// Extract API key from request headers
function extractApiKey(req: Request): string | null {
  let rawKey = req.headers.get('x-api-key') || null;
  const authHeader = req.headers.get('Authorization');
  if (!rawKey && authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
    rawKey = authHeader.slice(7).trim();
  }
  return rawKey;
}

// Input validation
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return typeof email === 'string' && email.length <= 255 && emailRegex.test(email);
}

function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return typeof str === 'string' && uuidRegex.test(str);
}

// Parse the request path
function parsePath(url: URL): { id?: string; action?: string } {
  let pathname = url.pathname;
  
  // Remove various prefixes
  const prefixes = ['/v1/users', '/users', '/api-users'];
  for (const prefix of prefixes) {
    if (pathname.startsWith(prefix)) {
      pathname = pathname.substring(prefix.length);
      break;
    }
  }

  const parts = pathname.split('/').filter(Boolean);
  
  return {
    id: parts[0],
    action: parts[1],
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceKey) {
      return new Response(
        JSON.stringify({ error: 'Server misconfigured', code: 'SERVER_ERROR' }),
        { status: 500, headers: corsHeaders }
      );
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    // Validate API key
    const rawKey = extractApiKey(req);
    if (!rawKey) {
      return new Response(
        JSON.stringify({
          error: 'Missing API key',
          code: 'MISSING_API_KEY',
          hint: 'Include your API key in the x-api-key header or Authorization: Bearer header',
        }),
        { status: 401, headers: corsHeaders }
      );
    }

    const authResult = await validateApiKey(rawKey, supabase);
    if (!authResult.valid) {
      return new Response(
        JSON.stringify({
          error: authResult.error,
          code: 'INVALID_API_KEY',
        }),
        { status: 401, headers: corsHeaders }
      );
    }

    const companyId = authResult.company_id!;
    const permissions = authResult.permissions || [];
    const method = req.method;
    const url = new URL(req.url);
    const path = parsePath(url);

    // POST /v1/users/invite - Invite a new user
    if (method === 'POST' && path.id === 'invite') {
      if (!permissions.includes('write') && !permissions.includes('admin')) {
        return new Response(
          JSON.stringify({ error: 'Insufficient permissions', code: 'FORBIDDEN' }),
          { status: 403, headers: corsHeaders }
        );
      }

      try {
        const body = await req.json();
        const { email, role = 'employee', department, name } = body;

        if (!email || typeof email !== 'string') {
          return new Response(
            JSON.stringify({ error: 'Email is required', code: 'VALIDATION_ERROR' }),
            { status: 400, headers: corsHeaders }
          );
        }

        if (!isValidEmail(email)) {
          return new Response(
            JSON.stringify({ error: 'Invalid email format', code: 'VALIDATION_ERROR' }),
            { status: 400, headers: corsHeaders }
          );
        }

        // Check if user already exists
        const { data: existingUser } = await supabase
          .from('company_users')
          .select('id, status')
          .eq('company_id', companyId)
          .eq('email', email.toLowerCase().trim())
          .maybeSingle();

        if (existingUser) {
          return new Response(
            JSON.stringify({ 
              error: 'User already exists in company', 
              code: 'USER_EXISTS',
              user_id: existingUser.id,
              status: existingUser.status,
            }),
            { status: 409, headers: corsHeaders }
          );
        }

        // Generate invite code
        const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

        // Create invite record
        const { data: invite, error: inviteError } = await supabase
          .from('company_invites')
          .insert({
            company_id: companyId,
            email: email.toLowerCase().trim(),
            invite_code: inviteCode,
            role: role,
            department: department,
            name: name,
            status: 'pending',
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
          })
          .select()
          .single();

        if (inviteError) {
          console.error('Invite error:', inviteError);
          return new Response(
            JSON.stringify({ error: 'Failed to create invite', code: 'DB_ERROR', details: inviteError.message }),
            { status: 500, headers: corsHeaders }
          );
        }

        // Get company details for the invite email
        const { data: company } = await supabase
          .from('companies')
          .select('name, subdomain, subdomain_enabled')
          .eq('id', companyId)
          .single();

        return new Response(
          JSON.stringify({
            success: true,
            invite: {
              id: invite.id,
              email: invite.email,
              invite_code: invite.invite_code,
              status: invite.status,
              expires_at: invite.expires_at,
              portal_url: company?.subdomain_enabled 
                ? `https://${company.subdomain}.rolecolorfinder.com/login`
                : `https://rolecolorfinder.com/company/${company?.subdomain}/login`,
            },
          }),
          { status: 201, headers: corsHeaders }
        );
      } catch (e) {
        return new Response(
          JSON.stringify({ error: 'Invalid request body', code: 'VALIDATION_ERROR' }),
          { status: 400, headers: corsHeaders }
        );
      }
    }

    // POST /v1/users/bulk-invite - Bulk invite users
    if (method === 'POST' && path.id === 'bulk-invite') {
      if (!permissions.includes('write') && !permissions.includes('admin')) {
        return new Response(
          JSON.stringify({ error: 'Insufficient permissions', code: 'FORBIDDEN' }),
          { status: 403, headers: corsHeaders }
        );
      }

      try {
        const body = await req.json();
        const { users } = body;

        if (!Array.isArray(users) || users.length === 0) {
          return new Response(
            JSON.stringify({ error: 'Users array is required', code: 'VALIDATION_ERROR' }),
            { status: 400, headers: corsHeaders }
          );
        }

        if (users.length > 100) {
          return new Response(
            JSON.stringify({ error: 'Maximum 100 users per batch', code: 'VALIDATION_ERROR' }),
            { status: 400, headers: corsHeaders }
          );
        }

        const results = {
          successful: [] as any[],
          failed: [] as any[],
        };

        for (const user of users) {
          const { email, role = 'employee', department, name } = user;

          if (!email || !isValidEmail(email)) {
            results.failed.push({ email, error: 'Invalid email format' });
            continue;
          }

          // Check if user already exists
          const { data: existingUser } = await supabase
            .from('company_users')
            .select('id')
            .eq('company_id', companyId)
            .eq('email', email.toLowerCase().trim())
            .maybeSingle();

          if (existingUser) {
            results.failed.push({ email, error: 'User already exists' });
            continue;
          }

          // Generate invite code
          const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

          const { data: invite, error: inviteError } = await supabase
            .from('company_invites')
            .insert({
              company_id: companyId,
              email: email.toLowerCase().trim(),
              invite_code: inviteCode,
              role: role,
              department: department,
              name: name,
              status: 'pending',
              expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            })
            .select()
            .single();

          if (inviteError) {
            results.failed.push({ email, error: 'Failed to create invite' });
          } else {
            results.successful.push({
              email: invite.email,
              invite_code: invite.invite_code,
              id: invite.id,
            });
          }
        }

        return new Response(
          JSON.stringify({
            success: true,
            results,
            summary: {
              total: users.length,
              successful: results.successful.length,
              failed: results.failed.length,
            },
          }),
          { status: 201, headers: corsHeaders }
        );
      } catch (e) {
        return new Response(
          JSON.stringify({ error: 'Invalid request body', code: 'VALIDATION_ERROR' }),
          { status: 400, headers: corsHeaders }
        );
      }
    }

    // GET /v1/users/:id/assessment - Get user's assessment status
    if (method === 'GET' && path.id && path.action === 'assessment') {
      if (!isValidUUID(path.id)) {
        return new Response(
          JSON.stringify({ error: 'Invalid user ID format', code: 'VALIDATION_ERROR' }),
          { status: 400, headers: corsHeaders }
        );
      }

      const { data: user, error: userError } = await supabase
        .from('company_users')
        .select('id, email, assessment_completed, assessment_completed_at')
        .eq('company_id', companyId)
        .eq('id', path.id)
        .single();

      if (userError || !user) {
        return new Response(
          JSON.stringify({ error: 'User not found', code: 'NOT_FOUND' }),
          { status: 404, headers: corsHeaders }
        );
      }

      // Get assessment results if completed
      let assessment = null;
      if (user.assessment_completed) {
        const { data: results } = await supabase
          .from('company_assessment_results')
          .select('id, primary_color, secondary_color, scores, created_at')
          .eq('company_id', companyId)
          .eq('user_id', path.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        assessment = results;
      }

      return new Response(
        JSON.stringify({
          user_id: user.id,
          email: user.email,
          assessment_completed: user.assessment_completed,
          assessment_completed_at: user.assessment_completed_at,
          assessment,
        }),
        { status: 200, headers: corsHeaders }
      );
    }

    // GET /v1/users/:id - Get specific user
    if (method === 'GET' && path.id) {
      if (!isValidUUID(path.id)) {
        return new Response(
          JSON.stringify({ error: 'Invalid user ID format', code: 'VALIDATION_ERROR' }),
          { status: 400, headers: corsHeaders }
        );
      }

      const { data: user, error } = await supabase
        .from('company_users')
        .select('id, email, role, status, department, name, created_at, assessment_completed, assessment_completed_at')
        .eq('company_id', companyId)
        .eq('id', path.id)
        .single();

      if (error || !user) {
        return new Response(
          JSON.stringify({ error: 'User not found', code: 'NOT_FOUND' }),
          { status: 404, headers: corsHeaders }
        );
      }

      return new Response(JSON.stringify({ user }), { status: 200, headers: corsHeaders });
    }

    // DELETE /v1/users/:id - Remove user from company
    if (method === 'DELETE' && path.id) {
      if (!permissions.includes('write') && !permissions.includes('admin')) {
        return new Response(
          JSON.stringify({ error: 'Insufficient permissions', code: 'FORBIDDEN' }),
          { status: 403, headers: corsHeaders }
        );
      }

      if (!isValidUUID(path.id)) {
        return new Response(
          JSON.stringify({ error: 'Invalid user ID format', code: 'VALIDATION_ERROR' }),
          { status: 400, headers: corsHeaders }
        );
      }

      const { error } = await supabase
        .from('company_users')
        .update({ status: 'removed', removed_at: new Date().toISOString() })
        .eq('company_id', companyId)
        .eq('id', path.id);

      if (error) {
        return new Response(
          JSON.stringify({ error: 'Failed to remove user', code: 'DB_ERROR' }),
          { status: 500, headers: corsHeaders }
        );
      }

      return new Response(
        JSON.stringify({ success: true, message: 'User removed' }),
        { status: 200, headers: corsHeaders }
      );
    }

    // GET /v1/users - List all users
    if (method === 'GET') {
      const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);
      const offset = parseInt(url.searchParams.get('offset') || '0');
      const status = url.searchParams.get('status');
      const department = url.searchParams.get('department');
      const assessmentCompleted = url.searchParams.get('assessment_completed');

      let query = supabase
        .from('company_users')
        .select('id, email, role, status, department, name, created_at, assessment_completed, assessment_completed_at', { count: 'exact' })
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (status) {
        query = query.eq('status', status);
      }
      if (department) {
        query = query.eq('department', department);
      }
      if (assessmentCompleted !== null) {
        query = query.eq('assessment_completed', assessmentCompleted === 'true');
      }

      const { data: users, error, count } = await query;

      if (error) {
        console.error('Query error:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch users', code: 'DB_ERROR' }),
          { status: 500, headers: corsHeaders }
        );
      }

      return new Response(
        JSON.stringify({
          users,
          pagination: {
            total: count,
            limit,
            offset,
            has_more: offset + limit < (count || 0),
          },
        }),
        { status: 200, headers: corsHeaders }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' }),
      { status: 405, headers: corsHeaders }
    );
  } catch (err) {
    console.error('Unhandled error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error', code: 'INTERNAL_ERROR' }),
      { status: 500, headers: corsHeaders }
    );
  }
});
