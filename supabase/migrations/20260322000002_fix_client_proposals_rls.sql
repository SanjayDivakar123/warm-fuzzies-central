-- Update client_proposals RLS policies to also allow super admin emails

-- Insert
DROP POLICY IF EXISTS "Admins can insert client proposals" ON public.client_proposals;
CREATE POLICY "Admins can insert client proposals"
ON public.client_proposals
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
  OR (
    SELECT email FROM auth.users WHERE id = auth.uid()
  ) IN ('sanjay@rolecolorfinder.com', 'tristan@rolecolorfinder.com')
);

-- Update
DROP POLICY IF EXISTS "Admins can update client proposals" ON public.client_proposals;
CREATE POLICY "Admins can update client proposals"
ON public.client_proposals
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
  OR (
    SELECT email FROM auth.users WHERE id = auth.uid()
  ) IN ('sanjay@rolecolorfinder.com', 'tristan@rolecolorfinder.com')
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
  OR (
    SELECT email FROM auth.users WHERE id = auth.uid()
  ) IN ('sanjay@rolecolorfinder.com', 'tristan@rolecolorfinder.com')
);

-- Delete
DROP POLICY IF EXISTS "Admins can delete client proposals" ON public.client_proposals;
CREATE POLICY "Admins can delete client proposals"
ON public.client_proposals
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
  OR (
    SELECT email FROM auth.users WHERE id = auth.uid()
  ) IN ('sanjay@rolecolorfinder.com', 'tristan@rolecolorfinder.com')
);
