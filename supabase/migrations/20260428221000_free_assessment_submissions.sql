create table if not exists public.free_assessment_submissions (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  dominant_color text not null check (dominant_color = any (array['yellow', 'red', 'green', 'blue'])),
  scores jsonb not null default '{}'::jsonb,
  result_payload jsonb not null default '{}'::jsonb,
  email_sent_at timestamptz,
  email_error text,
  created_at timestamptz not null default now()
);

create index if not exists free_assessment_submissions_created_at_idx
on public.free_assessment_submissions (created_at desc);

create index if not exists free_assessment_submissions_email_idx
on public.free_assessment_submissions (lower(email));

create index if not exists free_assessment_submissions_dominant_color_idx
on public.free_assessment_submissions (dominant_color);

alter table public.free_assessment_submissions enable row level security;

drop policy if exists "service role manages free assessment submissions" on public.free_assessment_submissions;
create policy "service role manages free assessment submissions"
on public.free_assessment_submissions
as permissive
for all
to service_role
using (true)
with check (true);

drop policy if exists "super admins can read free assessment submissions" on public.free_assessment_submissions;
create policy "super admins can read free assessment submissions"
on public.free_assessment_submissions
as permissive
for select
to authenticated
using (public.is_super_admin(auth.uid()));
