CREATE TABLE IF NOT EXISTS public.contact_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT NOT NULL,
  source_page TEXT NOT NULL DEFAULT 'home',
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'resolved')),
  submitted_by_user_id UUID
);

ALTER TABLE public.contact_queries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit contact query"
ON public.contact_queries
FOR INSERT
TO anon, authenticated
WITH CHECK (
  char_length(trim(name)) > 0
  AND char_length(trim(email)) > 0
  AND char_length(trim(message)) > 0
);

CREATE POLICY "Super admins can read contact queries"
ON public.contact_queries
FOR SELECT
TO authenticated
USING (
  lower(coalesce(auth.jwt() ->> 'email', '')) = ANY (
    ARRAY['sanjay@rolecolorfinder.com', 'tristan@rolecolorfinder.com']
  )
);

CREATE POLICY "Super admins can update contact query status"
ON public.contact_queries
FOR UPDATE
TO authenticated
USING (
  lower(coalesce(auth.jwt() ->> 'email', '')) = ANY (
    ARRAY['sanjay@rolecolorfinder.com', 'tristan@rolecolorfinder.com']
  )
)
WITH CHECK (
  lower(coalesce(auth.jwt() ->> 'email', '')) = ANY (
    ARRAY['sanjay@rolecolorfinder.com', 'tristan@rolecolorfinder.com']
  )
);

CREATE INDEX IF NOT EXISTS idx_contact_queries_created_at
ON public.contact_queries (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_contact_queries_status
ON public.contact_queries (status);
