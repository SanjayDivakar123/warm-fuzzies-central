alter table public.advisor_landing_submissions
  add column if not exists guest_user_id uuid references auth.users(id) on delete set null;

create index if not exists advisor_landing_submissions_guest_user_id_idx
  on public.advisor_landing_submissions (guest_user_id);
