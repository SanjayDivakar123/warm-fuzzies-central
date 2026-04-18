import { createClient } from '@supabase/supabase-js';
import { TEST_FIXTURES, runSeed } from '../../scripts/seed.js';

function getSchema() {
  return process.env.TEST_SUPABASE_SCHEMA || process.env.SUPABASE_SCHEMA || 'public';
}

export function getTestSupabase() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_JWT, {
    db: { schema: getSchema() },
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

export async function reseedTestData() {
  return runSeed();
}

export async function getTestTenant() {
  const supabase = getTestSupabase();
  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('owner_email', TEST_FIXTURES.tenant.owner_email)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function getLeadByEmail(email) {
  const supabase = getTestSupabase();
  const { data, error } = await supabase.from('leads').select('*').eq('email', email).single();

  if (error) {
    throw error;
  }

  return data;
}
