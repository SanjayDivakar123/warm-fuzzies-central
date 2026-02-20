-- Realign privileged company_users.user_id to auth.users.id for current email
-- Fixes cases where email changed but user_id remained bound to the previous auth account.

-- Backfill drifted privileged users: always set to auth id for the current email when available
UPDATE public.company_users cu
SET user_id = au.id
FROM auth.users au
WHERE cu.role IN ('admin', 'hr', 'partner')
  AND cu.email IS NOT NULL
  AND lower(cu.email) = lower(au.email)
  AND (cu.user_id IS DISTINCT FROM au.id);

-- Update enforcement trigger to always realign privileged records by email
CREATE OR REPLACE FUNCTION public.enforce_privileged_company_user_link()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  matched_auth_user_id uuid;
BEGIN
  IF NEW.email IS NOT NULL THEN
    NEW.email := lower(trim(NEW.email));
  END IF;

  IF NEW.role IN ('admin', 'hr', 'partner') AND NEW.email IS NOT NULL THEN
    SELECT id
      INTO matched_auth_user_id
    FROM auth.users
    WHERE lower(email) = lower(NEW.email)
    ORDER BY created_at ASC
    LIMIT 1;

    IF matched_auth_user_id IS NOT NULL THEN
      NEW.user_id := matched_auth_user_id;
    END IF;
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
