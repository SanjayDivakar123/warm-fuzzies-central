-- BambooHR integration support for Hiring platform

-- Store BambooHR OAuth connection per company
CREATE TABLE IF NOT EXISTS public.bamboohr_integrations (
  company_id UUID PRIMARY KEY REFERENCES public.companies(id) ON DELETE CASCADE,
  company_domain TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  scope TEXT,
  connected_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  connected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_synced_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.bamboohr_integrations ENABLE ROW LEVEL SECURITY;

-- Service role is used by Edge Functions for reads/writes.
-- Keep table inaccessible from direct client queries.

-- Add external source tracking to synced jobs
ALTER TABLE public.job_postings
  ADD COLUMN IF NOT EXISTS external_source TEXT,
  ADD COLUMN IF NOT EXISTS external_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_job_postings_external_source_id
  ON public.job_postings(company_id, external_source, external_id)
  WHERE external_source IS NOT NULL AND external_id IS NOT NULL;
