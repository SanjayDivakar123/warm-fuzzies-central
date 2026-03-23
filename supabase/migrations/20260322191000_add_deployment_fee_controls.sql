-- Deployment fee controls for super-admin created B2B companies
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS requires_post_setup_deployment_fee BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS deployment_fee_waived BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS deployment_fee_waived_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deployment_fee_charged_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deployment_fee_payment_intent_id TEXT;
