-- Remove duplicate hiring tab subscription billing_transactions.
-- For each company, keep only the single most recent hiring-tab subscription entry;
-- all earlier duplicates (created by failed-payment attempts with old code) are deleted.
DELETE FROM public.billing_transactions
WHERE id IN (
  SELECT id FROM (
    SELECT id,
      ROW_NUMBER() OVER (
        PARTITION BY company_id
        ORDER BY created_at DESC
      ) AS rn
    FROM public.billing_transactions
    WHERE LOWER(description) LIKE '%hiring tab subscription%'
  ) ranked
  WHERE rn > 1
);
