-- Add email template customization columns to companies table
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS email_template_subject TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS email_template_greeting TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS email_template_body TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS email_template_cta_text TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS email_show_logo BOOLEAN DEFAULT true;