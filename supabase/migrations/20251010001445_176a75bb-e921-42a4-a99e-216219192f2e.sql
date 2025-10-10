-- Create voice_assessments table for phone-based assessments
CREATE TABLE IF NOT EXISTS public.voice_assessments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL UNIQUE,
  phone_number TEXT NOT NULL,
  assessment_type TEXT NOT NULL DEFAULT 'professional_25q',
  score_yellow INTEGER NOT NULL DEFAULT 0,
  score_red INTEGER NOT NULL DEFAULT 0,
  score_green INTEGER NOT NULL DEFAULT 0,
  score_blue INTEGER NOT NULL DEFAULT 0,
  dominant_color TEXT,
  status TEXT NOT NULL DEFAULT 'initiated',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.voice_assessments ENABLE ROW LEVEL SECURITY;

-- Create policy for anyone to view their results by phone number
CREATE POLICY "Anyone can view results by phone number"
ON public.voice_assessments
FOR SELECT
USING (true);

-- Create policy for webhook to insert/update records
CREATE POLICY "System can manage voice assessments"
ON public.voice_assessments
FOR ALL
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_voice_assessments_updated_at
BEFORE UPDATE ON public.voice_assessments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_voice_assessments_session_id ON public.voice_assessments(session_id);
CREATE INDEX idx_voice_assessments_phone_number ON public.voice_assessments(phone_number);
CREATE INDEX idx_voice_assessments_status ON public.voice_assessments(status);
