-- Create tables for Role Color Finder quiz system

-- Quiz sessions table to track individual quiz attempts
CREATE TABLE public.quiz_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  result_color TEXT, -- 'analytical', 'driver', 'expressive', 'amiable'
  result_percentage JSONB, -- Store percentages for each color type
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Individual quiz answers table
CREATE TABLE public.quiz_answers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.quiz_sessions(id) ON DELETE CASCADE,
  question_id INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  answer_value INTEGER NOT NULL, -- Numeric value of the answer
  answer_text TEXT, -- Text of the selected answer
  color_weight JSONB, -- Weight towards each color type for this answer
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.quiz_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_answers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for quiz_sessions
CREATE POLICY "Users can view their own quiz sessions" 
ON public.quiz_sessions 
FOR SELECT 
USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can create their own quiz sessions" 
ON public.quiz_sessions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own quiz sessions" 
ON public.quiz_sessions 
FOR UPDATE 
USING (auth.uid() = user_id OR user_id IS NULL);

-- Create RLS policies for quiz_answers
CREATE POLICY "Users can view answers from their quiz sessions" 
ON public.quiz_answers 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.quiz_sessions 
    WHERE quiz_sessions.id = quiz_answers.session_id 
    AND (quiz_sessions.user_id = auth.uid() OR quiz_sessions.user_id IS NULL)
  )
);

CREATE POLICY "Users can create answers for their quiz sessions" 
ON public.quiz_answers 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.quiz_sessions 
    WHERE quiz_sessions.id = quiz_answers.session_id 
    AND (quiz_sessions.user_id = auth.uid() OR quiz_sessions.user_id IS NULL)
  )
);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_quiz_session_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_quiz_sessions_updated_at
BEFORE UPDATE ON public.quiz_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_quiz_session_timestamp();

-- Create indexes for better performance
CREATE INDEX idx_quiz_sessions_user_id ON public.quiz_sessions(user_id);
CREATE INDEX idx_quiz_sessions_created_at ON public.quiz_sessions(created_at);
CREATE INDEX idx_quiz_answers_session_id ON public.quiz_answers(session_id);
CREATE INDEX idx_quiz_answers_question_id ON public.quiz_answers(question_id);