-- Create assessment_results table
CREATE TABLE public.assessment_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  assessment_type TEXT NOT NULL CHECK (assessment_type IN ('free', 'premium', 'pro')),
  results JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, assessment_type)
);

-- Create email_signups table
CREATE TABLE public.email_signups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  source TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.assessment_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_signups ENABLE ROW LEVEL SECURITY;

-- Create policies for assessment_results
CREATE POLICY "Users can view their own assessment results" 
ON public.assessment_results 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own assessment results" 
ON public.assessment_results 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own assessment results" 
ON public.assessment_results 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own assessment results" 
ON public.assessment_results 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create policies for email_signups (public insert for signup forms)
CREATE POLICY "Anyone can insert email signups" 
ON public.email_signups 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "No public access to email signups" 
ON public.email_signups 
FOR SELECT 
USING (false);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_assessment_results_updated_at
  BEFORE UPDATE ON public.assessment_results
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for better performance
CREATE INDEX idx_assessment_results_user_id ON public.assessment_results(user_id);
CREATE INDEX idx_assessment_results_type ON public.assessment_results(assessment_type);
CREATE INDEX idx_email_signups_email ON public.email_signups(email);
CREATE INDEX idx_email_signups_created_at ON public.email_signups(created_at);