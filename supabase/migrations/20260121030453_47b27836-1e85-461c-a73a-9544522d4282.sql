-- Add subdomain_enabled column to companies table
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS subdomain_enabled BOOLEAN DEFAULT false;

-- Add comment for clarity
COMMENT ON COLUMN public.companies.subdomain_enabled IS 'When enabled, company portal is accessible via {subdomain}.rolecolorfinder.com';

-- Create a function to validate subdomain format and check reserved names
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
$$ LANGUAGE plpgsql;

-- Create trigger for subdomain validation
DROP TRIGGER IF EXISTS validate_subdomain_trigger ON public.companies;
CREATE TRIGGER validate_subdomain_trigger
  BEFORE INSERT OR UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_company_subdomain();

-- Ensure subdomain uniqueness (already likely exists but let's make sure)
CREATE UNIQUE INDEX IF NOT EXISTS companies_subdomain_unique ON public.companies (subdomain) WHERE subdomain IS NOT NULL AND subdomain != '';