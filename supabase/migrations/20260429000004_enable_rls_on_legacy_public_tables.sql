-- Close Supabase advisor warnings for legacy public tables that should not be
-- readable or writable from the client by default.
ALTER TABLE IF EXISTS public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.company_users ENABLE ROW LEVEL SECURITY;
