-- ============================================================
-- Proposal Acceptances
-- Tracks client acceptance flow: agreement → payment → contact
-- ============================================================

CREATE TABLE IF NOT EXISTS public.proposal_acceptances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_slug text NOT NULL,

  -- E-signature
  signed_name text,
  signed_at timestamptz,
  agreement_accepted boolean DEFAULT false,

  -- Payment
  stripe_session_id text UNIQUE,
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed')),
  paid_at timestamptz,

  -- Contact info (collected after payment)
  first_name text,
  last_name text,
  email text,
  phone text,
  designation text,

  -- Overall status
  status text DEFAULT 'agreement_pending'
    CHECK (status IN ('agreement_pending', 'payment_pending', 'contact_pending', 'completed')),

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.set_proposal_acceptance_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER proposal_acceptances_updated_at
  BEFORE UPDATE ON public.proposal_acceptances
  FOR EACH ROW EXECUTE FUNCTION public.set_proposal_acceptance_updated_at();

-- RLS
ALTER TABLE public.proposal_acceptances ENABLE ROW LEVEL SECURITY;

-- Public can insert (unauthenticated clients filling out the form)
CREATE POLICY "public_insert_acceptance" ON public.proposal_acceptances
  FOR INSERT WITH CHECK (true);

-- Public can read by id (needed for success page to fetch status)
CREATE POLICY "public_select_acceptance" ON public.proposal_acceptances
  FOR SELECT USING (true);

-- Public can update their own record (for contact info after payment)
CREATE POLICY "public_update_acceptance" ON public.proposal_acceptances
  FOR UPDATE USING (true);

-- ============================================================
-- Insert Hyatt proposal into client_proposals if missing
-- (fixes it not appearing in the Proposals admin page)
-- ============================================================

INSERT INTO public.client_proposals (
  proposal_id,
  slug,
  proposal_title,
  company_name,
  submitted_by,
  background_image_url,
  pricing,
  closing_text,
  status
)
SELECT
  'RCF-HYATT-2026-03-001',
  'RCF-HYATT-2026-03-001',
  'Hyatt Proposal',
  'Hyatt Hotels Corporation',
  'Kody Krueger, Head of Sales',
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1600&q=80',
  '{
    "platformDeployment": "$5,000",
    "employeeOnboarding": "$20 per employee (one-time)",
    "corePlatformMonthly": "$500/month",
    "hiringIntelligenceMonthly": "$1,000/month",
    "includedJobRoles": "10",
    "applicantsPerRole": "1,000",
    "scalingPrice": "+$1,000/month",
    "scalingNote": "per additional 10 active job roles",
    "outcomePrice": "$20 per successful hire",
    "outcomeNote": "This aligns investment directly with hiring outcomes and organizational growth."
  }'::jsonb,
  E'RoleColorFinder is designed to become a foundational system for how organizations structure teams, hire effectively, and scale performance across every property and department.\n\nThe hospitality industry demands consistent execution, strong team alignment, and high-quality hiring at scale. RCF addresses all three with a single integrated platform built for long-term operational impact — not a one-time workshop or assessment, but a living system embedded into how {{companyName}} operates every day.\n\nWe look forward to partnering with {{companyName}} to build a high-performing team culture — one that is measurable, scalable, and aligned with the world-class experience {{companyName}} is known for delivering.\n\nThis proposal is the starting point. Our team is ready to move quickly, work closely with your leadership, and deliver results from day one. We are confident this partnership will set a new standard for how {{companyName}} develops and deploys talent across its portfolio.',
  'active'
WHERE NOT EXISTS (
  SELECT 1 FROM public.client_proposals WHERE slug = 'RCF-HYATT-2026-03-001'
);
