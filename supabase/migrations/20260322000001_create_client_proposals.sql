-- Client proposals table for shareable sales proposal pages

CREATE TABLE IF NOT EXISTS public.client_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id text NOT NULL,
  slug text NOT NULL UNIQUE,
  proposal_title text NOT NULL,
  company_name text NOT NULL,
  submitted_by text NOT NULL DEFAULT 'Kody Krueger, Head of Sales',
  background_image_url text NOT NULL DEFAULT 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1600&q=80',
  pricing jsonb NOT NULL DEFAULT '{}',
  closing_text text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'draft')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_client_proposals_slug ON public.client_proposals(slug);
CREATE INDEX IF NOT EXISTS idx_client_proposals_status ON public.client_proposals(status);

ALTER TABLE public.client_proposals ENABLE ROW LEVEL SECURITY;

-- Anyone can read proposals (they're shared via public link)
DROP POLICY IF EXISTS "Public can view client proposals" ON public.client_proposals;
CREATE POLICY "Public can view client proposals"
ON public.client_proposals
FOR SELECT
TO public
USING (true);

-- Only admins can create proposals
DROP POLICY IF EXISTS "Admins can insert client proposals" ON public.client_proposals;
CREATE POLICY "Admins can insert client proposals"
ON public.client_proposals
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Only admins can update proposals
DROP POLICY IF EXISTS "Admins can update client proposals" ON public.client_proposals;
CREATE POLICY "Admins can update client proposals"
ON public.client_proposals
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Only admins can delete proposals
DROP POLICY IF EXISTS "Admins can delete client proposals" ON public.client_proposals;
CREATE POLICY "Admins can delete client proposals"
ON public.client_proposals
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Auto-update updated_at on row changes
CREATE OR REPLACE FUNCTION public.update_client_proposals_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_client_proposals_updated_at ON public.client_proposals;
CREATE TRIGGER trg_client_proposals_updated_at
  BEFORE UPDATE ON public.client_proposals
  FOR EACH ROW EXECUTE FUNCTION public.update_client_proposals_updated_at();
