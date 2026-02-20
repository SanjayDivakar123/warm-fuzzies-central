-- Backfill and enforce user_id linkage for privileged company users (admin/hr/partner)

-- Helper to resolve auth user id by email
CREATE OR REPLACE FUNCTION public.resolve_auth_user_id_by_email(_email text)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT id
  FROM auth.users
  WHERE lower(email) = lower(trim(_email))
  ORDER BY created_at ASC
  LIMIT 1;
$$;

-- Backfill user_id for existing privileged users where possible
UPDATE public.company_users cu
SET user_id = public.resolve_auth_user_id_by_email(cu.email)
WHERE cu.user_id IS NULL
  AND cu.role IN ('admin', 'hr', 'partner')
  AND cu.email IS NOT NULL;

-- Enforce linkage on insert/update for privileged users
CREATE OR REPLACE FUNCTION public.enforce_privileged_company_user_link()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF NEW.email IS NOT NULL THEN
    NEW.email := lower(trim(NEW.email));
  END IF;

  IF NEW.user_id IS NULL
     AND NEW.email IS NOT NULL
     AND NEW.role IN ('admin', 'hr', 'partner') THEN
    NEW.user_id := public.resolve_auth_user_id_by_email(NEW.email);
  END IF;

  IF NEW.role IN ('admin', 'hr', 'partner')
     AND NEW.status = 'active'
     AND NEW.user_id IS NULL THEN
    RAISE EXCEPTION 'Active privileged company user must have user_id (email=%)', NEW.email
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_privileged_company_user_link ON public.company_users;

CREATE TRIGGER trg_enforce_privileged_company_user_link
BEFORE INSERT OR UPDATE OF email, role, status, user_id
ON public.company_users
FOR EACH ROW
EXECUTE FUNCTION public.enforce_privileged_company_user_link();
