-- Fix security: Set search_path for generate_invite_code function
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$;

-- Fix security: Set search_path for is_valid_subdomain function
CREATE OR REPLACE FUNCTION is_valid_subdomain(subdomain TEXT)
RETURNS BOOLEAN 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN subdomain ~ '^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$'
    AND subdomain NOT IN ('www', 'api', 'admin', 'app', 'dashboard', 'mail', 'ftp');
END;
$$;