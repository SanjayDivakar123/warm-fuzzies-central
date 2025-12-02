-- Create a test company for development
INSERT INTO public.companies (
  id,
  name,
  subdomain,
  admin_email,
  seats_purchased,
  assessment_type,
  primary_color,
  secondary_color,
  google_sso_enabled,
  custom_domain_enabled
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Test Company',
  'test-company',
  'test@rolecolorfinder.com',
  10,
  '25q',
  '#3B82F6',
  '#8B5CF6',
  false,
  false
) ON CONFLICT (id) DO NOTHING;

-- Create admin user for the test company
-- This will link to the currently logged-in user (you'll need to update the user_id after running this)
-- For now, we'll create it with a placeholder that you can update
INSERT INTO public.company_users (
  id,
  company_id,
  email,
  role,
  status,
  invited_at,
  joined_at
) VALUES (
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  'test@rolecolorfinder.com',
  'admin',
  'active',
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;

-- Create some test employee users
INSERT INTO public.company_users (
  company_id,
  email,
  role,
  status,
  invited_at
) VALUES 
  ('00000000-0000-0000-0000-000000000001', 'employee1@test.com', 'employee', 'invited', now()),
  ('00000000-0000-0000-0000-000000000001', 'employee2@test.com', 'employee', 'invited', now()),
  ('00000000-0000-0000-0000-000000000001', 'employee3@test.com', 'employee', 'invited', now()),
  ('00000000-0000-0000-0000-000000000001', 'employee4@test.com', 'employee', 'invited', now()),
  ('00000000-0000-0000-0000-000000000001', 'employee5@test.com', 'employee', 'invited', now())
ON CONFLICT DO NOTHING;