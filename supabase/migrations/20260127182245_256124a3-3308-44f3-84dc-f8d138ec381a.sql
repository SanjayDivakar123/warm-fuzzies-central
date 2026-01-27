-- Add Slack bot token column to companies table
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS slack_bot_token text;

-- Add index for faster Slack lookups
CREATE INDEX IF NOT EXISTS idx_companies_slack_enabled 
ON public.companies(slack_notifications_enabled) 
WHERE slack_notifications_enabled = true;