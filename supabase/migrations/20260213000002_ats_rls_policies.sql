-- ATS Row Level Security Policies

-- ============================================
-- JOB POSTINGS RLS
-- ============================================

ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;

-- Users can view job postings in their company
CREATE POLICY "Users can view job postings in their company"
  ON public.job_postings FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM public.company_users WHERE user_id = auth.uid()
    )
  );

-- Admins, HR, and hiring team can manage job postings
CREATE POLICY "Admins and HR can manage job postings"
  ON public.job_postings FOR ALL
  USING (
    company_id IN (
      SELECT company_id FROM public.company_users 
      WHERE user_id = auth.uid() AND role IN ('admin', 'hr')
    )
  );

-- ============================================
-- HIRING PIPELINE STAGES RLS
-- ============================================

ALTER TABLE public.hiring_pipeline_stages ENABLE ROW LEVEL SECURITY;

-- Users can view stages for jobs in their company
CREATE POLICY "Users can view hiring stages in their company"
  ON public.hiring_pipeline_stages FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM public.company_users WHERE user_id = auth.uid()
    )
  );

-- Admins and HR can manage stages
CREATE POLICY "Admins and HR can manage hiring stages"
  ON public.hiring_pipeline_stages FOR ALL
  USING (
    company_id IN (
      SELECT company_id FROM public.company_users 
      WHERE user_id = auth.uid() AND role IN ('admin', 'hr')
    )
  );

-- ============================================
-- CANDIDATE APPLICATIONS RLS
-- ============================================

ALTER TABLE public.candidate_applications ENABLE ROW LEVEL SECURITY;

-- Users can view applications for jobs in their company
CREATE POLICY "Users can view applications in their company"
  ON public.candidate_applications FOR SELECT
  USING (
    job_posting_id IN (
      SELECT jp.id FROM public.job_postings jp
      JOIN public.company_users cu ON cu.company_id = jp.company_id
      WHERE cu.user_id = auth.uid()
    )
  );

-- Admins, HR, and hiring team can manage applications
CREATE POLICY "Admins and HR can manage applications"
  ON public.candidate_applications FOR ALL
  USING (
    job_posting_id IN (
      SELECT jp.id FROM public.job_postings jp
      JOIN public.company_users cu ON cu.company_id = jp.company_id
      WHERE cu.user_id = auth.uid() AND cu.role IN ('admin', 'hr')
    )
  );

-- Hiring team members can update applications
CREATE POLICY "Hiring team can update applications"
  ON public.candidate_applications FOR UPDATE
  USING (
    job_posting_id IN (
      SELECT job_posting_id FROM public.hiring_team_members htm
      JOIN public.company_users cu ON cu.id = htm.user_id
      WHERE cu.user_id = auth.uid()
    )
  );

-- ============================================
-- STAGE TRANSITIONS RLS
-- ============================================

ALTER TABLE public.stage_transitions ENABLE ROW LEVEL SECURITY;

-- Users can view transitions for applications in their company
CREATE POLICY "Users can view stage transitions in their company"
  ON public.stage_transitions FOR SELECT
  USING (
    application_id IN (
      SELECT ca.id FROM public.candidate_applications ca
      JOIN public.job_postings jp ON jp.id = ca.job_posting_id
      JOIN public.company_users cu ON cu.company_id = jp.company_id
      WHERE cu.user_id = auth.uid()
    )
  );

-- Admins, HR can insert transitions
CREATE POLICY "Admins and HR can create stage transitions"
  ON public.stage_transitions FOR INSERT
  WITH CHECK (
    application_id IN (
      SELECT ca.id FROM public.candidate_applications ca
      JOIN public.job_postings jp ON jp.id = ca.job_posting_id
      JOIN public.company_users cu ON cu.company_id = jp.company_id
      WHERE cu.user_id = auth.uid() AND cu.role IN ('admin', 'hr')
    )
  );

-- ============================================
-- INTERVIEWS RLS
-- ============================================

ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;

-- Users can view interviews they're involved in or in their company (HR/Admin)
CREATE POLICY "Users can view interviews in their company"
  ON public.interviews FOR SELECT
  USING (
    application_id IN (
      SELECT ca.id FROM public.candidate_applications ca
      JOIN public.job_postings jp ON jp.id = ca.job_posting_id
      JOIN public.company_users cu ON cu.company_id = jp.company_id
      WHERE cu.user_id = auth.uid()
    )
  );

-- Admins and HR can manage all interviews
CREATE POLICY "Admins and HR can manage interviews"
  ON public.interviews FOR ALL
  USING (
    application_id IN (
      SELECT ca.id FROM public.candidate_applications ca
      JOIN public.job_postings jp ON jp.id = ca.job_posting_id
      JOIN public.company_users cu ON cu.company_id = jp.company_id
      WHERE cu.user_id = auth.uid() AND cu.role IN ('admin', 'hr')
    )
  );

-- Interviewers can update their interviews (add feedback)
CREATE POLICY "Interviewers can update their interviews"
  ON public.interviews FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.company_users cu
      WHERE cu.user_id = auth.uid() AND cu.id = ANY(interviewer_ids)
    )
  );

-- ============================================
-- OFFERS RLS
-- ============================================

ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

-- Users can view offers in their company
CREATE POLICY "Users can view offers in their company"
  ON public.offers FOR SELECT
  USING (
    application_id IN (
      SELECT ca.id FROM public.candidate_applications ca
      JOIN public.job_postings jp ON jp.id = ca.job_posting_id
      JOIN public.company_users cu ON cu.company_id = jp.company_id
      WHERE cu.user_id = auth.uid()
    )
  );

-- Admins and HR can manage offers
CREATE POLICY "Admins and HR can manage offers"
  ON public.offers FOR ALL
  USING (
    application_id IN (
      SELECT ca.id FROM public.candidate_applications ca
      JOIN public.job_postings jp ON jp.id = ca.job_posting_id
      JOIN public.company_users cu ON cu.company_id = jp.company_id
      WHERE cu.user_id = auth.uid() AND cu.role IN ('admin', 'hr')
    )
  );

-- ============================================
-- EMAIL TEMPLATES RLS
-- ============================================

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- Users can view templates in their company
CREATE POLICY "Users can view email templates in their company"
  ON public.email_templates FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM public.company_users WHERE user_id = auth.uid()
    )
  );

-- Admins and HR can manage templates
CREATE POLICY "Admins and HR can manage email templates"
  ON public.email_templates FOR ALL
  USING (
    company_id IN (
      SELECT company_id FROM public.company_users 
      WHERE user_id = auth.uid() AND role IN ('admin', 'hr')
    )
  );

-- ============================================
-- HIRING TEAM MEMBERS RLS
-- ============================================

ALTER TABLE public.hiring_team_members ENABLE ROW LEVEL SECURITY;

-- Users can view hiring team for jobs in their company
CREATE POLICY "Users can view hiring team in their company"
  ON public.hiring_team_members FOR SELECT
  USING (
    job_posting_id IN (
      SELECT jp.id FROM public.job_postings jp
      JOIN public.company_users cu ON cu.company_id = jp.company_id
      WHERE cu.user_id = auth.uid()
    )
  );

-- Admins and HR can manage hiring team
CREATE POLICY "Admins and HR can manage hiring team"
  ON public.hiring_team_members FOR ALL
  USING (
    job_posting_id IN (
      SELECT jp.id FROM public.job_postings jp
      JOIN public.company_users cu ON cu.company_id = jp.company_id
      WHERE cu.user_id = auth.uid() AND cu.role IN ('admin', 'hr')
    )
  );
