-- Create resumes storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'resumes',
  'resumes',
  true,
  10485760, -- 10MB
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
) ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- RLS policies for resumes bucket
CREATE POLICY "Companies can upload resumes"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'resumes' AND
  (storage.foldername(name))[1] IN (
    SELECT c.id::text FROM companies c
    INNER JOIN company_users cu ON cu.company_id = c.id
    WHERE cu.user_id = auth.uid()
  )
);

CREATE POLICY "Companies can view their resumes"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'resumes' AND
  (storage.foldername(name))[1] IN (
    SELECT c.id::text FROM companies c
    INNER JOIN company_users cu ON cu.company_id = c.id
    WHERE cu.user_id = auth.uid()
  )
);

CREATE POLICY "Companies can delete their resumes"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'resumes' AND
  (storage.foldername(name))[1] IN (
    SELECT c.id::text FROM companies c
    INNER JOIN company_users cu ON cu.company_id = c.id
    WHERE cu.user_id = auth.uid()
  )
);

-- Public can view resumes (for sharing with candidates)
CREATE POLICY "Public can view resumes"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'resumes');
