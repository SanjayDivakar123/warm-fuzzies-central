-- Move proposal acceptance writes behind edge functions.

ALTER TABLE public.proposal_acceptances ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_insert_acceptance" ON public.proposal_acceptances;
DROP POLICY IF EXISTS "public_update_acceptance" ON public.proposal_acceptances;

-- Public proposal pages still need to know whether a proposal has already been paid,
-- and admins read acceptance records in the proposal manager.
DROP POLICY IF EXISTS "public_select_acceptance" ON public.proposal_acceptances;
CREATE POLICY "public_select_acceptance"
ON public.proposal_acceptances
FOR SELECT
USING (true);

REVOKE INSERT, UPDATE ON public.proposal_acceptances FROM anon, authenticated;
GRANT SELECT ON public.proposal_acceptances TO anon, authenticated;
