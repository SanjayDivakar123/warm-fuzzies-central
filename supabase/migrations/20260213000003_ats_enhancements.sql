-- ATS Enhancements: Activity Log, Candidate Search, Calendar Integration
-- Features inspired by OpenCATS

-- ============================================
-- CANDIDATE ACTIVITY LOG
-- ============================================

CREATE TABLE candidate_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE NOT NULL,
  application_id UUID REFERENCES candidate_applications(id) ON DELETE CASCADE,
  job_posting_id UUID REFERENCES job_postings(id) ON DELETE SET NULL,
  
  -- Activity details
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'application_received',
    'stage_changed',
    'note_added',
    'email_sent',
    'email_opened',
    'interview_scheduled',
    'interview_completed',
    'interview_cancelled',
    'offer_sent',
    'offer_accepted',
    'offer_declined',
    'rejected',
    'hired',
    'resume_viewed',
    'assessment_invited',
    'assessment_completed',
    'rating_added',
    'tag_added',
    'tag_removed',
    'document_uploaded',
    'comment_added'
  )),
  
  -- Activity metadata
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  
  -- Who performed the action
  performed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  performed_by_name TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for fast lookups
CREATE INDEX idx_candidate_activities_candidate ON candidate_activities(candidate_id, created_at DESC);
CREATE INDEX idx_candidate_activities_company ON candidate_activities(company_id, created_at DESC);
CREATE INDEX idx_candidate_activities_application ON candidate_activities(application_id, created_at DESC);
CREATE INDEX idx_candidate_activities_type ON candidate_activities(activity_type);

-- ============================================
-- CANDIDATE TAGS (for filtering/search)
-- ============================================

CREATE TABLE candidate_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6366f1',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  UNIQUE(company_id, name)
);

CREATE TABLE candidate_tag_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE NOT NULL,
  tag_id UUID REFERENCES candidate_tags(id) ON DELETE CASCADE NOT NULL,
  assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  UNIQUE(candidate_id, tag_id)
);

CREATE INDEX idx_candidate_tag_assignments_candidate ON candidate_tag_assignments(candidate_id);
CREATE INDEX idx_candidate_tag_assignments_tag ON candidate_tag_assignments(tag_id);

-- ============================================
-- CANDIDATE NOTES/COMMENTS
-- ============================================

CREATE TABLE candidate_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE NOT NULL,
  application_id UUID REFERENCES candidate_applications(id) ON DELETE CASCADE,
  
  -- Note content
  content TEXT NOT NULL,
  is_private BOOLEAN DEFAULT false, -- Only visible to creator
  is_pinned BOOLEAN DEFAULT false,
  
  -- Author
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by_name TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_candidate_notes_candidate ON candidate_notes(candidate_id, created_at DESC);
CREATE INDEX idx_candidate_notes_application ON candidate_notes(application_id, created_at DESC);

-- ============================================
-- CANDIDATE RATINGS/SCORECARDS
-- ============================================

CREATE TABLE candidate_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE NOT NULL,
  application_id UUID REFERENCES candidate_applications(id) ON DELETE CASCADE,
  interview_id UUID REFERENCES interviews(id) ON DELETE SET NULL,
  
  -- Rating dimensions
  overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 5),
  technical_skills INTEGER CHECK (technical_skills >= 1 AND technical_skills <= 5),
  communication INTEGER CHECK (communication >= 1 AND communication <= 5),
  culture_fit INTEGER CHECK (culture_fit >= 1 AND culture_fit <= 5),
  experience INTEGER CHECK (experience >= 1 AND experience <= 5),
  
  -- Custom criteria (flexible)
  custom_ratings JSONB DEFAULT '{}',
  
  -- Feedback
  strengths TEXT,
  weaknesses TEXT,
  recommendation TEXT CHECK (recommendation IN ('strong_yes', 'yes', 'neutral', 'no', 'strong_no')),
  comments TEXT,
  
  -- Author
  rated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  rated_by_name TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_candidate_ratings_candidate ON candidate_ratings(candidate_id);
