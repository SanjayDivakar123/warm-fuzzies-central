-- Create audit_logs table for tracking admin actions
CREATE TABLE public.audit_logs (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id uuid NULL,
    user_email text NULL,
    action text NOT NULL,
    entity_type text NOT NULL,
    entity_id uuid NULL,
    details jsonb DEFAULT '{}'::jsonb,
    ip_address text NULL,
    user_agent text NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Policies: Only company admins can view audit logs
CREATE POLICY "Company admins can view audit logs"
ON public.audit_logs FOR SELECT
USING (is_company_admin_for_company(auth.uid(), company_id));

-- Only system can insert audit logs (via service role)
CREATE POLICY "Service role can insert audit logs"
ON public.audit_logs FOR INSERT
WITH CHECK ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- Create index for faster queries
CREATE INDEX idx_audit_logs_company_id ON public.audit_logs(company_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- Create API keys table for RESTful API access
CREATE TABLE public.company_api_keys (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name text NOT NULL,
    key_hash text NOT NULL,
    key_prefix text NOT NULL,
    permissions jsonb DEFAULT '["read"]'::jsonb,
    last_used_at timestamp with time zone NULL,
    expires_at timestamp with time zone NULL,
    is_active boolean NOT NULL DEFAULT true,
    created_by uuid NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.company_api_keys ENABLE ROW LEVEL SECURITY;

-- Only company admins can manage API keys
CREATE POLICY "Company admins can manage API keys"
ON public.company_api_keys FOR ALL
USING (is_company_admin_for_company(auth.uid(), company_id));

-- Create index
CREATE INDEX idx_company_api_keys_company_id ON public.company_api_keys(company_id);
CREATE INDEX idx_company_api_keys_key_prefix ON public.company_api_keys(key_prefix);

-- Create scheduled_reports table for automated email reports
CREATE TABLE public.scheduled_reports (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name text NOT NULL,
    frequency text NOT NULL DEFAULT 'weekly',
    recipients text[] NOT NULL DEFAULT '{}',
    report_type text NOT NULL DEFAULT 'team_summary',
    include_sections jsonb DEFAULT '["overview", "color_distribution", "completion_trend"]'::jsonb,
    last_sent_at timestamp with time zone NULL,
    next_send_at timestamp with time zone NULL,
    is_active boolean NOT NULL DEFAULT true,
    created_by uuid NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.scheduled_reports ENABLE ROW LEVEL SECURITY;

-- Only company admins can manage scheduled reports
CREATE POLICY "Company admins can manage scheduled reports"
ON public.scheduled_reports FOR ALL
USING (is_company_admin_for_company(auth.uid(), company_id));

-- Create index
CREATE INDEX idx_scheduled_reports_company_id ON public.scheduled_reports(company_id);
CREATE INDEX idx_scheduled_reports_next_send ON public.scheduled_reports(next_send_at) WHERE is_active = true;

-- Add keyboard_shortcuts_enabled column to company_users for user preferences
ALTER TABLE public.company_users
ADD COLUMN IF NOT EXISTS keyboard_shortcuts_enabled boolean DEFAULT true;

-- Add columns for re-assessment tracking
ALTER TABLE public.company_users
ADD COLUMN IF NOT EXISTS assessment_history jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS last_reassessed_at timestamp with time zone NULL;

-- Create team_compatibility_scores table for compatibility matrix
CREATE TABLE public.team_compatibility_scores (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    user_a_id uuid NOT NULL REFERENCES public.company_users(id) ON DELETE CASCADE,
    user_b_id uuid NOT NULL REFERENCES public.company_users(id) ON DELETE CASCADE,
    compatibility_score numeric NOT NULL,
    analysis jsonb DEFAULT '{}'::jsonb,
    calculated_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE(user_a_id, user_b_id)
);

-- Enable RLS
ALTER TABLE public.team_compatibility_scores ENABLE ROW LEVEL SECURITY;

-- Company admins can view compatibility scores
CREATE POLICY "Company admins can view compatibility scores"
ON public.team_compatibility_scores FOR SELECT
USING (is_company_admin_for_company(auth.uid(), company_id));

-- Service role can manage scores
CREATE POLICY "Service role can manage compatibility scores"
ON public.team_compatibility_scores FOR ALL
USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- Create index
CREATE INDEX idx_team_compatibility_company ON public.team_compatibility_scores(company_id);

-- Create job_templates table for hiring
CREATE TABLE public.job_templates (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id uuid NULL,
    name text NOT NULL,
    description text NULL,
    ideal_primary_color text NOT NULL,
    ideal_secondary_color text NULL,
    required_skills text[] DEFAULT '{}',
    suggested_interview_questions jsonb DEFAULT '[]'::jsonb,
    is_global boolean DEFAULT false,
    created_by uuid NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.job_templates ENABLE ROW LEVEL SECURITY;

-- Anyone can view global templates
CREATE POLICY "Anyone can view global templates"
ON public.job_templates FOR SELECT
USING (is_global = true);

-- Company admins can manage their templates
CREATE POLICY "Company admins can manage their templates"
ON public.job_templates FOR ALL
USING (company_id IS NOT NULL AND is_company_admin_for_company(auth.uid(), company_id));

-- Create index
CREATE INDEX idx_job_templates_company ON public.job_templates(company_id) WHERE company_id IS NOT NULL;
CREATE INDEX idx_job_templates_global ON public.job_templates(is_global) WHERE is_global = true;

-- Insert default global job templates
INSERT INTO public.job_templates (name, description, ideal_primary_color, ideal_secondary_color, required_skills, is_global) VALUES
('Software Engineer', 'Technical problem solver focused on building and improving systems', 'Blue', 'Green', ARRAY['Coding', 'Problem Solving', 'Technical Analysis'], true),
('Product Manager', 'Strategic leader driving product vision and cross-functional collaboration', 'Red', 'Yellow', ARRAY['Strategy', 'Communication', 'Project Management'], true),
('Sales Representative', 'Persuasive communicator focused on driving revenue and building relationships', 'Yellow', 'Red', ARRAY['Communication', 'Negotiation', 'Client Relations'], true),
('UX Designer', 'Creative problem solver focused on user experience and visual design', 'Blue', 'Yellow', ARRAY['UI Design', 'User Research', 'Prototyping'], true),
('Operations Manager', 'Organized executor ensuring smooth processes and team coordination', 'Green', 'Red', ARRAY['Operations', 'Process Improvement', 'Team Management'], true),
('Marketing Specialist', 'Creative communicator driving brand awareness and engagement', 'Yellow', 'Blue', ARRAY['Marketing', 'Content Creation', 'Analytics'], true),
('Data Analyst', 'Detail-oriented investigator turning data into actionable insights', 'Green', 'Blue', ARRAY['Data Analysis', 'SQL', 'Visualization'], true),
('Customer Success Manager', 'Relationship builder ensuring customer satisfaction and retention', 'Yellow', 'Green', ARRAY['Client Communication', 'Problem Solving', 'Product Knowledge'], true);

-- Add slack_channel_id to companies for Slack integration
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS slack_channel_id text NULL,
ADD COLUMN IF NOT EXISTS slack_notifications_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS ms_teams_webhook_url text NULL,
ADD COLUMN IF NOT EXISTS ms_teams_notifications_enabled boolean DEFAULT false;