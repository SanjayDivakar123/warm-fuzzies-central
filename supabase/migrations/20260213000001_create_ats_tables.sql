-- ATS (Applicant Tracking System) Database Schema
-- Creates all tables needed for full hiring workflow

-- ============================================
-- ENUMS
-- ============================================

-- Job posting status
CREATE TYPE job_posting_status AS ENUM (
  'draft',
  'open',
  'paused', 
  'closed',
  'filled'
);

-- Pipeline stage types
CREATE TYPE hiring_stage_type AS ENUM (
  'applied',
  'screening',
  'phone_interview',
  'technical_interview',
  'onsite_interview',
  'reference_check',
  'offer',
  'hired',
  'rejected'
);

-- Interview status
CREATE TYPE interview_status AS ENUM (
  'scheduled',
  'completed',
  'cancelled',
  'no_show'
);

-- Interview type
CREATE TYPE interview_type AS ENUM (
  'phone',
  'video',
  'onsite',
  'panel',
  'technical',
  'behavioral'
);

-- Offer status
CREATE TYPE offer_status AS ENUM (
  'draft',
  'sent',
  'accepted',
  'declined',
  'expired',
  'rescinded'
);

-- Email template types
CREATE TYPE email_template_type AS ENUM (
  'candidate_invite',
  'interview_scheduled',
  'interview_reminder',
  'rejection',
  'offer_letter',
  'offer_accepted',
  'welcome'
);

-- Employment type
CREATE TYPE employment_type AS ENUM (
  'full_time',
  'part_time',
  'contract',
  'temporary',
  'internship'
);

-- Remote policy
CREATE TYPE remote_policy AS ENUM (
  'onsite',
  'remote',
  'hybrid'
);

-- ============================================
-- JOB POSTINGS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.job_postings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  
  -- Basic info
  title TEXT NOT NULL,
  description TEXT,
  department TEXT,
  
  -- Team
  hiring_manager_id UUID REFERENCES public.company_users(id) ON DELETE SET NULL,
  recruiter_id UUID REFERENCES public.company_users(id) ON DELETE SET NULL,
  
  -- Status
  status job_posting_status NOT NULL DEFAULT 'draft',
  
  -- Compensation
  salary_min INTEGER,
  salary_max INTEGER,
  salary_currency TEXT DEFAULT 'USD',
  
  -- Location & type
  location TEXT,
  remote_policy remote_policy DEFAULT 'onsite',
  employment_type employment_type DEFAULT 'full_time',
  
  -- Requirements
  required_experience_years INTEGER,
  required_skills TEXT[] DEFAULT '{}',
  preferred_skills TEXT[] DEFAULT '{}',
  
  -- RoleColor matching
  ideal_role_color_primary TEXT,
  ideal_role_color_secondary TEXT,
  
  -- Linked company role (for auto-fill)
  company_role_id UUID REFERENCES public.company_roles(id) ON DELETE SET NULL,
  
  -- Counts (denormalized for performance)
  applications_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  published_at TIMESTAMPTZ,
  closes_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_job_postings_company_id ON public.job_postings(company_id);
CREATE INDEX idx_job_postings_status ON public.job_postings(status);
CREATE INDEX idx_job_postings_created_at ON public.job_postings(created_at DESC);

-- ============================================
-- HIRING PIPELINE STAGES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.hiring_pipeline_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_posting_id UUID NOT NULL REFERENCES public.job_postings(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  
  -- Stage info
  name TEXT NOT NULL,
  description TEXT,
  stage_order INTEGER NOT NULL DEFAULT 0,
  stage_type hiring_stage_type NOT NULL DEFAULT 'screening',
  
  -- Config
  is_rejection_stage BOOLEAN DEFAULT false,
  is_final_stage BOOLEAN DEFAULT false,
  color_code TEXT DEFAULT '#6B7280',
  
  -- Auto-actions
  auto_send_email_template_id UUID,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Unique ordering per job
  UNIQUE (job_posting_id, stage_order)
);

-- Indexes
CREATE INDEX idx_hiring_stages_job_posting ON public.hiring_pipeline_stages(job_posting_id);
CREATE INDEX idx_hiring_stages_order ON public.hiring_pipeline_stages(job_posting_id, stage_order);

