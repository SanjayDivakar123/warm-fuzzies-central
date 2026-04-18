import { getServiceSupabase } from './supabase.js';
import { serializeError } from './logging.js';

export const REQUIRED_ENV_VARS = [
  'VERCEL_URL',
  'ADMIN_PASSWORD',
  'GROQ_API_KEY',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_JWT',
  'GMAIL_CLIENT_ID',
  'GMAIL_CLIENT_SECRET',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'BLOB_READ_WRITE_TOKEN',
  'CALENDLY_URL'
];

export function validateRequiredEnvVars() {
  const missing = REQUIRED_ENV_VARS.filter((name) => !process.env[name]);

  if (missing.length > 0) {
    console.error('Missing required environment variables:');
    missing.forEach((name) => console.error(`- ${name}`));
    throw new Error(`Server startup aborted. Missing ${missing.length} required environment variable(s).`);
  }
}

export async function verifySupabaseConnection() {
  try {
    const supabase = getServiceSupabase();
    const { error } = await supabase.from('agent_log').select('id', { head: true, count: 'exact' }).limit(1);

    if (error) {
      throw error;
    }

    console.log('Supabase connection check passed.');
  } catch (error) {
    throw new Error(`Supabase connection check failed: ${serializeError(error)}`);
  }
}
