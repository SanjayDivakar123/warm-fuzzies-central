-- Public storage bucket for proposal header/background images.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'proposal-backgrounds',
  'proposal-backgrounds',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Anyone can view proposal backgrounds" ON storage.objects;
CREATE POLICY "Anyone can view proposal backgrounds"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'proposal-backgrounds');

DROP POLICY IF EXISTS "Admins can upload proposal backgrounds" ON storage.objects;
CREATE POLICY "Admins can upload proposal backgrounds"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'proposal-backgrounds'
  AND (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
    OR auth.jwt() ->> 'email' IN ('sanjay@rolecolorfinder.com', 'tristan@rolecolorfinder.com')
  )
);

DROP POLICY IF EXISTS "Admins can update proposal backgrounds" ON storage.objects;
CREATE POLICY "Admins can update proposal backgrounds"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'proposal-backgrounds'
  AND (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
    OR auth.jwt() ->> 'email' IN ('sanjay@rolecolorfinder.com', 'tristan@rolecolorfinder.com')
  )
)
WITH CHECK (
  bucket_id = 'proposal-backgrounds'
  AND (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
    OR auth.jwt() ->> 'email' IN ('sanjay@rolecolorfinder.com', 'tristan@rolecolorfinder.com')
  )
);
