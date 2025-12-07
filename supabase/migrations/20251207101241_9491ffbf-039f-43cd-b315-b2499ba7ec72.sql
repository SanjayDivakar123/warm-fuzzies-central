-- Add invite_count column to track resend attempts
ALTER TABLE public.company_users 
ADD COLUMN IF NOT EXISTS invite_count integer NOT NULL DEFAULT 1;