import { createClient } from '@supabase/supabase-js';
import { optionalEnv, requireEnv } from './env.js';

let serviceClient;
let browserClient;

function getConfiguredSchema() {
  return optionalEnv('SUPABASE_SCHEMA', 'public');
}

export function getServiceSupabase() {
  if (!serviceClient) {
    serviceClient = createClient(
      requireEnv('SUPABASE_URL'),
      requireEnv('SUPABASE_SERVICE_ROLE_JWT'),
      {
        db: {
          schema: getConfiguredSchema()
        },
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      }
    );
  }

  return serviceClient;
}

export function getBrowserSupabase() {
  if (!browserClient) {
    const url = optionalEnv('VITE_SUPABASE_URL');
    const anon = optionalEnv('VITE_SUPABASE_PUBLISHABLE_KEY');

    if (!url || !anon) {
      return null;
    }

    browserClient = createClient(url, anon, {
      db: {
        schema: getConfiguredSchema()
      }
    });
  }

  return browserClient;
}

export function getTenantBrowserClient() {
  return getBrowserSupabase();
}

export function resetSupabaseClients() {
  serviceClient = undefined;
  browserClient = undefined;
}
