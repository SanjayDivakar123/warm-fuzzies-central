-- Create enum for assessment categories (Professional, Entrepreneur, Executive, Manager)
CREATE TYPE public.company_assessment_category AS ENUM ('professional', 'entrepreneur', 'executive', 'manager');

-- Add assessment_category column to companies table
ALTER TABLE public.companies 
ADD COLUMN assessment_category public.company_assessment_category NOT NULL DEFAULT 'professional';

-- Add a comment for documentation
COMMENT ON COLUMN public.companies.assessment_category IS 'The category of assessment: professional, entrepreneur, executive (senior leader), or manager (mid-level leader)';