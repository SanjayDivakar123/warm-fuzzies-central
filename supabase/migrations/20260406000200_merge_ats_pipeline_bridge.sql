-- Bridge Merge ATS records into RCF hiring pipeline tables

ALTER TABLE public.candidates
  ADD COLUMN IF NOT EXISTS external_source TEXT,
  ADD COLUMN IF NOT EXISTS external_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_candidates_external_source_id
  ON public.candidates(company_id, external_source, external_id)
  WHERE external_source IS NOT NULL AND external_id IS NOT NULL;

ALTER TABLE public.candidate_applications
  ADD COLUMN IF NOT EXISTS external_source TEXT,
  ADD COLUMN IF NOT EXISTS external_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_candidate_applications_external_source_id
  ON public.candidate_applications(job_posting_id, external_source, external_id)
  WHERE external_source IS NOT NULL AND external_id IS NOT NULL;
