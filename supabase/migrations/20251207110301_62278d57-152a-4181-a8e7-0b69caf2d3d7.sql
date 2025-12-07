-- Allow public read access to companies by subdomain for company portal login pages
CREATE POLICY "Anyone can view companies by subdomain" 
ON public.companies 
FOR SELECT 
USING (true);