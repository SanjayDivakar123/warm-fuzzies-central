-- Add alt_text column for featured images
ALTER TABLE public.blog_posts
ADD COLUMN IF NOT EXISTS featured_image_alt TEXT;