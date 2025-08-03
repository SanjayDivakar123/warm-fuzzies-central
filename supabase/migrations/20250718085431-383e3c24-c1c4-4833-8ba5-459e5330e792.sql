-- Create table to store assessment results with passcodes
CREATE TABLE public.assessment_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  passcode TEXT UNIQUE NOT NULL,
  assessment_type TEXT NOT NULL CHECK (assessment_type IN ('free', 'premium', 'pro')),
  results JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '1 year')
);

-- Enable Row Level Security
ALTER TABLE public.assessment_results ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to read results with valid passcode
CREATE POLICY "Anyone can read results with passcode" 
ON public.assessment_results 
FOR SELECT 
USING (true);

-- Create policy to allow inserting results
CREATE POLICY "Anyone can insert results" 
ON public.assessment_results 
FOR INSERT 
WITH CHECK (true);

-- Create index for faster passcode lookups
CREATE INDEX idx_assessment_results_passcode ON public.assessment_results(passcode);

-- Create index for cleanup of expired results
CREATE INDEX idx_assessment_results_expires_at ON public.assessment_results(expires_at);