-- Create enum for candidate status
CREATE TYPE public.candidate_status AS ENUM ('invited', 'applied', 'assessment_pending', 'assessment_completed', 'hired', 'archived', 'rejected');

-- Create candidates table
CREATE TABLE public.candidates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  position_title TEXT,
  ideal_role_color TEXT,
  required_skills TEXT[] DEFAULT '{}',
  notes TEXT,
  source TEXT DEFAULT 'invite', -- 'invite' or 'public_link'
  status candidate_status NOT NULL DEFAULT 'invited',
  invite_code TEXT DEFAULT generate_invite_code(),
  public_token TEXT UNIQUE,
  assessment_category TEXT,
  assessment_type TEXT,
  assessment_result_id UUID REFERENCES public.assessment_results(id),
  assessment_completed_at TIMESTAMP WITH TIME ZONE,
  fit_score NUMERIC,
  fit_analysis JSONB,
  fit_analyzed_at TIMESTAMP WITH TIME ZONE,
  converted_to_employee_id UUID REFERENCES public.company_users(id),
  archived_at TIMESTAMP WITH TIME ZONE,
  archived_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID,
  UNIQUE(company_id, email)
);

-- Enable RLS
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Company admins can manage their candidates"
ON public.candidates
FOR ALL
USING (is_company_admin_for_company(auth.uid(), company_id));

CREATE POLICY "Service role can manage candidates"
ON public.candidates
FOR ALL
USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- Create public application links table
CREATE TABLE public.candidate_application_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  position_title TEXT NOT NULL,
  ideal_role_color TEXT,
  required_skills TEXT[] DEFAULT '{}',
  assessment_category TEXT DEFAULT 'professional',
  assessment_type TEXT DEFAULT '25q',
  link_code TEXT UNIQUE DEFAULT generate_invite_code(),
  is_active BOOLEAN DEFAULT true,
  max_applications INTEGER,
  applications_count INTEGER DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID
);

-- Enable RLS
ALTER TABLE public.candidate_application_links ENABLE ROW LEVEL SECURITY;

-- RLS Policies for application links
CREATE POLICY "Company admins can manage their application links"
ON public.candidate_application_links
FOR ALL
USING (is_company_admin_for_company(auth.uid(), company_id));

CREATE POLICY "Anyone can view active links by code"
ON public.candidate_application_links
FOR SELECT
USING (is_active = true);

-- Trigger for updated_at
CREATE TRIGGER update_candidates_updated_at
BEFORE UPDATE ON public.candidates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();