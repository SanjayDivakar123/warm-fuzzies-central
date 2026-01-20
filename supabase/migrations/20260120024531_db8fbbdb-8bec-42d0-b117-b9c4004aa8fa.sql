-- Add stripe_customer_id to companies table for payment method management
ALTER TABLE public.companies 
ADD COLUMN stripe_customer_id TEXT;