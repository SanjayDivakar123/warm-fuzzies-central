-- Harden B2B invite/account-claim and company user management policies.

CREATE OR REPLACE FUNCTION public.is_company_admin_role_for_company(_user_id uuid, _company_id uuid)
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

CREATE OR REPLACE FUNCTION public.is_company_hr_role_for_company(_user_id uuid, _company_id uuid)
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
      AND role = 'hr'
      AND status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_company_owner_admin_for_company(_user_id uuid, _company_id uuid, _user_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.company_users cu
    JOIN public.companies c ON c.id = cu.company_id
    WHERE cu.user_id = _user_id
      AND cu.company_id = _company_id
      AND cu.role = 'admin'
      AND cu.status = 'active'
      AND lower(c.admin_email) = lower(coalesce(_user_email, ''))
  );
$$;

CREATE OR REPLACE FUNCTION public.is_company_management_for_company(_user_id uuid, _company_id uuid)
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
  );
$$;

DROP POLICY IF EXISTS "Company admins can manage users in their company" ON public.company_users;
DROP POLICY IF EXISTS "Company admins can view all users in their company" ON public.company_users;
DROP POLICY IF EXISTS "Users can claim unclaimed admin records" ON public.company_users;
DROP POLICY IF EXISTS "Users can view own email-matched privileged invites" ON public.company_users;
DROP POLICY IF EXISTS "Users can claim own email-matched privileged invites" ON public.company_users;
DROP POLICY IF EXISTS "Users can activate own privileged invites" ON public.company_users;
DROP POLICY IF EXISTS "Company management can view users in their company" ON public.company_users;
DROP POLICY IF EXISTS "Admins can insert users in their company" ON public.company_users;
DROP POLICY IF EXISTS "Admins and HR can update manageable company users" ON public.company_users;
DROP POLICY IF EXISTS "Admins and HR can delete manageable company users" ON public.company_users;

CREATE POLICY "Company management can view users in their company"
ON public.company_users
FOR SELECT
USING (public.is_company_management_for_company(auth.uid(), company_id));

CREATE POLICY "Users can view own email-matched privileged invites"
ON public.company_users
FOR SELECT
TO authenticated
USING (
  user_id IS NULL
  AND role IN ('admin', 'hr', 'partner')
  AND status = 'invited'
  AND lower(email) = lower(auth.jwt() ->> 'email')
);

CREATE POLICY "Users can claim own email-matched privileged invites"
ON public.company_users
FOR UPDATE
TO authenticated
USING (
  user_id IS NULL
  AND role IN ('admin', 'hr', 'partner')
  AND status = 'invited'
  AND lower(email) = lower(auth.jwt() ->> 'email')
)
WITH CHECK (
  user_id = auth.uid()
  AND role IN ('admin', 'hr', 'partner')
  AND status = 'active'
  AND lower(email) = lower(auth.jwt() ->> 'email')
);

CREATE POLICY "Users can activate own privileged invites"
ON public.company_users
FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid()
  AND role IN ('admin', 'hr', 'partner')
  AND status = 'invited'
  AND lower(email) = lower(auth.jwt() ->> 'email')
)
WITH CHECK (
  user_id = auth.uid()
  AND role IN ('admin', 'hr', 'partner')
  AND status = 'active'
  AND lower(email) = lower(auth.jwt() ->> 'email')
);

CREATE POLICY "Admins can insert users in their company"
ON public.company_users
FOR INSERT
WITH CHECK (public.is_company_admin_role_for_company(auth.uid(), company_id));

CREATE POLICY "Admins and HR can update manageable company users"
ON public.company_users
FOR UPDATE
USING (
  (
    public.is_company_admin_role_for_company(auth.uid(), company_id)
    AND (
      role <> 'admin'
      OR public.is_company_owner_admin_for_company(auth.uid(), company_id, auth.jwt() ->> 'email')
    )
  )
  OR (
    public.is_company_hr_role_for_company(auth.uid(), company_id)
    AND role = 'employee'
  )
)
WITH CHECK (
  (
    public.is_company_admin_role_for_company(auth.uid(), company_id)
    AND (
      role <> 'admin'
      OR public.is_company_owner_admin_for_company(auth.uid(), company_id, auth.jwt() ->> 'email')
    )
  )
  OR (
    public.is_company_hr_role_for_company(auth.uid(), company_id)
    AND role = 'employee'
  )
);

CREATE POLICY "Admins and HR can delete manageable company users"
ON public.company_users
FOR DELETE
USING (
  (
    public.is_company_admin_role_for_company(auth.uid(), company_id)
    AND (
      role <> 'admin'
      OR public.is_company_owner_admin_for_company(auth.uid(), company_id, auth.jwt() ->> 'email')
    )
  )
  OR (
    public.is_company_hr_role_for_company(auth.uid(), company_id)
    AND role = 'employee'
  )
);
