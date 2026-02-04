// Supabase Edge Function: api-gateway
// Central API gateway for external REST API access via api.rolecolorfinder.com
// Handles routing, API key validation, and request forwarding

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

// Parse the request path to determine the resource and action
function parseApiPath(url: URL): { resource: string; id?: string; action?: string; subResource?: string; subId?: string } {
  // Remove /v1 prefix if present
  let pathname = url.pathname;
  if (pathname.startsWith('/v1/')) {
    pathname = pathname.substring(3);
  } else if (pathname.startsWith('/v1')) {
    pathname = pathname.substring(3) || '/';
  }

  const parts = pathname.split('/').filter(Boolean);
  
  return {
    resource: parts[0] || '',
    id: parts[1],
    action: parts[2],
    subResource: parts[2],
    subId: parts[3],
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const url = new URL(req.url);
  const path = parseApiPath(url);

  // Health check endpoint (no auth required)
  if (path.resource === 'health' || url.pathname === '/v1/health') {
    return new Response(
      JSON.stringify({
        status: 'healthy',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        service: 'RoleColorFinder API',
      }),
      { status: 200, headers: corsHeaders }
    );
  }

  // API documentation endpoint (no auth required)
  if (path.resource === '' || path.resource === 'docs') {
    return new Response(
      JSON.stringify({
        name: 'RoleColorFinder API',
        version: '1.0.0',
        documentation: 'https://docs.rolecolorfinder.com/api',
        endpoints: {
          health: 'GET /v1/health - Health check',
          users: {
            list: 'GET /v1/users - List company users',
            get: 'GET /v1/users/:id - Get user details',
            invite: 'POST /v1/users/invite - Invite a new user',
          },
          assessments: {
            list: 'GET /v1/assessments - List assessments',
            get: 'GET /v1/assessments/:id - Get assessment details',
            results: 'GET /v1/assessments/:userId/results - Get user results',
          },
        },
        authentication: 'Use x-api-key header or Authorization: Bearer rcf_...',
      }),
      { status: 200, headers: corsHeaders }
    );
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

    // Route based on resource
    switch (path.resource) {
      case 'users':
        return await handleUsersRoute(req, path, companyId, permissions, supabase);
      
      case 'assessments':
        return await handleAssessmentsRoute(req, path, companyId, permissions, supabase);
      
      case 'company':
        return await handleCompanyRoute(req, path, companyId, permissions, supabase);

      default:
        return new Response(
          JSON.stringify({
            error: `Unknown resource: ${path.resource}`,
            code: 'NOT_FOUND',
            available_resources: ['users', 'assessments', 'company'],
          }),
          { status: 404, headers: corsHeaders }
        );
    }
  } catch (err) {
    console.error('Unhandled error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error', code: 'INTERNAL_ERROR' }),
      { status: 500, headers: corsHeaders }
    );
  }
});

