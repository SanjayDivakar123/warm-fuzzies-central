-- Add notification preference for task completion emails
ALTER TABLE public.company_users
ADD COLUMN notify_task_completion boolean DEFAULT true;