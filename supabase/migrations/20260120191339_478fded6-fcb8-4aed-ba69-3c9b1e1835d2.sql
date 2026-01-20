-- Create user_subscriptions table for tracking individual subscriptions
CREATE TABLE public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  product_id TEXT NOT NULL,
  price_id TEXT,
  tier TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create assessment_progress table for tracking retakes
CREATE TABLE public.assessment_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  assessment_type TEXT NOT NULL,
  attempt_number INTEGER DEFAULT 1,
  results JSONB,
  dominant_color TEXT,
  scores JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create family_plan_members table
CREATE TABLE public.family_plan_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL,
  member_email TEXT NOT NULL,
  member_user_id UUID,
  status TEXT DEFAULT 'pending',
  invited_at TIMESTAMPTZ DEFAULT now(),
  joined_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_plan_members ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_subscriptions
CREATE POLICY "Users can view their own subscriptions"
ON public.user_subscriptions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscriptions"
ON public.user_subscriptions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions"
ON public.user_subscriptions FOR UPDATE
USING (auth.uid() = user_id);

-- RLS policies for assessment_progress
CREATE POLICY "Users can view their own assessment progress"
ON public.assessment_progress FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own assessment progress"
ON public.assessment_progress FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- RLS policies for family_plan_members
CREATE POLICY "Owners can view their family members"
ON public.family_plan_members FOR SELECT
USING (auth.uid() = owner_user_id OR auth.uid() = member_user_id);

CREATE POLICY "Owners can insert family members"
ON public.family_plan_members FOR INSERT
WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "Owners can update family members"
ON public.family_plan_members FOR UPDATE
USING (auth.uid() = owner_user_id);

CREATE POLICY "Owners can delete family members"
ON public.family_plan_members FOR DELETE
USING (auth.uid() = owner_user_id);

-- Create indexes for performance
CREATE INDEX idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_status ON public.user_subscriptions(status);
CREATE INDEX idx_assessment_progress_user_id ON public.assessment_progress(user_id);
CREATE INDEX idx_family_plan_members_owner ON public.family_plan_members(owner_user_id);
CREATE INDEX idx_family_plan_members_member ON public.family_plan_members(member_user_id);

-- Add trigger for updated_at on user_subscriptions
CREATE TRIGGER update_user_subscriptions_updated_at
BEFORE UPDATE ON public.user_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();