CREATE INDEX idx_candidate_ratings_application ON candidate_ratings(application_id);

-- ============================================
-- CALENDAR EVENTS (for interview sync)
-- ============================================

CREATE TABLE calendar_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Provider details
  provider TEXT NOT NULL CHECK (provider IN ('google', 'outlook', 'apple')),
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  calendar_id TEXT, -- Selected calendar ID
  
  -- Status
  is_connected BOOLEAN DEFAULT false,
  last_synced_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  UNIQUE(user_id, provider)
);

CREATE TABLE calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  interview_id UUID REFERENCES interviews(id) ON DELETE CASCADE,
  
  -- External calendar reference
  external_event_id TEXT,
  calendar_integration_id UUID REFERENCES calendar_integrations(id) ON DELETE SET NULL,
  
  -- Event details (cached from calendar)
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  location TEXT,
  meeting_link TEXT,
  
  -- Sync status
  last_synced_at TIMESTAMPTZ,
  sync_error TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_calendar_events_interview ON calendar_events(interview_id);
CREATE INDEX idx_calendar_events_time ON calendar_events(start_time);

-- ============================================
-- BULK EMAIL CAMPAIGNS
-- ============================================

CREATE TABLE email_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  
  -- Campaign details
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT,
  
  -- Template used (optional)
  template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,
  
  -- Targeting
  target_job_id UUID REFERENCES job_postings(id) ON DELETE SET NULL,
  target_stage_id UUID REFERENCES hiring_pipeline_stages(id) ON DELETE SET NULL,
  target_criteria JSONB DEFAULT '{}', -- Custom filters
  
  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'cancelled')),
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  
  -- Stats
  total_recipients INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  opened_count INTEGER DEFAULT 0,
  clicked_count INTEGER DEFAULT 0,
  bounced_count INTEGER DEFAULT 0,
  
  -- Author
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE email_campaign_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES email_campaigns(id) ON DELETE CASCADE NOT NULL,
  candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE NOT NULL,
  application_id UUID REFERENCES candidate_applications(id) ON DELETE SET NULL,
  
  -- Recipient details (snapshot at send time)
  email TEXT NOT NULL,
  name TEXT,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'unsubscribed')),
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  
  -- Error tracking
  error_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_email_campaign_recipients_campaign ON email_campaign_recipients(campaign_id);
CREATE INDEX idx_email_campaign_recipients_candidate ON email_campaign_recipients(candidate_id);

-- ============================================
-- PUBLIC CAREER PAGE SETTINGS
-- ============================================

CREATE TABLE career_page_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL UNIQUE,
  
  -- Page configuration
  is_enabled BOOLEAN DEFAULT true,
  slug TEXT UNIQUE, -- /careers/{slug}
  
  -- Branding
  hero_title TEXT DEFAULT 'Join Our Team',
  hero_subtitle TEXT DEFAULT 'Explore exciting career opportunities',
  hero_image_url TEXT,
  about_company TEXT,
  benefits_list JSONB DEFAULT '[]',
  
  -- Contact
  contact_email TEXT,
  
  -- SEO
  meta_title TEXT,
  meta_description TEXT,
  
  -- Social links
  linkedin_url TEXT,
  twitter_url TEXT,
  glassdoor_url TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================
-- RESUME/DOCUMENT STORAGE
-- ============================================

CREATE TABLE candidate_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE NOT NULL,
  application_id UUID REFERENCES candidate_applications(id) ON DELETE SET NULL,
  
  -- Document details
  document_type TEXT NOT NULL CHECK (document_type IN ('resume', 'cover_letter', 'portfolio', 'certificate', 'other')),
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER, -- bytes
  mime_type TEXT,
  
  -- Extracted content (for search)
  extracted_text TEXT,
  extracted_skills JSONB DEFAULT '[]',
  extracted_experience JSONB DEFAULT '[]',
  
  -- Timestamps
  uploaded_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX idx_candidate_documents_candidate ON candidate_documents(candidate_id);
