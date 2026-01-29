-- Drop the existing constraint and recreate with all valid assessment types
ALTER TABLE public.assessment_results 
DROP CONSTRAINT IF EXISTS assessment_results_assessment_type_check;

-- Add updated constraint with all valid assessment types including candidate assessments
ALTER TABLE public.assessment_results
ADD CONSTRAINT assessment_results_assessment_type_check 
CHECK (assessment_type = ANY (ARRAY[
  -- Consumer assessment types
  'free'::text, 
  'premium'::text, 
  'pro'::text, 
  'leadership'::text, 
  'voice'::text,
  -- B2B employee assessment types
  'professional_25q'::text, 
  'professional_50q'::text,
  -- Candidate assessment types (all categories x all types)
  'candidate_professional_25q'::text,
  'candidate_professional_50q'::text,
  'candidate_entrepreneur_25q'::text,
  'candidate_entrepreneur_50q'::text,
  'candidate_executive_25q'::text,
  'candidate_executive_50q'::text,
  'candidate_manager_25q'::text,
  'candidate_manager_50q'::text,
  'candidate_student_25q'::text,
  'candidate_student_50q'::text,
  'candidate_teacher_25q'::text,
  'candidate_teacher_50q'::text
]));