-- Add column to track if company has ever subscribed to hiring tab
-- This allows us to show a different UI for returning subscribers vs new ones
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS hiring_ever_subscribed BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN public.companies.hiring_ever_subscribed IS 'Whether the company has ever had an active hiring subscription (helps with resubscribe flow)';

-- Update existing companies that currently have or had hiring enabled
UPDATE public.companies
SET hiring_ever_subscribed = TRUE
WHERE hiring_subscription_id IS NOT NULL
   OR hiring_subscription_enabled = TRUE;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