CREATE INDEX idx_candidate_documents_type ON candidate_documents(document_type);

-- Full text search index on extracted text
CREATE INDEX idx_candidate_documents_search ON candidate_documents USING gin(to_tsvector('english', COALESCE(extracted_text, '')));

-- ============================================
-- SAVED SEARCHES
-- ============================================

CREATE TABLE saved_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Search details
  name TEXT NOT NULL,
  filters JSONB NOT NULL, -- Saved filter criteria
  
  -- Usage
  last_used_at TIMESTAMPTZ,
  use_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_saved_searches_user ON saved_searches(user_id);

-- ============================================
-- TRIGGERS FOR ACTIVITY LOGGING
-- ============================================

-- Function to log candidate activities
CREATE OR REPLACE FUNCTION log_candidate_activity()
RETURNS TRIGGER AS $$
BEGIN
  -- Log stage changes
  IF TG_TABLE_NAME = 'candidate_applications' AND TG_OP = 'UPDATE' THEN
    IF OLD.current_stage_id IS DISTINCT FROM NEW.current_stage_id THEN
      INSERT INTO candidate_activities (
        company_id, candidate_id, application_id, job_posting_id,
        activity_type, title, metadata
      )
      SELECT 
        jp.company_id,
        NEW.candidate_id,
        NEW.id,
        NEW.job_posting_id,
        'stage_changed',
        'Moved to new stage',
        jsonb_build_object(
          'old_stage_id', OLD.current_stage_id,
          'new_stage_id', NEW.current_stage_id
        )
      FROM job_postings jp WHERE jp.id = NEW.job_posting_id;
    END IF;
    
    -- Log rejection
    IF OLD.rejected_at IS NULL AND NEW.rejected_at IS NOT NULL THEN
      INSERT INTO candidate_activities (
        company_id, candidate_id, application_id, job_posting_id,
        activity_type, title, description
      )
      SELECT 
        jp.company_id,
        NEW.candidate_id,
        NEW.id,
        NEW.job_posting_id,
        'rejected',
        'Candidate rejected',
        NEW.rejection_reason
      FROM job_postings jp WHERE jp.id = NEW.job_posting_id;
    END IF;
  END IF;
  
  -- Log new applications
  IF TG_TABLE_NAME = 'candidate_applications' AND TG_OP = 'INSERT' THEN
    INSERT INTO candidate_activities (
      company_id, candidate_id, application_id, job_posting_id,
      activity_type, title, metadata
    )
    SELECT 
      jp.company_id,
      NEW.candidate_id,
      NEW.id,
      NEW.job_posting_id,
      'application_received',
      'New application received',
      jsonb_build_object('source', NEW.source)
    FROM job_postings jp WHERE jp.id = NEW.job_posting_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for application changes
CREATE TRIGGER trigger_log_application_activity
  AFTER INSERT OR UPDATE ON candidate_applications
  FOR EACH ROW
  EXECUTE FUNCTION log_candidate_activity();

