-- Allow users to claim unclaimed admin company_user records
-- This is useful for development/testing
CREATE POLICY "Users can claim unclaimed admin records"
ON public.company_users
FOR UPDATE
TO authenticated
USING (
  user_id IS NULL 
  AND role = 'admin'
)
WITH CHECK (
  user_id = auth.uid()
  AND role = 'admin'
);