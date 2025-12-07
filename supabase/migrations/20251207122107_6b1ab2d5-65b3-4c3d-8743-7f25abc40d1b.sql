-- Add job_role and skills columns to company_users
ALTER TABLE public.company_users ADD COLUMN IF NOT EXISTS job_role TEXT;
ALTER TABLE public.company_users ADD COLUMN IF NOT EXISTS skills TEXT[] DEFAULT '{}';