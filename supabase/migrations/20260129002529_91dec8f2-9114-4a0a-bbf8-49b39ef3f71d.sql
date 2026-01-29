-- Add public read access for candidates by invite code
-- This allows unauthenticated candidates to access their own record via invite code
CREATE POLICY "Public can read candidates by invite code"
ON public.candidates
FOR SELECT
USING (invite_code IS NOT NULL);