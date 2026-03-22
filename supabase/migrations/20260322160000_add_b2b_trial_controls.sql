-- Super-admin configurable B2B trial controls
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS b2b_trial_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS b2b_trial_starts_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS b2b_trial_ends_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS b2b_trial_user_limit INTEGER NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS b2b_trial_converted_at TIMESTAMPTZ;

ALTER TABLE public.companies
  DROP CONSTRAINT IF EXISTS companies_b2b_trial_user_limit_check;

ALTER TABLE public.companies
  ADD CONSTRAINT companies_b2b_trial_user_limit_check
  CHECK (b2b_trial_user_limit >= 1 AND b2b_trial_user_limit <= 10000);
