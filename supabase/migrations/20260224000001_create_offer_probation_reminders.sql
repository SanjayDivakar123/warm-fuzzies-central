-- Reminder queue for probation period follow-ups on offers.
CREATE TABLE public.offer_probation_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  admin_company_user_id UUID NOT NULL REFERENCES public.company_users(id) ON DELETE CASCADE,
  probation_period TEXT NOT NULL,
  reminder_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  sent_at TIMESTAMPTZ,
  failure_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (offer_id)
);

ALTER TABLE public.offer_probation_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and HR can view probation reminders in company"
ON public.offer_probation_reminders
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.company_users cu
    WHERE cu.company_id = offer_probation_reminders.company_id
      AND cu.user_id = auth.uid()
      AND cu.role IN ('admin', 'hr')
      AND cu.status = 'active'
  )
);

CREATE POLICY "Admins and HR can insert probation reminders in company"
ON public.offer_probation_reminders
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.company_users cu
    WHERE cu.company_id = offer_probation_reminders.company_id
      AND cu.user_id = auth.uid()
      AND cu.role IN ('admin', 'hr')
      AND cu.status = 'active'
  )
);

CREATE POLICY "Admins and HR can update probation reminders in company"
ON public.offer_probation_reminders
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.company_users cu
    WHERE cu.company_id = offer_probation_reminders.company_id
      AND cu.user_id = auth.uid()
      AND cu.role IN ('admin', 'hr')
      AND cu.status = 'active'
  )
);

CREATE INDEX idx_offer_probation_reminders_due
ON public.offer_probation_reminders(reminder_at)
WHERE status = 'pending';

