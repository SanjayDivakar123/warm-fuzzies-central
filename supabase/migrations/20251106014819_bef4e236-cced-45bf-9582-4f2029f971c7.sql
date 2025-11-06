-- Fix function search path security warning (with CASCADE)
DROP FUNCTION IF EXISTS generate_shareable_code() CASCADE;

CREATE OR REPLACE FUNCTION generate_shareable_code() 
RETURNS text 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Re-add the default
ALTER TABLE public.assessment_results 
ALTER COLUMN shareable_code SET DEFAULT generate_shareable_code();