-- Update is_company_admin_for_company function to include new admin roles
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
      AND role IN ('admin', 'hr', 'partner')
      AND status = 'active'
  )
$$;