CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;

ALTER TABLE public.slack_connections
  ADD COLUMN IF NOT EXISTS auto_add_users BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_mismatch_action TEXT NOT NULL DEFAULT 'confirm',
  ADD COLUMN IF NOT EXISTS name_matching_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS admin_notify_on_new_user BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS admin_notify_channel TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'slack_connections_email_mismatch_action_check'
      AND conrelid = 'public.slack_connections'::regclass
  ) THEN
    ALTER TABLE public.slack_connections
      ADD CONSTRAINT slack_connections_email_mismatch_action_check
      CHECK (email_mismatch_action IN ('confirm', 'ignore', 'auto_create'));
  END IF;
END
$$;

ALTER TABLE public.company_users
  ADD COLUMN IF NOT EXISTS slack_user_id TEXT,
  ADD COLUMN IF NOT EXISTS slack_linked_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS company_users_company_slack_user_idx
  ON public.company_users(company_id, slack_user_id)
  WHERE slack_user_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.slack_pending_confirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  slack_user_id TEXT NOT NULL,
  slack_email TEXT,
  slack_display_name TEXT,
  slack_real_name TEXT,
  slack_title TEXT,
  slack_avatar_url TEXT,
  matched_rcf_user_id UUID REFERENCES public.company_users(id) ON DELETE SET NULL,
  matched_rcf_name TEXT,
  matched_rcf_role TEXT,
  matched_rcf_color TEXT,
  match_type TEXT,
  match_confidence INTEGER,
  confirmation_token UUID NOT NULL DEFAULT gen_random_uuid(),
  status TEXT NOT NULL DEFAULT 'pending',
  initiated_by TEXT NOT NULL DEFAULT 'system',
  dm_sent_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '48 hours'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'slack_pending_confirmations_match_type_check'
      AND conrelid = 'public.slack_pending_confirmations'::regclass
  ) THEN
    ALTER TABLE public.slack_pending_confirmations
      ADD CONSTRAINT slack_pending_confirmations_match_type_check
      CHECK (match_type IS NULL OR match_type IN ('exact_email', 'fuzzy_name', 'none'));
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'slack_pending_confirmations_status_check'
      AND conrelid = 'public.slack_pending_confirmations'::regclass
  ) THEN
    ALTER TABLE public.slack_pending_confirmations
      ADD CONSTRAINT slack_pending_confirmations_status_check
      CHECK (status IN ('pending', 'confirmed', 'rejected', 'expired', 'ignored', 'auto_created', 'admin_approved', 'admin_rejected'));
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'slack_pending_confirmations_initiated_by_check'
      AND conrelid = 'public.slack_pending_confirmations'::regclass
  ) THEN
    ALTER TABLE public.slack_pending_confirmations
      ADD CONSTRAINT slack_pending_confirmations_initiated_by_check
      CHECK (initiated_by IN ('system', 'admin'));
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'slack_pending_confirmations_match_confidence_check'
      AND conrelid = 'public.slack_pending_confirmations'::regclass
  ) THEN
    ALTER TABLE public.slack_pending_confirmations
      ADD CONSTRAINT slack_pending_confirmations_match_confidence_check
      CHECK (match_confidence IS NULL OR (match_confidence >= 0 AND match_confidence <= 100));
  END IF;
END
$$;

CREATE UNIQUE INDEX IF NOT EXISTS slack_pending_confirmations_confirmation_token_idx
  ON public.slack_pending_confirmations(confirmation_token);

