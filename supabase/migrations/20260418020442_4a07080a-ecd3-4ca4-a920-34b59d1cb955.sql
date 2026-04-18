-- Auto-grant admin role + active tenant to sanjay@rolecolorfinder.com on signup
CREATE OR REPLACE FUNCTION public.handle_sanjay_unlimited()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_tenant_id uuid;
BEGIN
  IF NEW.email = 'sanjay@rolecolorfinder.com' THEN
    -- Grant admin role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin'::app_role)
    ON CONFLICT DO NOTHING;

    -- Auto-create an active tenant (unlimited)
    INSERT INTO public.tenants (name, owner_id, status)
    VALUES ('Sanjay Workspace', NEW.id, 'active'::tenant_status)
    RETURNING id INTO new_tenant_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_sanjay_unlimited ON auth.users;
CREATE TRIGGER on_auth_user_sanjay_unlimited
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_sanjay_unlimited();