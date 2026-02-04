// Supabase Edge Function: validate-api-key
// Verifies an API key against company_api_keys, checks active/expiry, returns company context and permissions.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
};

async function sha256(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceKey) {
      return new Response(JSON.stringify({ error: 'Server misconfigured' }), { status: 500, headers: corsHeaders });
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    // Accept either x-api-key header or Authorization: Bearer rcf_...
    let rawKey = req.headers.get('x-api-key') || null;
    const authHeader = req.headers.get('Authorization');
    if (!rawKey && authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
      rawKey = authHeader.slice(7).trim();
    }

    if (!rawKey) {
      return new Response(JSON.stringify({ error: 'Missing API key' }), { status: 400, headers: corsHeaders });
    }

    if (!rawKey.startsWith('rcf_')) {
      return new Response(JSON.stringify({ error: 'Invalid API key format' }), { status: 401, headers: corsHeaders });
    }

    const keyPrefix = rawKey.substring(0, 8);

    // Find candidate keys by prefix and active status
    const { data: keys, error } = await supabase
      .from('company_api_keys')
      .select('id, company_id, key_hash, key_prefix, permissions, is_active, expires_at')
      .eq('key_prefix', keyPrefix)
      .eq('is_active', true);

    if (error) {
      console.error('DB error:', error);
      return new Response(JSON.stringify({ error: 'Database error' }), { status: 500, headers: corsHeaders });
    }

    if (!keys || keys.length === 0) {
      return new Response(JSON.stringify({ error: 'API key not found or inactive' }), { status: 401, headers: corsHeaders });
    }

    // Check expiry and verify hash
    const now = new Date();
    const keyHash = await sha256(rawKey);
    const match = keys.find((k) => {
      const notExpired = !k.expires_at || new Date(k.expires_at) > now;
      return notExpired && k.key_hash === keyHash;
    });

    if (!match) {
      return new Response(JSON.stringify({ error: 'Invalid or expired API key' }), { status: 401, headers: corsHeaders });
    }

    // Update last_used_at
    const { error: updError } = await supabase
      .from('company_api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', match.id);
    if (updError) {
      console.warn('Failed to update last_used_at:', updError.message);
    }

    return new Response(
      JSON.stringify({
        company_id: match.company_id,
        permissions: match.permissions,
        key_prefix: match.key_prefix,
        status: 'ok',
      }),
      { status: 200, headers: corsHeaders },
    );
  } catch (err) {
    console.error('Unhandled error:', err);
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500, headers: corsHeaders });
  }
});
