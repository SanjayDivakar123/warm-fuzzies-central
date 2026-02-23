-- Fix interview activity trigger to use the correct interviews.status column.
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

  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    IF NEW.status = 'completed' THEN
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
    ELSIF NEW.status = 'cancelled' THEN
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
