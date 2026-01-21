-- Fix search_path for the subdomain validation function
CREATE OR REPLACE FUNCTION public.validate_company_subdomain()
RETURNS TRIGGER AS $$
DECLARE
  reserved_names TEXT[] := ARRAY['www', 'api', 'admin', 'app', 'dashboard', 'mail', 'ftp', 'cdn', 'assets', 'static', 'dev', 'staging', 'test', 'demo', 'support', 'help', 'billing', 'account', 'login', 'auth', 'sso', 'oauth', 'ns1', 'ns2', 'mx', 'smtp', 'pop', 'imap', 'webmail', 'blog', 'docs', 'status'];
BEGIN
  -- Validate subdomain format (lowercase alphanumeric and hyphens, 3-63 chars, no leading/trailing hyphens)
  IF NEW.subdomain IS NOT NULL AND NEW.subdomain != '' THEN
    IF NEW.subdomain !~ '^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$' AND NEW.subdomain !~ '^[a-z0-9]{3,63}$' THEN
      RAISE EXCEPTION 'Invalid subdomain format. Must be 3-63 characters, lowercase alphanumeric and hyphens only, cannot start or end with a hyphen.';
    END IF;
    
    -- Check for reserved names
    IF NEW.subdomain = ANY(reserved_names) THEN
      RAISE EXCEPTION 'This subdomain is reserved and cannot be used.';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;