CREATE TABLE IF NOT EXISTS public.company_deletion_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  requested_by UUID,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_company_deletion_requests_company_id
  ON public.company_deletion_requests(company_id);

CREATE INDEX IF NOT EXISTS idx_company_deletion_requests_expires_at
  ON public.company_deletion_requests(expires_at);

ALTER TABLE public.company_deletion_requests ENABLE ROW LEVEL SECURITY;
