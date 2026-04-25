-- Add department management for company roles
CREATE TABLE IF NOT EXISTS public.company_departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS company_departments_company_id_name_lower_uniq
  ON public.company_departments (company_id, lower(name));

CREATE INDEX IF NOT EXISTS idx_company_departments_company_id
  ON public.company_departments (company_id);

ALTER TABLE public.company_departments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view departments in their company" ON public.company_departments
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM public.company_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage departments in their company" ON public.company_departments
  FOR ALL USING (
    company_id IN (
      SELECT company_id FROM public.company_users
      WHERE user_id = auth.uid() AND role IN ('admin', 'hr')
    )
  );

CREATE OR REPLACE FUNCTION public.update_company_departments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_company_departments_timestamp ON public.company_departments;
CREATE TRIGGER update_company_departments_timestamp
  BEFORE UPDATE ON public.company_departments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_company_departments_updated_at();

ALTER TABLE public.company_roles
  ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.company_departments(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_company_roles_department_id
  ON public.company_roles(department_id);
