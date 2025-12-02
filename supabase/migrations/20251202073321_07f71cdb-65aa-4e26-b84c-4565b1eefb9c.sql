-- Create enum for company assessment types
CREATE TYPE company_assessment_type AS ENUM ('25q', '50q');

-- Create enum for company user roles
CREATE TYPE company_user_role AS ENUM ('admin', 'employee');

-- Create enum for company user status
CREATE TYPE company_user_status AS ENUM ('invited', 'active', 'revoked');

-- Companies table
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subdomain TEXT UNIQUE NOT NULL,
  admin_email TEXT NOT NULL,
  seats_purchased INTEGER NOT NULL DEFAULT 5,
  assessment_type company_assessment_type NOT NULL DEFAULT '25q',
  logo_url TEXT,
  primary_color TEXT DEFAULT '#9b87f5',
  secondary_color TEXT DEFAULT '#7E69AB',
  google_sso_enabled BOOLEAN DEFAULT FALSE,
  google_workspace_domain TEXT,
  custom_domain TEXT,
  custom_domain_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Company users table
CREATE TABLE company_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  role company_user_role NOT NULL DEFAULT 'employee',
  status company_user_status NOT NULL DEFAULT 'invited',
  invite_code TEXT UNIQUE,
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  joined_at TIMESTAMP WITH TIME ZONE,
  assessment_completed_at TIMESTAMP WITH TIME ZONE,
  assessment_result_id UUID REFERENCES assessment_results(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(company_id, email)
);

-- Enable RLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for companies
CREATE POLICY "Company admins can view their company"
  ON companies FOR SELECT
  USING (
    id IN (
      SELECT company_id FROM company_users 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Company admins can update their company"
  ON companies FOR UPDATE
  USING (
    id IN (
      SELECT company_id FROM company_users 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Service role can manage companies"
  ON companies FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- RLS Policies for company_users
CREATE POLICY "Company admins can view all users in their company"
  ON company_users FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM company_users 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can view their own company user record"
  ON company_users FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Company admins can manage users in their company"
  ON company_users FOR ALL
  USING (
    company_id IN (
      SELECT company_id FROM company_users 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Service role can manage company users"
  ON company_users FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Function to generate invite codes
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT AS $$
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
$$ LANGUAGE plpgsql;

-- Function to validate subdomain
CREATE OR REPLACE FUNCTION is_valid_subdomain(subdomain TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN subdomain ~ '^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$'
    AND subdomain NOT IN ('www', 'api', 'admin', 'app', 'dashboard', 'mail', 'ftp');
END;
$$ LANGUAGE plpgsql;

-- Indexes
CREATE INDEX idx_companies_subdomain ON companies(subdomain);
CREATE INDEX idx_company_users_company_id ON company_users(company_id);
CREATE INDEX idx_company_users_user_id ON company_users(user_id);
CREATE INDEX idx_company_users_invite_code ON company_users(invite_code);
CREATE INDEX idx_company_users_email ON company_users(email);

-- Trigger for updated_at
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_company_users_updated_at
  BEFORE UPDATE ON company_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();