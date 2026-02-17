-- Add Hiring subscription columns to companies table
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS hiring_subscription_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS hiring_subscription_status TEXT DEFAULT NULL, -- 'active', 'cancelled', 'past_due'
ADD COLUMN IF NOT EXISTS hiring_subscription_id TEXT DEFAULT NULL, -- Stripe subscription ID
ADD COLUMN IF NOT EXISTS hiring_subscription_current_period_end TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS hiring_subscription_cancel_at_period_end BOOLEAN DEFAULT FALSE;

-- Add comment for documentation
COMMENT ON COLUMN public.companies.hiring_subscription_enabled IS 'Whether the company has an active Hiring tab subscription ($500/month)';
COMMENT ON COLUMN public.companies.hiring_subscription_status IS 'Status of the hiring subscription: active, cancelled, past_due';
COMMENT ON COLUMN public.companies.hiring_subscription_id IS 'Stripe subscription ID for the hiring feature';
COMMENT ON COLUMN public.companies.hiring_subscription_current_period_end IS 'Current billing period end date for hiring subscription';
COMMENT ON COLUMN public.companies.hiring_subscription_cancel_at_period_end IS 'Whether the subscription is set to cancel at period end';
