ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS portal_billing_anchor_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS portal_billing_next_renewal_at TIMESTAMPTZ;

COMMENT ON COLUMN public.companies.portal_billing_anchor_at IS 'Authoritative shared monthly billing anchor for B2B company renewals.';
COMMENT ON COLUMN public.companies.portal_billing_next_renewal_at IS 'Next due timestamp for the shared monthly B2B renewal.';

UPDATE public.companies
SET portal_billing_anchor_at = COALESCE(portal_billing_anchor_at, created_at)
WHERE portal_billing_anchor_at IS NULL;

CREATE TABLE IF NOT EXISTS public.company_portal_billing_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  renewal_at TIMESTAMPTZ NOT NULL,
  billed_user_count INTEGER NOT NULL DEFAULT 0,
  total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  credits_applied DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  card_charged DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  outstanding_balance DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'failed', 'recovered')),
  idempotency_key TEXT NOT NULL,
  stripe_payment_intent_id TEXT,
  failure_reason TEXT,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  recovered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT company_portal_billing_periods_company_period_key UNIQUE (company_id, period_start, period_end),
  CONSTRAINT company_portal_billing_periods_idempotency_key_key UNIQUE (idempotency_key)
);

ALTER TABLE public.company_portal_billing_periods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company management can view portal billing periods"
ON public.company_portal_billing_periods
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.company_users
    WHERE company_users.company_id = company_portal_billing_periods.company_id
      AND company_users.user_id = auth.uid()
      AND company_users.status = 'active'
      AND company_users.role IN ('admin', 'hr', 'partner')
  )
);

ALTER TABLE public.billing_transactions
  ADD COLUMN IF NOT EXISTS billing_period_id UUID REFERENCES public.company_portal_billing_periods(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_company_portal_billing_periods_company_renewal
  ON public.company_portal_billing_periods(company_id, renewal_at DESC);

CREATE INDEX IF NOT EXISTS idx_company_portal_billing_periods_status
  ON public.company_portal_billing_periods(status, renewal_at);

CREATE INDEX IF NOT EXISTS idx_billing_transactions_billing_period_id
  ON public.billing_transactions(billing_period_id);