-- Function to log interview activities
CREATE OR REPLACE FUNCTION log_interview_activity()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO candidate_activities (
      company_id, candidate_id, application_id, job_posting_id,
      activity_type, title, metadata
    )
    SELECT 
      jp.company_id,
      ca.candidate_id,
      NEW.application_id,
      ca.job_posting_id,
      'interview_scheduled',
      'Interview scheduled',
      jsonb_build_object(
        'interview_type', NEW.interview_type,
        'scheduled_at', NEW.scheduled_at,
        'duration_minutes', NEW.duration_minutes
      )
    FROM candidate_applications ca
    JOIN job_postings jp ON jp.id = ca.job_posting_id
    WHERE ca.id = NEW.application_id;
  END IF;
  
  IF TG_OP = 'UPDATE' AND OLD.interview_status IS DISTINCT FROM NEW.interview_status THEN
    IF NEW.interview_status = 'completed' THEN
      INSERT INTO candidate_activities (
        company_id, candidate_id, application_id, job_posting_id,
        activity_type, title
      )
      SELECT 
        jp.company_id,
        ca.candidate_id,
        NEW.application_id,
        ca.job_posting_id,
        'interview_completed',
        'Interview completed'
      FROM candidate_applications ca
      JOIN job_postings jp ON jp.id = ca.job_posting_id
      WHERE ca.id = NEW.application_id;
    ELSIF NEW.interview_status = 'cancelled' THEN
      INSERT INTO candidate_activities (
        company_id, candidate_id, application_id, job_posting_id,
        activity_type, title
      )
      SELECT 
        jp.company_id,
        ca.candidate_id,
        NEW.application_id,
        ca.job_posting_id,
        'interview_cancelled',
        'Interview cancelled'
      FROM candidate_applications ca
      JOIN job_postings jp ON jp.id = ca.job_posting_id
      WHERE ca.id = NEW.application_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_interview_activity
  AFTER INSERT OR UPDATE ON interviews
  FOR EACH ROW
  EXECUTE FUNCTION log_interview_activity();

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE candidate_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_tag_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_campaign_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE career_page_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;

-- Company user access policies
CREATE POLICY "Company users can view activities" ON candidate_activities
  FOR SELECT USING (
    company_id IN (SELECT company_id FROM company_users WHERE user_id = auth.uid())
  );

CREATE POLICY "Company users can create activities" ON candidate_activities
  FOR INSERT WITH CHECK (
    company_id IN (SELECT company_id FROM company_users WHERE user_id = auth.uid())
  );

CREATE POLICY "Company users can manage tags" ON candidate_tags
  FOR ALL USING (
    company_id IN (SELECT company_id FROM company_users WHERE user_id = auth.uid())
  );

CREATE POLICY "Company users can manage tag assignments" ON candidate_tag_assignments
  FOR ALL USING (
    tag_id IN (
      SELECT id FROM candidate_tags WHERE company_id IN (
        SELECT company_id FROM company_users WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Company users can manage notes" ON candidate_notes
  FOR ALL USING (
    company_id IN (SELECT company_id FROM company_users WHERE user_id = auth.uid())
    AND (is_private = false OR created_by = auth.uid())
  );

CREATE POLICY "Company users can manage ratings" ON candidate_ratings
  FOR ALL USING (
    company_id IN (SELECT company_id FROM company_users WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can manage own calendar integrations" ON calendar_integrations
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Company users can view calendar events" ON calendar_events
  FOR ALL USING (
    company_id IN (SELECT company_id FROM company_users WHERE user_id = auth.uid())
  );

CREATE POLICY "Company users can manage email campaigns" ON email_campaigns
  FOR ALL USING (
    company_id IN (SELECT company_id FROM company_users WHERE user_id = auth.uid())
  );

CREATE POLICY "Company users can view campaign recipients" ON email_campaign_recipients
  FOR ALL USING (
    campaign_id IN (
      SELECT id FROM email_campaigns WHERE company_id IN (
        SELECT company_id FROM company_users WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Company users can manage career page" ON career_page_settings
  FOR ALL USING (
    company_id IN (SELECT company_id FROM company_users WHERE user_id = auth.uid())
  );

-- Public access to career page settings (for public careers page)
CREATE POLICY "Public can view enabled career pages" ON career_page_settings
  FOR SELECT USING (is_enabled = true);

-- Public can view open job postings
CREATE POLICY "Public can view open jobs" ON job_postings
  FOR SELECT USING (status = 'open');

CREATE POLICY "Company users can manage documents" ON candidate_documents
  FOR ALL USING (
    company_id IN (SELECT company_id FROM company_users WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can manage own saved searches" ON saved_searches
  FOR ALL USING (user_id = auth.uid());
