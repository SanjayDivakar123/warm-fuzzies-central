-- Create company_roles table for managing job roles within a company
CREATE TABLE IF NOT EXISTS public.company_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  skills TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add unique constraint for role name within a company
ALTER TABLE public.company_roles ADD CONSTRAINT company_roles_company_name_unique UNIQUE (company_id, name);

-- Enable RLS
ALTER TABLE public.company_roles ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view roles in their company" ON public.company_roles
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM public.company_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage roles in their company" ON public.company_roles
  FOR ALL USING (
    company_id IN (
      SELECT company_id FROM public.company_users 
      WHERE user_id = auth.uid() AND role IN ('admin', 'hr')
    )
  );

-- Add index for faster lookups
CREATE INDEX idx_company_roles_company_id ON public.company_roles(company_id);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_company_roles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_company_roles_timestamp
  BEFORE UPDATE ON public.company_roles
  FOR EACH ROW
  EXECUTE FUNCTION update_company_roles_updated_at();
