-- Fix autosave/save-and-exit: allow users to UPDATE/DELETE their own assessment_progress rows
-- (Currently only INSERT + SELECT are permitted)

ALTER TABLE public.assessment_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can update their own assessment progress" ON public.assessment_progress;
DROP POLICY IF EXISTS "Users can delete their own assessment progress" ON public.assessment_progress;

CREATE POLICY "Users can update their own assessment progress"
ON public.assessment_progress
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own assessment progress"
ON public.assessment_progress
FOR DELETE
USING (auth.uid() = user_id);
