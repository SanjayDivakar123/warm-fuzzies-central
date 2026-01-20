-- Create billing_credits table to track company billing credits
CREATE TABLE public.billing_credits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('refund', 'manual', 'payment')),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- Create billing_transactions table to track all charges and credits
CREATE TABLE public.billing_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  company_user_id UUID REFERENCES public.company_users(id) ON DELETE SET NULL,
  amount DECIMAL(10, 2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('charge', 'refund', 'credit_used', 'credit_added')),
  description TEXT,
  stripe_payment_intent_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add billing-related columns to company_users
ALTER TABLE public.company_users
ADD COLUMN IF NOT EXISTS charged_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS charge_amount DECIMAL(10, 2) DEFAULT 20.00;

-- Add credit_balance to companies for quick lookup
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS credit_balance DECIMAL(10, 2) NOT NULL DEFAULT 0.00;

-- Enable RLS on new tables
ALTER TABLE public.billing_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_transactions ENABLE ROW LEVEL SECURITY;

-- RLS policies for billing_credits
CREATE POLICY "Company admins can view their billing credits"
ON public.billing_credits
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.company_users
    WHERE company_users.company_id = billing_credits.company_id
    AND company_users.user_id = auth.uid()
    AND company_users.role = 'admin'
    AND company_users.status = 'active'
  )
);

CREATE POLICY "Only system can insert billing credits"
ON public.billing_credits
FOR INSERT
WITH CHECK (false);

-- RLS policies for billing_transactions
CREATE POLICY "Company admins can view their billing transactions"
ON public.billing_transactions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.company_users
    WHERE company_users.company_id = billing_transactions.company_id
    AND company_users.user_id = auth.uid()
    AND company_users.role = 'admin'
    AND company_users.status = 'active'
  )
);

CREATE POLICY "Only system can insert billing transactions"
ON public.billing_transactions
FOR INSERT
WITH CHECK (false);

-- Create index for quick credit balance lookups
CREATE INDEX idx_billing_credits_company_id ON public.billing_credits(company_id);
CREATE INDEX idx_billing_transactions_company_id ON public.billing_transactions(company_id);
CREATE INDEX idx_company_users_charged_at ON public.company_users(charged_at);