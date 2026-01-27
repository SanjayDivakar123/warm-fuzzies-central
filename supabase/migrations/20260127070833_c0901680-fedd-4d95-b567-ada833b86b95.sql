-- Add per-assignment notification preference
ALTER TABLE public.task_assignments
ADD COLUMN notify_on_completion boolean DEFAULT true;