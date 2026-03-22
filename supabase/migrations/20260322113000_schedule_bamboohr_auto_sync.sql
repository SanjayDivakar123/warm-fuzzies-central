-- Schedule BambooHR auto-sync runner every minute
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Replace prior job if this migration is reapplied
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM cron.job
    WHERE jobname = 'run-bamboohr-auto-sync-every-minute'
  ) THEN
    PERFORM cron.unschedule('run-bamboohr-auto-sync-every-minute');
  END IF;
END
$$;

SELECT cron.schedule(
  'run-bamboohr-auto-sync-every-minute',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://qbuxoetprodjxpagfkoi.supabase.co/functions/v1/run-bamboohr-auto-sync',
    headers := jsonb_build_object(
      'content-type', 'application/json',
      'x-bamboo-auto-sync-key', '54b4b43eec0558e6d7320defcf3dcf3db7c7d2ce51d76c2e94fc68ec1ca3286a'
    ),
    body := '{}'::jsonb
  );
  $$
);
