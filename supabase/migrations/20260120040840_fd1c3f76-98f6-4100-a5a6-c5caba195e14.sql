-- Add recurrence and delivery_status columns to scheduled_reminders
ALTER TABLE public.scheduled_reminders 
ADD COLUMN IF NOT EXISTS recurrence text NOT NULL DEFAULT 'once',
ADD COLUMN IF NOT EXISTS delivery_status text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS next_occurrence_at timestamp with time zone DEFAULT NULL;

-- Add a comment explaining the recurrence values
COMMENT ON COLUMN public.scheduled_reminders.recurrence IS 'once, daily, or weekly';
COMMENT ON COLUMN public.scheduled_reminders.delivery_status IS 'delivered, failed, or null if not yet sent';
COMMENT ON COLUMN public.scheduled_reminders.next_occurrence_at IS 'For recurring reminders, when the next one should be sent';