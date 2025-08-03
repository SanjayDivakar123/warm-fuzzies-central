-- Remove passcode system and add user authentication to assessment_results
ALTER TABLE public.assessment_results 
DROP COLUMN IF EXISTS passcode,
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update RLS policies for assessment_results
DROP POLICY IF EXISTS "Anyone can insert results" ON public.assessment_results;
DROP POLICY IF EXISTS "Anyone can read results with passcode" ON public.assessment_results;

-- Create new RLS policies for authenticated users
CREATE POLICY "Users can insert their own results" 
ON public.assessment_results 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own results" 
ON public.assessment_results 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own results" 
ON public.assessment_results 
FOR UPDATE 
USING (auth.uid() = user_id);