-- Helper function to avoid RLS infinite recursion on company_users
CREATE OR REPLACE FUNCTION public.is_company_admin_for_company(_user_id uuid, _company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.company_users
    WHERE user_id = _user_id
      AND company_id = _company_id
      AND role = 'admin'
      AND status = 'active'
  );
$$;

-- Replace self-referential RLS policies with function-based ones
DROP POLICY IF EXISTS "Company admins can manage users in their company" ON public.company_users;
DROP POLICY IF EXISTS "Company admins can view all users in their company" ON public.company_users;

CREATE POLICY "Company admins can manage users in their company"
ON public.company_users
FOR ALL
USING (public.is_company_admin_for_company(auth.uid(), company_id));

CREATE POLICY "Company admins can view all users in their company"
ON public.company_users
FOR SELECT
USING (public.is_company_admin_for_company(auth.uid(), company_id));