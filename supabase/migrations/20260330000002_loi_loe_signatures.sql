-- Add separate LOI and LOE signature columns to proposal_acceptances

ALTER TABLE public.proposal_acceptances
  ADD COLUMN IF NOT EXISTS loi_signed_name text,
  ADD COLUMN IF NOT EXISTS loi_signed_at   timestamptz,
  ADD COLUMN IF NOT EXISTS loe_signed_name text,
  ADD COLUMN IF NOT EXISTS loe_signed_at   timestamptz;

-- Drop old constraint and add updated one that includes the two new step statuses
ALTER TABLE public.proposal_acceptances
  DROP CONSTRAINT IF EXISTS proposal_acceptances_status_check;

ALTER TABLE public.proposal_acceptances
  ADD CONSTRAINT proposal_acceptances_status_check
  CHECK (status IN (
    'loi_pending',
    'loe_pending',
    'agreement_pending',   -- kept for backwards compat
    'payment_pending',
    'contact_pending',
    'completed'
  ));

-- New records start at loi_pending
ALTER TABLE public.proposal_acceptances
  ALTER COLUMN status SET DEFAULT 'loi_pending';
