-- Create enum for task priority
CREATE TYPE public.task_priority AS ENUM ('high', 'medium', 'low');

-- Create enum for task status
CREATE TYPE public.task_status AS ENUM ('pending', 'assigned', 'in_progress', 'completed', 'cancelled');

-- Create enum for covey quadrant
CREATE TYPE public.covey_quadrant AS ENUM ('q1', 'q2', 'q3', 'q4');

-- Create work_tasks table
CREATE TABLE public.work_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  importance task_priority NOT NULL DEFAULT 'medium',
  urgency task_priority NOT NULL DEFAULT 'medium',
  quadrant covey_quadrant NOT NULL DEFAULT 'q4',
  due_date TIMESTAMP WITH TIME ZONE,
  department TEXT,
  required_skills TEXT[] DEFAULT '{}',
  status task_status NOT NULL DEFAULT 'pending',
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create task_assignments table
CREATE TABLE public.task_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.work_tasks(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  primary_assignee_id UUID REFERENCES public.company_users(id),
  secondary_assignee_id UUID REFERENCES public.company_users(id),
  reasoning JSONB NOT NULL DEFAULT '{}',
  ai_score DECIMAL(5,2),
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID,
  outcome_status TEXT,
  outcome_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.work_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_assignments ENABLE ROW LEVEL SECURITY;

-- RLS policies for work_tasks
CREATE POLICY "Company admins can manage tasks"
ON public.work_tasks
FOR ALL
USING (is_company_admin_for_company(auth.uid(), company_id));

-- RLS policies for task_assignments
CREATE POLICY "Company admins can manage assignments"
ON public.task_assignments
FOR ALL
USING (is_company_admin_for_company(auth.uid(), company_id));

-- Create trigger for updated_at on work_tasks
CREATE TRIGGER update_work_tasks_updated_at
BEFORE UPDATE ON public.work_tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for updated_at on task_assignments
CREATE TRIGGER update_task_assignments_updated_at
BEFORE UPDATE ON public.task_assignments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();