-- Create payments table to track payment information
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  email TEXT NOT NULL,
  stripe_session_id TEXT UNIQUE,
  amount INTEGER,             -- Amount charged (in cents)
  currency TEXT DEFAULT 'usd',
  status TEXT DEFAULT 'pending',  -- 'pending', 'paid', 'failed'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row-Level Security
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow users to view their own payments
CREATE POLICY "select_own_payments" ON public.payments
  FOR SELECT
  USING (user_id = auth.uid());

-- Create policies for edge functions (trusted code) to insert and update payments
CREATE POLICY "insert_payment" ON public.payments
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "update_payment" ON public.payments
  FOR UPDATE
  USING (true);