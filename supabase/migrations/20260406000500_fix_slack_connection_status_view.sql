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

GRANT SELECT ON public.slack_connection_statuses TO authenticated;
