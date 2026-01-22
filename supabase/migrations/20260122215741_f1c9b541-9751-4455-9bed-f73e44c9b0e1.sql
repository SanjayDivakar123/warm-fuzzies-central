-- Add subdomain_status field to track subdomain provisioning state
-- pending: subdomain enabled, waiting for SSL provisioning
-- active: subdomain fully active and working
-- failed: subdomain provisioning failed
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS subdomain_status text DEFAULT 'pending' CHECK (subdomain_status IN ('pending', 'active', 'failed'));