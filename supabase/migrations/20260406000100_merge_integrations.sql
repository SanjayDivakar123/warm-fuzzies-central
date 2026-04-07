DO $$
BEGIN
  CREATE TYPE public.merge_connection_category AS ENUM ('hris', 'ats');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE public.merge_connection_status AS ENUM ('connected', 'reconnect_required', 'disconnected');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE public.merge_sync_status AS ENUM ('idle', 'syncing', 'retrying', 'error');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE public.rolecolor_sync_status AS ENUM ('pending', 'matched');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.merge_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  platform_name TEXT NOT NULL,
  category public.merge_connection_category NOT NULL,
  integration_slug TEXT,
  account_token TEXT,
  linked_account_id TEXT,
  webhook_listener_url TEXT,
  connection_status public.merge_connection_status NOT NULL DEFAULT 'connected',
  sync_status public.merge_sync_status NOT NULL DEFAULT 'idle',
  connected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_synced_at TIMESTAMPTZ,
  last_error_code TEXT,
  last_error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT merge_connections_org_category_key UNIQUE (org_id, category)
);

CREATE TABLE IF NOT EXISTS public.hris_employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  merge_id TEXT NOT NULL,
  platform_name TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  department TEXT,
  job_title TEXT,
  employment_status TEXT,
  manager_id TEXT,
  avatar_url TEXT,
  rolecolor_id UUID REFERENCES public.assessment_results(id) ON DELETE SET NULL,
  rolecolor_status public.rolecolor_sync_status NOT NULL DEFAULT 'pending',
  assessment_invite_sent_at TIMESTAMPTZ,
  raw_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT hris_employees_org_merge_key UNIQUE (org_id, merge_id)
);

CREATE TABLE IF NOT EXISTS public.ats_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  merge_id TEXT NOT NULL,
  platform_name TEXT NOT NULL,
  title TEXT,
  status TEXT,
  departments TEXT[] NOT NULL DEFAULT '{}',
  offices TEXT[] NOT NULL DEFAULT '{}',
  raw_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT ats_jobs_org_merge_key UNIQUE (org_id, merge_id)
);

CREATE TABLE IF NOT EXISTS public.ats_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  merge_id TEXT NOT NULL,
  platform_name TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  raw_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT ats_candidates_org_merge_key UNIQUE (org_id, merge_id)
);

CREATE TABLE IF NOT EXISTS public.ats_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  merge_id TEXT NOT NULL,
  platform_name TEXT NOT NULL,
  candidate_id TEXT,
  job_id TEXT,
  current_stage TEXT,
  status TEXT,
  raw_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT ats_applications_org_merge_key UNIQUE (org_id, merge_id)
);

CREATE TABLE IF NOT EXISTS public.merge_sync_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  category public.merge_connection_category,
  error_code TEXT,
  error_message TEXT NOT NULL,
  context JSONB NOT NULL DEFAULT '{}'::jsonb,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE INDEX IF NOT EXISTS merge_connections_org_id_idx
  ON public.merge_connections(org_id, is_active, category);

CREATE INDEX IF NOT EXISTS hris_employees_org_id_idx
  ON public.hris_employees(org_id, is_active);

CREATE INDEX IF NOT EXISTS hris_employees_email_idx
  ON public.hris_employees(org_id, email);

CREATE INDEX IF NOT EXISTS ats_jobs_org_id_idx
  ON public.ats_jobs(org_id, is_active);

CREATE INDEX IF NOT EXISTS ats_candidates_org_id_idx
  ON public.ats_candidates(org_id, is_active);

CREATE INDEX IF NOT EXISTS ats_candidates_email_idx
  ON public.ats_candidates(org_id, email);

CREATE INDEX IF NOT EXISTS ats_applications_org_id_idx
  ON public.ats_applications(org_id, is_active);

CREATE INDEX IF NOT EXISTS merge_sync_errors_org_id_idx
  ON public.merge_sync_errors(org_id, occurred_at DESC);

