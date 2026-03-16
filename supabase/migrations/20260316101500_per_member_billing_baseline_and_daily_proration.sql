-- Immediate switch to per-member billing baseline and daily proration tracking.

-- The legacy seats_purchased field remains for compatibility, but billing baseline is fixed at 2 users.
ALTER TABLE public.companies
  ALTER COLUMN seats_purchased SET DEFAULT 2;

UPDATE public.companies
SET seats_purchased = 2
WHERE seats_purchased IS DISTINCT FROM 2;

-- Ensure billing anchor fields are populated so daily/renewal billing has a deterministic reference.
UPDATE public.companies
SET portal_billing_anchor_at = COALESCE(portal_billing_anchor_at, created_at),
    portal_billing_next_renewal_at = COALESCE(portal_billing_next_renewal_at, now() + interval '1 month')
WHERE portal_billing_anchor_at IS NULL
   OR portal_billing_next_renewal_at IS NULL;

-- Track once-per-day proration update idempotency per invited/active charged user.
ALTER TABLE public.company_users
  ADD COLUMN IF NOT EXISTS proration_last_adjusted_on DATE;

COMMENT ON COLUMN public.company_users.proration_last_adjusted_on
IS 'UTC date when the user proration amount was last processed by the daily adjustment job.';

CREATE INDEX IF NOT EXISTS idx_company_users_daily_proration
  ON public.company_users (company_id, proration_last_adjusted_on)
  WHERE status <> 'revoked' AND charge_amount > 0;
