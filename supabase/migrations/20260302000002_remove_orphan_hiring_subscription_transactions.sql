-- Remove hiring tab subscription billing_transactions for companies that never
-- successfully subscribed (no active/trialing hiring subscription).
-- These are orphaned records from failed/declined payment attempts with old code.
DELETE FROM public.billing_transactions
WHERE LOWER(description) LIKE '%hiring tab subscription%'
  AND company_id IN (
    SELECT id FROM public.companies
    WHERE hiring_subscription_enabled IS NOT TRUE
       OR hiring_subscription_status NOT IN ('active', 'trialing')
  );
