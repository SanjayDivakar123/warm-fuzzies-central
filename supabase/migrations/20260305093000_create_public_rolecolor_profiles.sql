-- Public RoleColor social profiles
CREATE TABLE IF NOT EXISTS public.public_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  username text NOT NULL UNIQUE,
  is_public boolean NOT NULL DEFAULT true,
  selected_assessment_result_id uuid NULL,
  selected_assessment_type text NULL,
  theme text NOT NULL DEFAULT 'classic',
  profile_image_url text NULL,
  view_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT public_profiles_username_format CHECK (username ~ '^[a-z0-9_-]{3,30}$')
);

CREATE INDEX IF NOT EXISTS idx_public_profiles_username ON public.public_profiles(username);
CREATE INDEX IF NOT EXISTS idx_public_profiles_user_id ON public.public_profiles(user_id);

ALTER TABLE public.public_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view public profiles" ON public.public_profiles;
CREATE POLICY "Public can view public profiles"
ON public.public_profiles
FOR SELECT
USING (is_public = true);

DROP POLICY IF EXISTS "Users can insert their own public profile" ON public.public_profiles;
CREATE POLICY "Users can insert their own public profile"
ON public.public_profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own public profile" ON public.public_profiles;
CREATE POLICY "Users can update their own public profile"
ON public.public_profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own public profile" ON public.public_profiles;
CREATE POLICY "Users can delete their own public profile"
ON public.public_profiles
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Public profile photos bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'public-profile-photos',
  'public-profile-photos',
  true,
  5242880,
  ARRAY['image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public can view public profile photos" ON storage.objects;
CREATE POLICY "Public can view public profile photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'public-profile-photos');

DROP POLICY IF EXISTS "Users can upload own public profile photos" ON storage.objects;
CREATE POLICY "Users can upload own public profile photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'public-profile-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can update own public profile photos" ON storage.objects;
CREATE POLICY "Users can update own public profile photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'public-profile-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'public-profile-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can delete own public profile photos" ON storage.objects;
CREATE POLICY "Users can delete own public profile photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'public-profile-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
