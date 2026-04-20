-- Cleanup duplicate unstarted purchase placeholders for a single account.
-- Scope: tristanbeley@gmail.com only.
-- Safe behavior: keep the newest unstarted placeholder per assessment_type, delete older duplicates.

WITH target_user AS (
  SELECT id
  FROM auth.users
  WHERE lower(email) = 'tristanbeley@gmail.com'
  LIMIT 1
), placeholder_rows AS (
  SELECT
    ar.id,
    ar.assessment_type,
    ar.created_at,
    ROW_NUMBER() OVER (
      PARTITION BY ar.assessment_type
      ORDER BY ar.created_at DESC, ar.id DESC
    ) AS row_num
  FROM public.assessment_results ar
  JOIN target_user tu ON tu.id = ar.user_id
  WHERE ar.results ->> 'status' = 'payment_completed'
    AND COALESCE(ar.results ->> 'assessment_started', 'false') <> 'true'
), rows_to_delete AS (
  SELECT id
  FROM placeholder_rows
  WHERE row_num > 1
)
DELETE FROM public.assessment_results ar
USING rows_to_delete d
WHERE ar.id = d.id;
