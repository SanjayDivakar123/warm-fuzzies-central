-- Add insight usage tracking columns to companies table
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS insight_usage_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS insight_usage_month TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS insight_credits INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS insights_paid_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS allow_pay_per_insight BOOLEAN DEFAULT FALSE;

-- Add comment for documentation
COMMENT ON COLUMN public.companies.insight_usage_count IS 'Number of AI insights generated this month';
COMMENT ON COLUMN public.companies.insight_usage_month IS 'Month string (YYYY-MM) for tracking usage reset';
COMMENT ON COLUMN public.companies.insight_credits IS 'Purchased insight credits available';
COMMENT ON COLUMN public.companies.insights_paid_enabled IS 'Whether company has purchased insight access';
COMMENT ON COLUMN public.companies.allow_pay_per_insight IS 'Allow pay-per-insight ($1 each)';
