ALTER TABLE public.scheduled_reports
ADD COLUMN IF NOT EXISTS timezone text NOT NULL DEFAULT 'UTC';

COMMENT ON COLUMN public.scheduled_reports.timezone IS
'IANA timezone of the admin creating the report (e.g., America/New_York).';
