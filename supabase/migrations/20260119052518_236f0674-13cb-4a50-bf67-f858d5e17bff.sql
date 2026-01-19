-- Create table to store team insights
CREATE TABLE public.team_insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  insights JSONB NOT NULL,
  team_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.team_insights ENABLE ROW LEVEL SECURITY;

-- Create unique constraint on company_id (one insight per company)
CREATE UNIQUE INDEX team_insights_company_id_idx ON public.team_insights(company_id);

-- RLS policies - only company admins can access
CREATE POLICY "Company admins can view their team insights"
ON public.team_insights
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.company_users cu
    WHERE cu.company_id = team_insights.company_id
    AND cu.user_id = auth.uid()
    AND cu.role = 'admin'
  )
);

CREATE POLICY "Company admins can insert team insights"
ON public.team_insights
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.company_users cu
    WHERE cu.company_id = team_insights.company_id
    AND cu.user_id = auth.uid()
    AND cu.role = 'admin'
  )
);

CREATE POLICY "Company admins can update team insights"
ON public.team_insights
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.company_users cu
    WHERE cu.company_id = team_insights.company_id
    AND cu.user_id = auth.uid()
    AND cu.role = 'admin'
  )
);

CREATE POLICY "Company admins can delete team insights"
ON public.team_insights
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.company_users cu
    WHERE cu.company_id = team_insights.company_id
    AND cu.user_id = auth.uid()
    AND cu.role = 'admin'
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_team_insights_updated_at
BEFORE UPDATE ON public.team_insights
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();