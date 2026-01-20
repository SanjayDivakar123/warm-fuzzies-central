-- Create scheduled reminders table
CREATE TABLE public.scheduled_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  company_user_id UUID NOT NULL REFERENCES public.company_users(id) ON DELETE CASCADE,
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  sent_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT unique_pending_reminder UNIQUE (company_user_id, scheduled_for)
);

-- Enable RLS
ALTER TABLE public.scheduled_reminders ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Company admins can view reminders for their company"
ON public.scheduled_reminders
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.company_users cu
    WHERE cu.company_id = scheduled_reminders.company_id
    AND cu.user_id = auth.uid()
    AND cu.role = 'admin'
    AND cu.status = 'active'
  )
);

CREATE POLICY "Company admins can create reminders for their company"
ON public.scheduled_reminders
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.company_users cu
    WHERE cu.company_id = scheduled_reminders.company_id
    AND cu.user_id = auth.uid()
    AND cu.role = 'admin'
    AND cu.status = 'active'
  )
);

CREATE POLICY "Company admins can update reminders for their company"
ON public.scheduled_reminders
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.company_users cu
    WHERE cu.company_id = scheduled_reminders.company_id
    AND cu.user_id = auth.uid()
    AND cu.role = 'admin'
    AND cu.status = 'active'
  )
);

CREATE POLICY "Company admins can delete reminders for their company"
ON public.scheduled_reminders
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.company_users cu
    WHERE cu.company_id = scheduled_reminders.company_id
    AND cu.user_id = auth.uid()
    AND cu.role = 'admin'
    AND cu.status = 'active'
  )
);

-- Create index for efficient querying
CREATE INDEX idx_scheduled_reminders_pending ON public.scheduled_reminders(scheduled_for) WHERE status = 'pending';
CREATE INDEX idx_scheduled_reminders_company ON public.scheduled_reminders(company_id);