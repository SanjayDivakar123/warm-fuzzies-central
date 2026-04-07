CREATE TABLE IF NOT EXISTS public.slack_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  team_id TEXT NOT NULL,
  team_name TEXT NOT NULL,
  bot_token TEXT NOT NULL,
  authed_user_id TEXT,
  incoming_webhook_url TEXT,
  incoming_webhook_channel TEXT,
  connected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT slack_connections_org_team_key UNIQUE (org_id, team_id)
);

CREATE TABLE IF NOT EXISTS public.slack_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  function_name TEXT NOT NULL,
  error_message TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.slack_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  user_id TEXT NOT NULL,
  action_id TEXT NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS slack_connections_active_org_idx
  ON public.slack_connections(org_id)
  WHERE is_active = true;

CREATE UNIQUE INDEX IF NOT EXISTS slack_connections_active_team_idx
  ON public.slack_connections(team_id)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS slack_errors_org_occurred_idx
  ON public.slack_errors(org_id, occurred_at DESC);

CREATE INDEX IF NOT EXISTS slack_interactions_org_occurred_idx
  ON public.slack_interactions(org_id, occurred_at DESC);

ALTER TABLE public.slack_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slack_errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slack_interactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can manage slack connections" ON public.slack_connections;
CREATE POLICY "Service role can manage slack connections"
ON public.slack_connections
FOR ALL
USING ((auth.jwt() ->> 'role') = 'service_role')
WITH CHECK ((auth.jwt() ->> 'role') = 'service_role');

DROP POLICY IF EXISTS "Service role can manage slack errors" ON public.slack_errors;
CREATE POLICY "Service role can manage slack errors"
ON public.slack_errors
FOR ALL
USING ((auth.jwt() ->> 'role') = 'service_role')
WITH CHECK ((auth.jwt() ->> 'role') = 'service_role');

DROP POLICY IF EXISTS "Service role can manage slack interactions" ON public.slack_interactions;
CREATE POLICY "Service role can manage slack interactions"
ON public.slack_interactions
FOR ALL
USING ((auth.jwt() ->> 'role') = 'service_role')
WITH CHECK ((auth.jwt() ->> 'role') = 'service_role');

DROP VIEW IF EXISTS public.slack_connection_statuses;
CREATE VIEW public.slack_connection_statuses
WITH (security_invoker = true) AS
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
  sc.updated_at
FROM public.slack_connections sc
WHERE EXISTS (
  SELECT 1
  FROM public.company_users cu
  WHERE cu.company_id = sc.org_id
    AND cu.user_id = auth.uid()
    AND cu.status = 'active'
    AND cu.role IN ('admin', 'hr')
);

CREATE OR REPLACE FUNCTION public.disconnect_slack_connection(p_org_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  can_manage BOOLEAN := false;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM public.company_users cu
    WHERE cu.company_id = p_org_id
      AND cu.user_id = auth.uid()
      AND cu.status = 'active'
      AND cu.role IN ('admin', 'hr')
  )
  INTO can_manage;

  IF NOT can_manage THEN
    RAISE EXCEPTION 'Not authorized to disconnect Slack for this company';
  END IF;

  UPDATE public.slack_connections
  SET
    is_active = false,
    updated_at = now()
  WHERE org_id = p_org_id
    AND is_active = true;

  UPDATE public.companies
  SET slack_notifications_enabled = false
  WHERE id = p_org_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

REVOKE ALL ON TABLE public.slack_connections FROM anon, authenticated;
REVOKE ALL ON TABLE public.slack_errors FROM anon, authenticated;
REVOKE ALL ON TABLE public.slack_interactions FROM anon, authenticated;

GRANT SELECT ON public.slack_connection_statuses TO authenticated;
GRANT EXECUTE ON FUNCTION public.disconnect_slack_connection(UUID) TO authenticated;

DROP TRIGGER IF EXISTS update_slack_connections_updated_at ON public.slack_connections;
CREATE TRIGGER update_slack_connections_updated_at
  BEFORE UPDATE ON public.slack_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
