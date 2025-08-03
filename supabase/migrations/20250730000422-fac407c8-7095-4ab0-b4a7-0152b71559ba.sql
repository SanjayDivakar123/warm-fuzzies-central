-- Create email_signups table for viral email collection
CREATE TABLE public.email_signups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'free_quiz',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed BOOLEAN DEFAULT false
);

-- Enable Row Level Security
ALTER TABLE public.email_signups ENABLE ROW LEVEL SECURITY;

-- Create policies for email signups (allow anyone to insert, only admins to read)
CREATE POLICY "Anyone can submit email signups" 
ON public.email_signups 
FOR INSERT 
WITH CHECK (true);

-- Add index for performance
CREATE INDEX idx_email_signups_email ON public.email_signups(email);
CREATE INDEX idx_email_signups_source ON public.email_signups(source);
CREATE INDEX idx_email_signups_created_at ON public.email_signups(created_at);