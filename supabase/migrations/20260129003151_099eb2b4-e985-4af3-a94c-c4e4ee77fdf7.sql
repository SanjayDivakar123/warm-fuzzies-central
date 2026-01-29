-- Allow candidates to insert their own assessment results
-- The user_id will be the candidate's id, not an auth user id
CREATE POLICY "Candidates can insert their own assessment results"
ON public.assessment_results
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.candidates
    WHERE candidates.id = user_id
    AND candidates.invite_code IS NOT NULL
  )
);

-- Allow candidates to update their own assessment results (for retakes)
CREATE POLICY "Candidates can update their own assessment results"
ON public.assessment_results
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.candidates
    WHERE candidates.id = user_id
    AND candidates.invite_code IS NOT NULL
  )
);

-- Allow candidates to view their own assessment results
CREATE POLICY "Candidates can view their own assessment results"
ON public.assessment_results
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.candidates
    WHERE candidates.id = user_id
    AND candidates.invite_code IS NOT NULL
  )
);

-- Also need to allow public updates to candidate records for assessment completion
CREATE POLICY "Public can update candidate status by invite code"
ON public.candidates
FOR UPDATE
USING (invite_code IS NOT NULL)
WITH CHECK (invite_code IS NOT NULL);