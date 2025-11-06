-- Add shareable_code column to assessment_results
ALTER TABLE public.assessment_results 
ADD COLUMN shareable_code text UNIQUE;

-- Create index for faster lookups
CREATE INDEX idx_assessment_results_shareable_code ON public.assessment_results(shareable_code);

-- Function to generate random shareable code
CREATE OR REPLACE FUNCTION generate_shareable_code() 
RETURNS text 
LANGUAGE plpgsql
AS $$
DECLARE
  chars text := 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result text := '';
  i integer;
BEGIN
  FOR i IN 1..10 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$;

-- Generate codes for existing records
UPDATE public.assessment_results 
SET shareable_code = generate_shareable_code() 
WHERE shareable_code IS NULL;

-- Make shareable_code NOT NULL after populating
ALTER TABLE public.assessment_results 
ALTER COLUMN shareable_code SET NOT NULL;

-- Set default for new records
ALTER TABLE public.assessment_results 
ALTER COLUMN shareable_code SET DEFAULT generate_shareable_code();

-- Add RLS policy for public access via shareable code
CREATE POLICY "Anyone can view results via shareable code" 
ON public.assessment_results 
FOR SELECT 
USING (shareable_code IS NOT NULL);