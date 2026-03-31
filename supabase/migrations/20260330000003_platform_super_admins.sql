create table if not exists public.platform_super_admins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  email text not null,
  full_name text,
  added_by uuid,
  added_by_email text,
  created_at timestamptz not null default now()
);

create unique index if not exists platform_super_admins_email_unique_idx
  on public.platform_super_admins (email);

create unique index if not exists platform_super_admins_user_id_unique_idx
  on public.platform_super_admins (user_id)
  where user_id is not null;

insert into public.platform_super_admins (email)
values
  ('sanjay@rolecolorfinder.com'),
  ('tristan@rolecolorfinder.com'),
  ('aaron@rolecolor.com'),
  ('kody@rolecolor.com')
on conflict do nothing;

alter table public.platform_super_admins enable row level security;

drop policy if exists "service role manages platform super admins" on public.platform_super_admins;
create policy "service role manages platform super admins"
on public.platform_super_admins
as permissive
for all
to service_role
using (true)
with check (true);
