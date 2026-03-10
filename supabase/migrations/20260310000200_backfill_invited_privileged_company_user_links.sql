-- Backfill invited privileged company users that already have matching auth users.

UPDATE public.company_users AS cu
SET
  email = lower(trim(cu.email)),
  user_id = (
    SELECT au.id
    FROM auth.users AS au
    WHERE lower(au.email) = lower(trim(cu.email))
    ORDER BY au.created_at ASC
    LIMIT 1
  )
WHERE cu.user_id IS NULL
  AND cu.role IN ('admin', 'hr', 'partner')
  AND cu.status = 'invited'
  AND cu.email IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM auth.users AS au
    WHERE lower(au.email) = lower(trim(cu.email))
  );
