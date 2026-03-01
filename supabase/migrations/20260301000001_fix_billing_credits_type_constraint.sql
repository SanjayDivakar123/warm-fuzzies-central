-- Drop the old restrictive CHECK constraint on billing_credits.type
-- and replace it with one that includes all types used by edge functions.
ALTER TABLE public.billing_credits
  DROP CONSTRAINT IF EXISTS billing_credits_type_check;

ALTER TABLE public.billing_credits
  ADD CONSTRAINT billing_credits_type_check
  CHECK (type IN (
    'refund',
    'manual',
    'payment',
    'super_admin_free_credit',
    'super_admin_paid_credit',
    'super_admin_credit_removal',
    'user_removal_refund'
  ));
