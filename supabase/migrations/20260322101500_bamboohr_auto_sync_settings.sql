-- Add auto-sync settings for BambooHR integration
ALTER TABLE public.bamboohr_integrations
  ADD COLUMN IF NOT EXISTS auto_sync_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS auto_sync_interval_seconds INTEGER NOT NULL DEFAULT 3600,
  ADD COLUMN IF NOT EXISTS last_auto_sync_at TIMESTAMPTZ;

ALTER TABLE public.bamboohr_integrations
  DROP CONSTRAINT IF EXISTS bamboohr_integrations_auto_sync_interval_seconds_check;

ALTER TABLE public.bamboohr_integrations
  ADD CONSTRAINT bamboohr_integrations_auto_sync_interval_seconds_check
  CHECK (auto_sync_interval_seconds >= 6 AND auto_sync_interval_seconds <= 604800);
