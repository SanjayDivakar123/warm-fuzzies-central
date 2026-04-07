-- Run Merge ATS auto-sync every 15 minutes
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM cron.job
    WHERE jobname = 'run-merge-auto-sync-every-15-minutes'
  ) THEN
    PERFORM cron.unschedule('run-merge-auto-sync-every-15-minutes');
  END IF;
END
$$;

SELECT cron.schedule(
  'run-merge-auto-sync-every-15-minutes',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://qbuxoetprodjxpagfkoi.supabase.co/functions/v1/run-merge-auto-sync',
    headers := jsonb_build_object(
      'content-type', 'application/json',
      'x-merge-auto-sync-key', '63d69c90a398f564a42009e22b8d7bbab128d8b8f4ce8f25b32a33bf7a1760f6'
    ),
    body := '{}'::jsonb
  );
  $$
);
