-- Meeting Intelligence Tables
CREATE TABLE meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  title text,
  platform text, -- 'zoom' | 'google_meet' | 'teams'
  meeting_url text,
  calendar_event_id text,
  source text DEFAULT 'manual', -- 'calendar' | 'manual'
  bot_id text, -- Recall.ai bot ID
  bot_join_status text DEFAULT 'scheduled', -- 'scheduled' | 'joining' | 'live' | 'processing' | 'needs_mapping' | 'complete' | 'failed'
  chat_message_sent boolean DEFAULT false,
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

CREATE TABLE meeting_speakers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id uuid REFERENCES meetings(id) ON DELETE CASCADE NOT NULL,
  detected_name text,
  match_status text DEFAULT 'pending', -- 'auto' | 'admin_confirmed' | 'external' | 'skipped' | 'pending'
  company_user_id uuid REFERENCES company_users(id),
  talk_time_pct integer,
  signal_count integer DEFAULT 0,
  dominant_rolecolor text
);

CREATE TABLE utterances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id uuid REFERENCES meetings(id) ON DELETE CASCADE NOT NULL,
  speaker_id uuid REFERENCES meeting_speakers(id),
  text text,
  timestamp_ms integer,
  word_count integer,
  rolecolor_signal text,
  confidence numeric(3,2)
);

CREATE TABLE meeting_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id uuid REFERENCES meetings(id) ON DELETE CASCADE NOT NULL,
  generated_at timestamptz DEFAULT now(),
  summary text,
  alignment_score integer,
  dominant_speaker_id uuid REFERENCES meeting_speakers(id),
  least_active_speaker_id uuid REFERENCES meeting_speakers(id),
  key_moments jsonb,
  action_items jsonb,
  recommendations jsonb,
  participant_dynamics jsonb,
  pdf_url text
);

CREATE TABLE company_settings_meeting (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid UNIQUE REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  reclaim_workspace_secret text,
  reclaim_api_key text,
  google_cal_connected boolean DEFAULT false,
  google_cal_refresh_token text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_speakers ENABLE ROW LEVEL SECURITY;
ALTER TABLE utterances ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_settings_meeting ENABLE ROW LEVEL SECURITY;

-- RLS Policies for meetings
CREATE POLICY "Users can view meetings in their company"
  ON meetings FOR SELECT
  USING (company_id IN (SELECT company_id FROM company_users WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage meetings"
  ON meetings FOR ALL
  USING (company_id IN (SELECT company_id FROM company_users WHERE user_id = auth.uid() AND role IN ('admin', 'hr', 'partner')));

-- RLS Policies for meeting_speakers
CREATE POLICY "Users can view speakers for their company meetings"
  ON meeting_speakers FOR SELECT
  USING (meeting_id IN (SELECT id FROM meetings WHERE company_id IN (SELECT company_id FROM company_users WHERE user_id = auth.uid())));

CREATE POLICY "Admins can manage speakers"
  ON meeting_speakers FOR ALL
  USING (meeting_id IN (SELECT id FROM meetings WHERE company_id IN (SELECT company_id FROM company_users WHERE user_id = auth.uid() AND role IN ('admin', 'hr', 'partner'))));

-- RLS Policies for utterances
CREATE POLICY "Users can view utterances for their company meetings"
  ON utterances FOR SELECT
  USING (meeting_id IN (SELECT id FROM meetings WHERE company_id IN (SELECT company_id FROM company_users WHERE user_id = auth.uid())));

CREATE POLICY "Admins can manage utterances"
  ON utterances FOR ALL
  USING (meeting_id IN (SELECT id FROM meetings WHERE company_id IN (SELECT company_id FROM company_users WHERE user_id = auth.uid() AND role IN ('admin', 'hr', 'partner'))));

-- RLS Policies for meeting_reports
CREATE POLICY "Users can view reports for their company meetings"
  ON meeting_reports FOR SELECT
  USING (meeting_id IN (SELECT id FROM meetings WHERE company_id IN (SELECT company_id FROM company_users WHERE user_id = auth.uid())));

CREATE POLICY "Admins can manage reports"
  ON meeting_reports FOR ALL
  USING (meeting_id IN (SELECT id FROM meetings WHERE company_id IN (SELECT company_id FROM company_users WHERE user_id = auth.uid() AND role IN ('admin', 'hr', 'partner'))));

-- RLS Policies for company_settings_meeting
CREATE POLICY "Admins can view settings for their company"
  ON company_settings_meeting FOR SELECT
  USING (company_id IN (SELECT company_id FROM company_users WHERE user_id = auth.uid() AND role IN ('admin', 'partner')));

CREATE POLICY "Admins can manage settings for their company"
  ON company_settings_meeting FOR ALL
  USING (company_id IN (SELECT company_id FROM company_users WHERE user_id = auth.uid() AND role IN ('admin', 'partner')));

-- Create indexes for performance
CREATE INDEX idx_meetings_company_id ON meetings(company_id);
CREATE INDEX idx_meetings_bot_id ON meetings(bot_id);
CREATE INDEX idx_meetings_started_at ON meetings(started_at);
CREATE INDEX idx_meeting_speakers_meeting_id ON meeting_speakers(meeting_id);
CREATE INDEX idx_meeting_speakers_company_user_id ON meeting_speakers(company_user_id);
CREATE INDEX idx_utterances_meeting_id ON utterances(meeting_id);
CREATE INDEX idx_utterances_speaker_id ON utterances(speaker_id);
CREATE INDEX idx_meeting_reports_meeting_id ON meeting_reports(meeting_id);
CREATE INDEX idx_company_settings_meeting_company_id ON company_settings_meeting(company_id);
