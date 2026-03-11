ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS portal_access_locked BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS portal_access_lock_reason TEXT,
  ADD COLUMN IF NOT EXISTS portal_access_locked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS portal_access_outstanding_balance DECIMAL(10, 2) NOT NULL DEFAULT 0.00;

COMMENT ON COLUMN public.companies.portal_access_locked IS 'Whether company management portal access is suspended because a renewal payment failed.';
COMMENT ON COLUMN public.companies.portal_access_lock_reason IS 'Human-readable reason for the current portal access lock.';
COMMENT ON COLUMN public.companies.portal_access_locked_at IS 'Timestamp when the current portal access lock was applied.';
COMMENT ON COLUMN public.companies.portal_access_outstanding_balance IS 'Outstanding renewal balance that must be settled before portal access is restored.';