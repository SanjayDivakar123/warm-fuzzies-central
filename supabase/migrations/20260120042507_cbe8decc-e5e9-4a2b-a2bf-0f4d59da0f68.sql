-- Add dark mode logo column to companies table
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS logo_url_dark text;