-- ============================================
-- CANDIDATE APPLICATIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.candidate_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  job_posting_id UUID NOT NULL REFERENCES public.job_postings(id) ON DELETE CASCADE,
  
  -- Current position in pipeline
  current_stage_id UUID REFERENCES public.hiring_pipeline_stages(id) ON DELETE SET NULL,
  
  -- Timestamps
  applied_at TIMESTAMPTZ DEFAULT now(),
  stage_entered_at TIMESTAMPTZ DEFAULT now(),
  
  -- Source tracking
  source TEXT, -- 'direct', 'referral', 'linkedin', 'indeed', etc.
  referrer_id UUID REFERENCES public.company_users(id) ON DELETE SET NULL,
  application_link_id UUID REFERENCES public.candidate_application_links(id) ON DELETE SET NULL,
  
  -- Outcome
  rejection_reason TEXT,
  rejected_at TIMESTAMPTZ,
  withdrawn_at TIMESTAMPTZ,
  hired_at TIMESTAMPTZ,
  
  -- Notes
  internal_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- One application per candidate per job
  UNIQUE (candidate_id, job_posting_id)
);

-- Indexes
CREATE INDEX idx_applications_candidate ON public.candidate_applications(candidate_id);
CREATE INDEX idx_applications_job ON public.candidate_applications(job_posting_id);
CREATE INDEX idx_applications_stage ON public.candidate_applications(current_stage_id);
CREATE INDEX idx_applications_applied_at ON public.candidate_applications(applied_at DESC);

-- ============================================
-- STAGE TRANSITIONS TABLE (Audit Log)
-- ============================================

CREATE TABLE IF NOT EXISTS public.stage_transitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.candidate_applications(id) ON DELETE CASCADE,
  
  -- Movement
  from_stage_id UUID REFERENCES public.hiring_pipeline_stages(id) ON DELETE SET NULL,
  to_stage_id UUID REFERENCES public.hiring_pipeline_stages(id) ON DELETE SET NULL,
  
  -- Actor
  moved_by UUID REFERENCES public.company_users(id) ON DELETE SET NULL,
  
  -- Details
  notes TEXT,
  auto_transitioned BOOLEAN DEFAULT false,
  
  -- Timestamp
  moved_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_transitions_application ON public.stage_transitions(application_id);
CREATE INDEX idx_transitions_moved_at ON public.stage_transitions(moved_at DESC);

-- ============================================
-- INTERVIEWS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.candidate_applications(id) ON DELETE CASCADE,
  stage_id UUID REFERENCES public.hiring_pipeline_stages(id) ON DELETE SET NULL,
  
  -- Scheduling
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  timezone TEXT DEFAULT 'UTC',
  
  -- Type & location
  interview_type interview_type NOT NULL DEFAULT 'video',
  location TEXT,
  meeting_link TEXT,
  
  -- Interviewers
  interviewer_ids UUID[] DEFAULT '{}',
  organizer_id UUID REFERENCES public.company_users(id) ON DELETE SET NULL,
  
  -- Status
  status interview_status NOT NULL DEFAULT 'scheduled',
  
  -- Feedback (after completion)
  feedback JSONB, -- Structured feedback per interviewer
  overall_score INTEGER CHECK (overall_score >= 1 AND overall_score <= 5),
  recommendation TEXT, -- 'strong_hire', 'hire', 'no_hire', 'strong_no_hire'
  
  -- Candidate prep
  instructions_for_candidate TEXT,
  
  -- Notifications
  reminder_sent_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_interviews_application ON public.interviews(application_id);
CREATE INDEX idx_interviews_scheduled ON public.interviews(scheduled_at);
CREATE INDEX idx_interviews_status ON public.interviews(status);
CREATE INDEX idx_interviews_interviewers ON public.interviews USING GIN (interviewer_ids);