CREATE INDEX IF NOT EXISTS slack_pending_confirmations_org_status_idx
  ON public.slack_pending_confirmations(org_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS slack_pending_confirmations_org_expires_idx
  ON public.slack_pending_confirmations(org_id, expires_at);

CREATE INDEX IF NOT EXISTS slack_pending_confirmations_slack_user_idx
  ON public.slack_pending_confirmations(org_id, slack_user_id);

CREATE TABLE IF NOT EXISTS public.slack_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  function_name TEXT NOT NULL,
  error_message TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.slack_errors
  ALTER COLUMN payload SET DEFAULT '{}'::jsonb;

ALTER TABLE public.slack_pending_confirmations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can manage slack pending confirmations" ON public.slack_pending_confirmations;
CREATE POLICY "Service role can manage slack pending confirmations"
ON public.slack_pending_confirmations
FOR ALL
USING ((auth.jwt() ->> 'role') = 'service_role')
WITH CHECK ((auth.jwt() ->> 'role') = 'service_role');

REVOKE ALL ON TABLE public.slack_pending_confirmations FROM anon, authenticated;

DROP TRIGGER IF EXISTS update_slack_pending_confirmations_updated_at ON public.slack_pending_confirmations;
CREATE TRIGGER update_slack_pending_confirmations_updated_at
  BEFORE UPDATE ON public.slack_pending_confirmations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP VIEW IF EXISTS public.slack_connection_statuses;

CREATE VIEW public.slack_connection_statuses AS
SELECT
  sc.id,
  sc.org_id,
  sc.team_id,
  sc.team_name,
  sc.authed_user_id,
  sc.incoming_webhook_channel,
  sc.connected_at,
  sc.is_active,
  sc.created_at,
  sc.updated_at,
  sc.auto_add_users,
  sc.email_mismatch_action,
  sc.name_matching_enabled,
  sc.admin_notify_on_new_user,
  sc.admin_notify_channel,
  COALESCE((
    SELECT COUNT(*)::INTEGER
    FROM public.slack_pending_confirmations spc
    WHERE spc.org_id = sc.org_id
      AND spc.status = 'pending'
      AND spc.expires_at > now()
  ), 0) AS pending_confirmations_count
FROM public.slack_connections sc
WHERE EXISTS (
  SELECT 1
  FROM public.company_users cu
  WHERE cu.company_id = sc.org_id
    AND cu.user_id = auth.uid()
    AND cu.status = 'active'
    AND cu.role IN ('admin', 'hr')
);

GRANT SELECT ON public.slack_connection_statuses TO authenticated;

CREATE OR REPLACE FUNCTION public.match_company_user_by_name(p_org_id UUID, p_name TEXT)
RETURNS TABLE (
  company_user_id UUID,
  full_name TEXT,
  job_role TEXT,
  rolecolor TEXT,
  match_confidence INTEGER
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH matched AS (
    SELECT
      cu.id AS company_user_id,
      cu.full_name,
      cu.job_role,
      ar.results,
      similarity(lower(COALESCE(cu.full_name, '')), lower(COALESCE(p_name, ''))) AS similarity_score
    FROM public.company_users cu
    LEFT JOIN public.assessment_results ar
      ON ar.id = cu.assessment_result_id
    WHERE cu.company_id = p_org_id
      AND cu.status IN ('active', 'invited')
      AND COALESCE(cu.full_name, '') <> ''
      AND similarity(lower(COALESCE(cu.full_name, '')), lower(COALESCE(p_name, ''))) > 0.8
    ORDER BY similarity_score DESC, cu.created_at ASC
    LIMIT 1
  )
  SELECT
    matched.company_user_id,
    matched.full_name,
    matched.job_role,
    COALESCE(
      NULLIF(lower(trim(COALESCE(matched.results ->> 'dominantColor', ''))), ''),
      NULLIF(lower(trim(COALESCE(matched.results ->> 'primaryColor', ''))), ''),
      NULLIF(lower(trim(COALESCE(matched.results ->> 'role_color', ''))), ''),
      NULLIF(lower(trim(COALESCE(matched.results ->> 'color', ''))), '')
    ) AS rolecolor,
    GREATEST(0, LEAST(100, round(matched.similarity_score * 100)::INTEGER)) AS match_confidence
  FROM matched;
$$;
