-- Add per-employee assessment configuration columns
ALTER TABLE public.company_users 
ADD COLUMN IF NOT EXISTS assessment_category text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS assessment_type text DEFAULT NULL;

-- Add comment to explain the fields
COMMENT ON COLUMN public.company_users.assessment_category IS 'Per-employee assessment category override (professional, entrepreneur, executive, manager). NULL means not assigned yet.';
COMMENT ON COLUMN public.company_users.assessment_type IS 'Per-employee assessment type override (25q, 50q). NULL means not assigned yet.';