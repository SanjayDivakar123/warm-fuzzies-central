process.env.SUPABASE_SCHEMA = process.env.TEST_SUPABASE_SCHEMA || process.env.SUPABASE_SCHEMA || 'public';
process.env.ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'test-admin-password';
process.env.VERCEL_URL = process.env.VERCEL_URL || 'http://localhost:5173';
