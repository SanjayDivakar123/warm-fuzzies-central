-- Add resume_url column to candidates table
ALTER TABLE public.candidates
ADD COLUMN resume_url TEXT DEFAULT NULL;

-- Add resume_parsed_content column for storing extracted text
ALTER TABLE public.candidates
ADD COLUMN resume_parsed_content TEXT DEFAULT NULL;

-- Create resumes storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('candidate-resumes', 'candidate-resumes', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for resume storage
-- Company admins can upload resumes
CREATE POLICY "Company admins can upload candidate resumes"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'candidate-resumes' 
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM companies WHERE id IN (
      SELECT company_id FROM company_users 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'hr', 'partner')
      AND status = 'active'
    )
  )
);

-- Company admins can view resumes
CREATE POLICY "Company admins can view candidate resumes"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'candidate-resumes'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM companies WHERE id IN (
      SELECT company_id FROM company_users 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'hr', 'partner')
      AND status = 'active'
    )
  )
);

-- Company admins can delete resumes
CREATE POLICY "Company admins can delete candidate resumes"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'candidate-resumes'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM companies WHERE id IN (
      SELECT company_id FROM company_users 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'hr', 'partner')
      AND status = 'active'
    )
  )
);

-- Public can upload to bucket (for candidate self-upload via edge function)
CREATE POLICY "Service role can manage resumes"
ON storage.objects FOR ALL
USING (
  bucket_id = 'candidate-resumes'
  AND (auth.jwt() ->> 'role') = 'service_role'
);