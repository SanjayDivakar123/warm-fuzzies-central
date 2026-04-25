CREATE TABLE IF NOT EXISTS public.ownership_transfer_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  requested_by_user_id UUID NOT NULL,
  requested_by_email TEXT NOT NULL,
  target_company_user_id UUID NOT NULL REFERENCES public.company_users(id) ON DELETE CASCADE,
  target_email TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ownership_transfer_requests_company
  ON public.ownership_transfer_requests(company_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ownership_transfer_requests_active
  ON public.ownership_transfer_requests(company_id, target_company_user_id)
  WHERE consumed_at IS NULL;

ALTER TABLE public.ownership_transfer_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage ownership transfer requests"
  ON public.ownership_transfer_requests
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role')
  WITH CHECK (auth.jwt()->>'role' = 'service_role');
