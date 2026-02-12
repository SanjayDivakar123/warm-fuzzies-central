-- Add job_description column to company_users for user profile pages
ALTER TABLE company_users ADD COLUMN IF NOT EXISTS job_description TEXT;

-- Add index for better text search on job_description
CREATE INDEX IF NOT EXISTS idx_company_users_job_description ON company_users USING gin(to_tsvector('english', COALESCE(job_description, '')));
