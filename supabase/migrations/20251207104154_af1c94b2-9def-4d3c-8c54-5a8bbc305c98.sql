-- Drop the existing check constraint
ALTER TABLE public.assessment_results DROP CONSTRAINT IF EXISTS assessment_results_assessment_type_check;

-- Add a new check constraint that includes professional assessment types
ALTER TABLE public.assessment_results ADD CONSTRAINT assessment_results_assessment_type_check 
CHECK (assessment_type IN ('free', 'premium', 'pro', 'leadership', 'voice', 'professional_25q', 'professional_50q'));