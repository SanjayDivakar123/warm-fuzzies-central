-- Create table to track employee task status separately (for their kanban view)
-- This links to task_assignments and allows employees to track their own progress
ALTER TABLE task_assignments 
ADD COLUMN IF NOT EXISTS employee_status TEXT DEFAULT 'pending' CHECK (employee_status IN ('pending', 'in_progress', 'completed', 'blocked')),
ADD COLUMN IF NOT EXISTS employee_notes TEXT,
ADD COLUMN IF NOT EXISTS employee_completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS notification_sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS assigner_email TEXT;

-- Create index for faster employee queries
CREATE INDEX IF NOT EXISTS idx_task_assignments_primary_assignee ON task_assignments(primary_assignee_id);
CREATE INDEX IF NOT EXISTS idx_task_assignments_employee_status ON task_assignments(employee_status);