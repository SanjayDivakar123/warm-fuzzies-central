-- Drop the existing RESTRICTIVE policy that's blocking updates
DROP POLICY IF EXISTS "Users can claim unclaimed admin records" ON public.company_users;

-- Create a new PERMISSIVE policy that allows authenticated users to claim unclaimed admin records
CREATE POLICY "Users can claim unclaimed admin records"
ON public.company_users
FOR UPDATE
TO authenticated
USING (user_id IS NULL AND role = 'admin')
WITH CHECK (user_id = auth.uid() AND role = 'admin');