// Handle /v1/users/* routes
async function handleUsersRoute(
  req: Request,
  path: { id?: string; action?: string },
  companyId: string,
  permissions: string[],
  supabase: any
): Promise<Response> {
  const method = req.method;

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
      const { email, role = 'employee', department } = body;

      if (!email || typeof email !== 'string') {
        return new Response(
          JSON.stringify({ error: 'Email is required', code: 'VALIDATION_ERROR' }),
          { status: 400, headers: corsHeaders }
        );
      }

      // Generate invite code
      const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

      // Create invite record
      const { data: invite, error } = await supabase
        .from('company_invites')
        .insert({
          company_id: companyId,
          email: email.toLowerCase().trim(),
          invite_code: inviteCode,
          role: role,
          department: department,
          status: 'pending',
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        })
        .select()
        .single();

      if (error) {
        console.error('Invite error:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to create invite', code: 'DB_ERROR' }),
          { status: 500, headers: corsHeaders }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          invite: {
            id: invite.id,
            email: invite.email,
            invite_code: invite.invite_code,
            status: invite.status,
            expires_at: invite.expires_at,
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

  // GET /v1/users/:id - Get specific user
  if (method === 'GET' && path.id && path.id !== 'invite') {
    const { data: user, error } = await supabase
      .from('company_users')
      .select('id, email, role, status, department, created_at, assessment_completed, assessment_completed_at')
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

  // GET /v1/users - List all users
  if (method === 'GET') {
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const status = url.searchParams.get('status');

    let query = supabase
      .from('company_users')
      .select('id, email, role, status, department, created_at, assessment_completed, assessment_completed_at', { count: 'exact' })
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
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
}

// Handle /v1/assessments/* routes
async function handleAssessmentsRoute(
  req: Request,
  path: { id?: string; action?: string; subResource?: string },
  companyId: string,
  permissions: string[],
  supabase: any
): Promise<Response> {
  const method = req.method;

  // GET /v1/assessments/:userId/results - Get assessment results for a user
  if (method === 'GET' && path.id && path.subResource === 'results') {
    const { data: results, error } = await supabase
      .from('company_assessment_results')
      .select('*')
      .eq('company_id', companyId)
      .eq('user_id', path.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !results) {
      return new Response(
        JSON.stringify({ error: 'Assessment results not found', code: 'NOT_FOUND' }),
        { status: 404, headers: corsHeaders }
      );
    }

    return new Response(
      JSON.stringify({
        assessment: {
          id: results.id,
          user_id: results.user_id,
          primary_color: results.primary_color,
          secondary_color: results.secondary_color,
          scores: results.scores,
          completed_at: results.created_at,
        },
      }),
      { status: 200, headers: corsHeaders }
    );
  }

  // GET /v1/assessments/:id - Get specific assessment
  if (method === 'GET' && path.id) {
    const { data: assessment, error } = await supabase
      .from('company_assessment_results')
      .select('*')
      .eq('company_id', companyId)
      .eq('id', path.id)
      .single();

    if (error || !assessment) {
      return new Response(
        JSON.stringify({ error: 'Assessment not found', code: 'NOT_FOUND' }),
        { status: 404, headers: corsHeaders }
      );
    }

    return new Response(
      JSON.stringify({
        assessment: {
          id: assessment.id,
          user_id: assessment.user_id,
          primary_color: assessment.primary_color,
          secondary_color: assessment.secondary_color,
          scores: assessment.scores,
          completed_at: assessment.created_at,
        },
      }),
      { status: 200, headers: corsHeaders }
    );
  }

  // GET /v1/assessments - List all assessments
  if (method === 'GET') {
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    const { data: assessments, error, count } = await supabase
      .from('company_assessment_results')
      .select('id, user_id, primary_color, secondary_color, created_at', { count: 'exact' })
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Query error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch assessments', code: 'DB_ERROR' }),
        { status: 500, headers: corsHeaders }
      );
    }

    return new Response(
      JSON.stringify({
        assessments,
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
}

// Handle /v1/company/* routes
async function handleCompanyRoute(
  req: Request,
  path: { id?: string; action?: string },
  companyId: string,
  permissions: string[],
  supabase: any
): Promise<Response> {
  const method = req.method;

  // GET /v1/company - Get company details
  if (method === 'GET' && !path.id) {
    const { data: company, error } = await supabase
      .from('companies')
      .select('id, name, subdomain, created_at, subscription_tier, employee_count, seats_used, seats_total')
      .eq('id', companyId)
      .single();

    if (error || !company) {
      return new Response(
        JSON.stringify({ error: 'Company not found', code: 'NOT_FOUND' }),
        { status: 404, headers: corsHeaders }
      );
    }

    return new Response(
      JSON.stringify({
        company: {
          id: company.id,
          name: company.name,
          subdomain: company.subdomain,
          subscription_tier: company.subscription_tier,
          seats: {
            used: company.seats_used || 0,
            total: company.seats_total || 0,
          },
          created_at: company.created_at,
        },
      }),
      { status: 200, headers: corsHeaders }
    );
  }

  // GET /v1/company/stats - Get company statistics
  if (method === 'GET' && path.id === 'stats') {
    const { data: stats, error } = await supabase.rpc('get_company_stats', { p_company_id: companyId });

    if (error) {
      // Fallback to manual counts
      const { count: userCount } = await supabase
        .from('company_users')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .eq('status', 'active');

      const { count: assessmentCount } = await supabase
        .from('company_assessment_results')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId);

      return new Response(
        JSON.stringify({
          stats: {
            active_users: userCount || 0,
            completed_assessments: assessmentCount || 0,
          },
        }),
        { status: 200, headers: corsHeaders }
      );
    }

    return new Response(JSON.stringify({ stats }), { status: 200, headers: corsHeaders });
  }

  return new Response(
    JSON.stringify({ error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' }),
    { status: 405, headers: corsHeaders }
  );
}
