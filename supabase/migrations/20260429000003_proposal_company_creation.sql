-- Support creating B2B companies from paid proposal acceptances.

ALTER TABLE public.proposal_acceptances
  ADD COLUMN IF NOT EXISTS stripe_customer_id text,
  ADD COLUMN IF NOT EXISTS linked_company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS company_created_at timestamptz;

CREATE INDEX IF NOT EXISTS proposal_acceptances_linked_company_id_idx
  ON public.proposal_acceptances(linked_company_id);

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS portal_core_monthly_dollars numeric,
  ADD COLUMN IF NOT EXISTS portal_hiring_monthly_dollars numeric,
  ADD COLUMN IF NOT EXISTS portal_included_active_job_roles integer,
  ADD COLUMN IF NOT EXISTS portal_applicants_per_role integer,
  ADD COLUMN IF NOT EXISTS portal_active_role_scale_block_size integer,
  ADD COLUMN IF NOT EXISTS portal_active_role_scale_block_monthly_dollars numeric,
  ADD COLUMN IF NOT EXISTS portal_outcome_price_per_hire_dollars numeric;