-- ============================================
-- OFFERS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.candidate_applications(id) ON DELETE CASCADE,
  
  -- Compensation
  salary INTEGER NOT NULL,
  salary_currency TEXT DEFAULT 'USD',
  bonus INTEGER,
  equity TEXT,
  
  -- Details
  job_title TEXT,
  start_date DATE,
  
  -- Status & timing
  status offer_status NOT NULL DEFAULT 'draft',
  expires_at TIMESTAMPTZ,
  
  -- Documents
  document_url TEXT,
  
  -- Tracking
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  signed_at TIMESTAMPTZ,
  
  -- Response
  decline_reason TEXT,
  
  -- Notes
  internal_notes TEXT,
  candidate_notes TEXT,
  
  -- Creator
  created_by UUID REFERENCES public.company_users(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_offers_application ON public.offers(application_id);
CREATE INDEX idx_offers_status ON public.offers(status);

-- ============================================
-- EMAIL TEMPLATES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  
  -- Template info
  template_type email_template_type NOT NULL,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT,
  
  -- Variables available
  available_variables TEXT[] DEFAULT '{}',
  
  -- Status
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- One default per type per company
  UNIQUE (company_id, template_type, is_default) 
);

-- Indexes
CREATE INDEX idx_email_templates_company ON public.email_templates(company_id);
CREATE INDEX idx_email_templates_type ON public.email_templates(template_type);

-- ============================================
-- HIRING TEAM MEMBERS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.hiring_team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_posting_id UUID NOT NULL REFERENCES public.job_postings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.company_users(id) ON DELETE CASCADE,
  
  -- Role on hiring team
  team_role TEXT NOT NULL DEFAULT 'interviewer', -- 'hiring_manager', 'recruiter', 'interviewer'
  
  -- Timestamps
  added_at TIMESTAMPTZ DEFAULT now(),
  added_by UUID REFERENCES public.company_users(id) ON DELETE SET NULL,
  
  -- One role per user per job
  UNIQUE (job_posting_id, user_id)
);

-- Indexes
CREATE INDEX idx_hiring_team_job ON public.hiring_team_members(job_posting_id);
CREATE INDEX idx_hiring_team_user ON public.hiring_team_members(user_id);

-- ============================================
-- UPDATE CANDIDATES TABLE
-- ============================================

-- Add job_posting_id to candidates for direct linking
ALTER TABLE public.candidates 
  ADD COLUMN IF NOT EXISTS job_posting_id UUID REFERENCES public.job_postings(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_candidates_job_posting ON public.candidates(job_posting_id);

-- ============================================
-- UPDATE TRIGGERS
-- ============================================

-- Job postings updated_at trigger
CREATE OR REPLACE FUNCTION update_job_postings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_job_postings_timestamp
  BEFORE UPDATE ON public.job_postings
  FOR EACH ROW
  EXECUTE FUNCTION update_job_postings_updated_at();

-- Hiring stages updated_at trigger
CREATE OR REPLACE FUNCTION update_hiring_stages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_hiring_stages_timestamp
  BEFORE UPDATE ON public.hiring_pipeline_stages
  FOR EACH ROW
  EXECUTE FUNCTION update_hiring_stages_updated_at();

-- Applications updated_at trigger
CREATE OR REPLACE FUNCTION update_applications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_applications_timestamp
  BEFORE UPDATE ON public.candidate_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_applications_updated_at();

-- Interviews updated_at trigger
CREATE OR REPLACE FUNCTION update_interviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_interviews_timestamp
  BEFORE UPDATE ON public.interviews
  FOR EACH ROW
  EXECUTE FUNCTION update_interviews_updated_at();

-- Offers updated_at trigger
CREATE OR REPLACE FUNCTION update_offers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_offers_timestamp
  BEFORE UPDATE ON public.offers
  FOR EACH ROW
  EXECUTE FUNCTION update_offers_updated_at();

-- Email templates updated_at trigger
CREATE OR REPLACE FUNCTION update_email_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_email_templates_timestamp
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_email_templates_updated_at();

-- ============================================
-- APPLICATION COUNT TRIGGER
-- ============================================

-- Update job posting application count on application insert/delete
CREATE OR REPLACE FUNCTION update_job_applications_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.job_postings 
    SET applications_count = applications_count + 1 
    WHERE id = NEW.job_posting_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.job_postings 
    SET applications_count = GREATEST(0, applications_count - 1) 
    WHERE id = OLD.job_posting_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER manage_job_applications_count
  AFTER INSERT OR DELETE ON public.candidate_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_job_applications_count();
