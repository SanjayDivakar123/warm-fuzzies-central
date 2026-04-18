-- Allow multiple saved assessments per user and type (e.g., multiple pro runs)
ALTER TABLE public.assessment_results
DROP CONSTRAINT IF EXISTS assessment_results_user_id_assessment_type_key;
