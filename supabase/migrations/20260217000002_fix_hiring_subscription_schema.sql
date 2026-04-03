-- Ensure required columns exist on companies for Hiring subscriptions
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS hiring_subscription_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS hiring_subscription_status TEXT,
  ADD COLUMN IF NOT EXISTS hiring_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS hiring_subscription_current_period_end TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS hiring_subscription_cancel_at_period_end BOOLEAN DEFAULT FALSE;

-- Stripe customer + credit balance helpers
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS credit_balance DECIMAL(10, 2) NOT NULL DEFAULT 0.00;

-- Create billing_transactions table if missing (amounts in dollars)
CREATE TABLE IF NOT EXISTS public.billing_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('charge','refund','credit_used','credit_added')),
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT,
  stripe_payment_intent_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_billing_transactions_company ON public.billing_transactions(company_id);

-- Reload PostgREST schema cache so new columns are visible immediately
NOTIFY pgrst, 'reload schema';