ALTER TABLE public.merge_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hris_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ats_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ats_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ats_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merge_sync_errors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can manage merge connections" ON public.merge_connections;
CREATE POLICY "Service role can manage merge connections"
ON public.merge_connections
FOR ALL
USING ((auth.jwt() ->> 'role') = 'service_role');

DROP POLICY IF EXISTS "Company admins and HR can view hris employees" ON public.hris_employees;
CREATE POLICY "Company admins and HR can view hris employees"
ON public.hris_employees
FOR SELECT
USING (
  org_id IN (
    SELECT company_id
    FROM public.company_users
    WHERE user_id = auth.uid()
      AND role IN ('admin', 'hr')
  )
);

DROP POLICY IF EXISTS "Service role can manage hris employees" ON public.hris_employees;
CREATE POLICY "Service role can manage hris employees"
ON public.hris_employees
FOR ALL
USING ((auth.jwt() ->> 'role') = 'service_role');

DROP POLICY IF EXISTS "Company admins and HR can view ats jobs" ON public.ats_jobs;
CREATE POLICY "Company admins and HR can view ats jobs"
ON public.ats_jobs
FOR SELECT
USING (
  org_id IN (
    SELECT company_id
    FROM public.company_users
    WHERE user_id = auth.uid()
      AND role IN ('admin', 'hr')
  )
);

DROP POLICY IF EXISTS "Service role can manage ats jobs" ON public.ats_jobs;
CREATE POLICY "Service role can manage ats jobs"
ON public.ats_jobs
FOR ALL
USING ((auth.jwt() ->> 'role') = 'service_role');

DROP POLICY IF EXISTS "Company admins and HR can view ats candidates" ON public.ats_candidates;
CREATE POLICY "Company admins and HR can view ats candidates"
ON public.ats_candidates
FOR SELECT
USING (
  org_id IN (
    SELECT company_id
    FROM public.company_users
    WHERE user_id = auth.uid()
      AND role IN ('admin', 'hr')
  )
);

DROP POLICY IF EXISTS "Service role can manage ats candidates" ON public.ats_candidates;
CREATE POLICY "Service role can manage ats candidates"
ON public.ats_candidates
FOR ALL
USING ((auth.jwt() ->> 'role') = 'service_role');

DROP POLICY IF EXISTS "Company admins and HR can view ats applications" ON public.ats_applications;
CREATE POLICY "Company admins and HR can view ats applications"
ON public.ats_applications
FOR SELECT
USING (
  org_id IN (
    SELECT company_id
    FROM public.company_users
    WHERE user_id = auth.uid()
      AND role IN ('admin', 'hr')
  )
);

DROP POLICY IF EXISTS "Service role can manage ats applications" ON public.ats_applications;
CREATE POLICY "Service role can manage ats applications"
ON public.ats_applications
FOR ALL
USING ((auth.jwt() ->> 'role') = 'service_role');

DROP POLICY IF EXISTS "Service role can manage merge sync errors" ON public.merge_sync_errors;
CREATE POLICY "Service role can manage merge sync errors"
ON public.merge_sync_errors
FOR ALL
USING ((auth.jwt() ->> 'role') = 'service_role');

DROP TRIGGER IF EXISTS update_merge_connections_updated_at ON public.merge_connections;
CREATE TRIGGER update_merge_connections_updated_at
  BEFORE UPDATE ON public.merge_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_hris_employees_updated_at ON public.hris_employees;
CREATE TRIGGER update_hris_employees_updated_at
  BEFORE UPDATE ON public.hris_employees
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_ats_jobs_updated_at ON public.ats_jobs;
CREATE TRIGGER update_ats_jobs_updated_at
  BEFORE UPDATE ON public.ats_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_ats_candidates_updated_at ON public.ats_candidates;
CREATE TRIGGER update_ats_candidates_updated_at
  BEFORE UPDATE ON public.ats_candidates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_ats_applications_updated_at ON public.ats_applications;
CREATE TRIGGER update_ats_applications_updated_at
  BEFORE UPDATE ON public.ats_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_merge_sync_errors_updated_at ON public.merge_sync_errors;
CREATE TRIGGER update_merge_sync_errors_updated_at
  BEFORE UPDATE ON public.merge_sync_errors
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
