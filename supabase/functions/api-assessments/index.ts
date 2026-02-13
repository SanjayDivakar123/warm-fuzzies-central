// Supabase Edge Function: api-assessments
// Handles /v1/assessments/* REST API endpoints for external API access
// This is a dedicated endpoint for assessment-related operations

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

//Example Push Notification Payload

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
function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return typeof str === 'string' && uuidRegex.test(str);
}

// Parse the request path
function parsePath(url: URL): { id?: string; action?: string; subId?: string } {
  let pathname = url.pathname;
  
  // Remove various prefixes
  const prefixes = ['/v1/assessments', '/assessments', '/api-assessments'];
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
    subId: parts[2],
  };
}

// Color name mapping
const colorNames: Record<string, string> = {
  red: 'Red (Leader)',
  blue: 'Blue (Analyst)',
  green: 'Green (Supporter)',
  yellow: 'Yellow (Innovator)',
};

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
    const method = req.method;
    const url = new URL(req.url);
    const path = parsePath(url);

    // GET /v1/assessments/stats - Get assessment statistics
    if (method === 'GET' && path.id === 'stats') {
      // Get color distribution
      const { data: colorStats } = await supabase
        .from('company_assessment_results')
        .select('primary_color')
        .eq('company_id', companyId);

      const colorDistribution: Record<string, number> = {};
      if (colorStats) {
        for (const result of colorStats) {
          const color = result.primary_color?.toLowerCase() || 'unknown';
          colorDistribution[color] = (colorDistribution[color] || 0) + 1;
        }
      }

      // Get completion stats
      const { count: totalUsers } = await supabase
        .from('company_users')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .eq('status', 'active');

      const { count: completedAssessments } = await supabase
        .from('company_users')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .eq('status', 'active')
        .eq('assessment_completed', true);

      // Get recent completions (last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { count: recentCompletions } = await supabase
        .from('company_assessment_results')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .gte('created_at', thirtyDaysAgo);

      return new Response(
        JSON.stringify({
          stats: {
            total_users: totalUsers || 0,
            completed_assessments: completedAssessments || 0,
            completion_rate: totalUsers ? Math.round((completedAssessments || 0) / totalUsers * 100) : 0,
            recent_completions_30d: recentCompletions || 0,
            color_distribution: colorDistribution,
          },
        }),
        { status: 200, headers: corsHeaders }
      );
    }

    // GET /v1/assessments/export - Export all assessment results
    if (method === 'GET' && path.id === 'export') {
      const format = url.searchParams.get('format') || 'json';

      const { data: results, error } = await supabase
        .from('company_assessment_results')
        .select(`
          id,
          user_id,
          primary_color,
          secondary_color,
          scores,
          created_at,
          company_users!inner(email, name, department)
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) {
        return new Response(
          JSON.stringify({ error: 'Failed to fetch results', code: 'DB_ERROR' }),
          { status: 500, headers: corsHeaders }
        );
      }

      if (format === 'csv') {
        // Generate CSV
        const headers = ['email', 'name', 'department', 'primary_color', 'secondary_color', 'completed_at'];
        const rows = results?.map(r => [
          r.company_users?.email || '',
          r.company_users?.name || '',
          r.company_users?.department || '',
          r.primary_color || '',
          r.secondary_color || '',
          r.created_at || '',
        ]) || [];

        const csv = [headers.join(','), ...rows.map(row => row.map(v => `"${v}"`).join(','))].join('\n');

        return new Response(csv, {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="assessments_export_${new Date().toISOString().split('T')[0]}.csv"`,
          },
        });
      }

      // JSON format (default)
      const exportData = results?.map(r => ({
        id: r.id,
        user: {
          id: r.user_id,
          email: r.company_users?.email,
          name: r.company_users?.name,
          department: r.company_users?.department,
        },
        results: {
          primary_color: r.primary_color,
          primary_color_name: colorNames[r.primary_color?.toLowerCase()] || r.primary_color,
          secondary_color: r.secondary_color,
          secondary_color_name: colorNames[r.secondary_color?.toLowerCase()] || r.secondary_color,
          scores: r.scores,
        },
        completed_at: r.created_at,
      })) || [];

      return new Response(
        JSON.stringify({
          export: {
            generated_at: new Date().toISOString(),
            total_records: exportData.length,
            data: exportData,
          },
        }),
        { status: 200, headers: corsHeaders }
      );
    }

    // GET /v1/assessments/:userId/results - Get assessment results for a user
    if (method === 'GET' && path.id && path.action === 'results') {
      if (!isValidUUID(path.id)) {
        return new Response(
          JSON.stringify({ error: 'Invalid user ID format', code: 'VALIDATION_ERROR' }),
          { status: 400, headers: corsHeaders }
        );
      }

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
            primary_color_name: colorNames[results.primary_color?.toLowerCase()] || results.primary_color,
            secondary_color: results.secondary_color,
            secondary_color_name: colorNames[results.secondary_color?.toLowerCase()] || results.secondary_color,
            scores: results.scores,
            completed_at: results.created_at,
          },
        }),
        { status: 200, headers: corsHeaders }
      );
    }

    // GET /v1/assessments/:userId/history - Get all assessment results for a user
    if (method === 'GET' && path.id && path.action === 'history') {
      if (!isValidUUID(path.id)) {
        return new Response(
          JSON.stringify({ error: 'Invalid user ID format', code: 'VALIDATION_ERROR' }),
          { status: 400, headers: corsHeaders }
        );
      }

      const { data: results, error } = await supabase
        .from('company_assessment_results')
        .select('id, primary_color, secondary_color, scores, created_at')
        .eq('company_id', companyId)
        .eq('user_id', path.id)
        .order('created_at', { ascending: false });

      if (error) {
        return new Response(
          JSON.stringify({ error: 'Failed to fetch history', code: 'DB_ERROR' }),
          { status: 500, headers: corsHeaders }
        );
      }

      return new Response(
        JSON.stringify({
          user_id: path.id,
          history: results?.map(r => ({
            id: r.id,
            primary_color: r.primary_color,
            secondary_color: r.secondary_color,
            scores: r.scores,
            completed_at: r.created_at,
          })) || [],
          total: results?.length || 0,
        }),
        { status: 200, headers: corsHeaders }
      );
    }

    // GET /v1/assessments/:id - Get specific assessment by ID
    if (method === 'GET' && path.id && !path.action) {
      if (!isValidUUID(path.id)) {
        return new Response(
          JSON.stringify({ error: 'Invalid assessment ID format', code: 'VALIDATION_ERROR' }),
          { status: 400, headers: corsHeaders }
        );
      }

      const { data: assessment, error } = await supabase
        .from('company_assessment_results')
        .select(`
          *,
          company_users(email, name, department)
        `)
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
            user: {
              id: assessment.user_id,
              email: assessment.company_users?.email,
              name: assessment.company_users?.name,
              department: assessment.company_users?.department,
            },
            primary_color: assessment.primary_color,
            primary_color_name: colorNames[assessment.primary_color?.toLowerCase()] || assessment.primary_color,
            secondary_color: assessment.secondary_color,
            secondary_color_name: colorNames[assessment.secondary_color?.toLowerCase()] || assessment.secondary_color,
            scores: assessment.scores,
            completed_at: assessment.created_at,
          },
        }),
        { status: 200, headers: corsHeaders }
      );
    }

    // GET /v1/assessments - List all assessments with pagination and filters
    if (method === 'GET') {
      const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);
      const offset = parseInt(url.searchParams.get('offset') || '0');
      const primaryColor = url.searchParams.get('primary_color');
      const department = url.searchParams.get('department');
      const since = url.searchParams.get('since'); // ISO date string

      let query = supabase
        .from('company_assessment_results')
        .select(`
          id,
          user_id,
          primary_color,
          secondary_color,
          created_at,
          company_users!inner(email, name, department)
        `, { count: 'exact' })
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (primaryColor) {
        query = query.ilike('primary_color', primaryColor);
      }
      if (department) {
        query = query.eq('company_users.department', department);
      }
      if (since) {
        query = query.gte('created_at', since);
      }

      const { data: assessments, error, count } = await query;

      if (error) {
        console.error('Query error:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch assessments', code: 'DB_ERROR' }),
          { status: 500, headers: corsHeaders }
        );
      }

      return new Response(
        JSON.stringify({
          assessments: assessments?.map(a => ({
            id: a.id,
            user: {
              id: a.user_id,
              email: a.company_users?.email,
              name: a.company_users?.name,
              department: a.company_users?.department,
            },
            primary_color: a.primary_color,
            secondary_color: a.secondary_color,
            completed_at: a.created_at,
          })) || [],
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
