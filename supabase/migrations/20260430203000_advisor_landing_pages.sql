create extension if not exists pgcrypto with schema extensions;

create table if not exists public.advisors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  name text not null,
  email text not null,
  company_name text,
  stripe_connect_account_id text,
  stripe_connect_account_type text not null default 'standard',
  stripe_connect_status text not null default 'not_started',
  charges_enabled boolean not null default false,
  payouts_enabled boolean not null default false,
  details_submitted boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_by_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists advisors_email_unique_idx
  on public.advisors (lower(email));

create unique index if not exists advisors_user_id_unique_idx
  on public.advisors (user_id)
  where user_id is not null;

create unique index if not exists advisors_stripe_connect_account_id_unique_idx
  on public.advisors (stripe_connect_account_id)
  where stripe_connect_account_id is not null;

create table if not exists public.advisor_landing_pages (
  id uuid primary key default gen_random_uuid(),
  advisor_id uuid not null references public.advisors(id) on delete cascade,
  title text not null,
  slug text not null,
  assessment_type text not null check (assessment_type in ('premium', 'pro')),
  discount_percent integer not null default 30 check (discount_percent >= 0 and discount_percent <= 100),
  is_active boolean not null default false,
  hero_headline text,
  hero_subheadline text,
  created_by uuid references auth.users(id) on delete set null,
  created_by_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists advisor_landing_pages_slug_unique_idx
  on public.advisor_landing_pages (lower(slug));

create index if not exists advisor_landing_pages_advisor_id_idx
  on public.advisor_landing_pages (advisor_id);

create table if not exists public.advisor_landing_submissions (
  id uuid primary key default gen_random_uuid(),
  landing_page_id uuid not null references public.advisor_landing_pages(id) on delete cascade,
  advisor_id uuid not null references public.advisors(id) on delete cascade,
  guest_name text not null,
  guest_email text not null,
  assessment_type text not null check (assessment_type in ('premium', 'pro')),
  status text not null default 'checkout_started'
    check (status in ('checkout_started', 'paid', 'assessment_started', 'completed', 'payment_failed', 'cancelled')),
  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  currency text not null default 'usd',
  original_amount_minor integer not null default 0,
  discounted_amount_minor integer not null default 0,
  discount_percent integer not null default 30,
  assessment_token text not null default encode(extensions.gen_random_bytes(32), 'hex'),
  guest_result_token text not null default encode(extensions.gen_random_bytes(32), 'hex'),
  results jsonb,
  result_summary jsonb,
  completed_at timestamptz,
  advisor_notified_at timestamptz,
  guest_notified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists advisor_landing_submissions_assessment_token_unique_idx
  on public.advisor_landing_submissions (assessment_token);

create unique index if not exists advisor_landing_submissions_guest_result_token_unique_idx
  on public.advisor_landing_submissions (guest_result_token);

create unique index if not exists advisor_landing_submissions_checkout_session_unique_idx
  on public.advisor_landing_submissions (stripe_checkout_session_id)
  where stripe_checkout_session_id is not null;

create index if not exists advisor_landing_submissions_advisor_id_idx
  on public.advisor_landing_submissions (advisor_id, created_at desc);

create index if not exists advisor_landing_submissions_landing_page_id_idx
  on public.advisor_landing_submissions (landing_page_id, created_at desc);

create table if not exists public.advisor_commissions (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.advisor_landing_submissions(id) on delete cascade,
  advisor_id uuid not null references public.advisors(id) on delete cascade,
  currency text not null default 'usd',
  payment_amount_minor integer not null,
  commission_rate numeric(5, 4) not null default 0.15,
  commission_amount_minor integer not null,
  stripe_connect_account_id text,
  stripe_transfer_id text,
  status text not null default 'pending'
    check (status in ('pending', 'held', 'transfer_created', 'paid', 'failed', 'cancelled')),
  failure_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists advisor_commissions_submission_unique_idx
  on public.advisor_commissions (submission_id);

create index if not exists advisor_commissions_advisor_id_idx
  on public.advisor_commissions (advisor_id, created_at desc);

create or replace function public.is_platform_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.platform_super_admins psa
    where lower(psa.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
       or psa.user_id = auth.uid()
  );
$$;

create or replace function public.is_advisor_user(_advisor_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.advisors a
    where a.id = _advisor_id
      and a.user_id = auth.uid()
  );
$$;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists advisors_touch_updated_at on public.advisors;
create trigger advisors_touch_updated_at
before update on public.advisors
for each row execute function public.touch_updated_at();

drop trigger if exists advisor_landing_pages_touch_updated_at on public.advisor_landing_pages;
create trigger advisor_landing_pages_touch_updated_at
before update on public.advisor_landing_pages
for each row execute function public.touch_updated_at();

drop trigger if exists advisor_landing_submissions_touch_updated_at on public.advisor_landing_submissions;
create trigger advisor_landing_submissions_touch_updated_at
before update on public.advisor_landing_submissions
for each row execute function public.touch_updated_at();

drop trigger if exists advisor_commissions_touch_updated_at on public.advisor_commissions;
create trigger advisor_commissions_touch_updated_at
before update on public.advisor_commissions
for each row execute function public.touch_updated_at();

alter table public.advisors enable row level security;
alter table public.advisor_landing_pages enable row level security;
alter table public.advisor_landing_submissions enable row level security;
alter table public.advisor_commissions enable row level security;

drop policy if exists "service role manages advisors" on public.advisors;
create policy "service role manages advisors"
on public.advisors for all to service_role
using (true) with check (true);

drop policy if exists "super admins manage advisors" on public.advisors;
create policy "super admins manage advisors"
on public.advisors for all to authenticated
using (public.is_platform_super_admin())
with check (public.is_platform_super_admin());

drop policy if exists "advisors view own profile" on public.advisors;
create policy "advisors view own profile"
on public.advisors for select to authenticated
using (user_id = auth.uid());

drop policy if exists "service role manages advisor landing pages" on public.advisor_landing_pages;
create policy "service role manages advisor landing pages"
on public.advisor_landing_pages for all to service_role
using (true) with check (true);

drop policy if exists "super admins manage advisor landing pages" on public.advisor_landing_pages;
create policy "super admins manage advisor landing pages"
on public.advisor_landing_pages for all to authenticated
using (public.is_platform_super_admin())
with check (public.is_platform_super_admin());

drop policy if exists "advisors view own landing pages" on public.advisor_landing_pages;
create policy "advisors view own landing pages"
on public.advisor_landing_pages for select to authenticated
using (public.is_advisor_user(advisor_id));

drop policy if exists "public reads active advisor landing pages" on public.advisor_landing_pages;
create policy "public reads active advisor landing pages"
on public.advisor_landing_pages for select to anon, authenticated
using (is_active = true);

drop policy if exists "service role manages advisor submissions" on public.advisor_landing_submissions;
create policy "service role manages advisor submissions"
on public.advisor_landing_submissions for all to service_role
using (true) with check (true);

drop policy if exists "super admins manage advisor submissions" on public.advisor_landing_submissions;
create policy "super admins manage advisor submissions"
on public.advisor_landing_submissions for all to authenticated
using (public.is_platform_super_admin())
with check (public.is_platform_super_admin());

drop policy if exists "advisors view own submissions" on public.advisor_landing_submissions;
create policy "advisors view own submissions"
on public.advisor_landing_submissions for select to authenticated
using (public.is_advisor_user(advisor_id));

drop policy if exists "service role manages advisor commissions" on public.advisor_commissions;
create policy "service role manages advisor commissions"
on public.advisor_commissions for all to service_role
using (true) with check (true);

drop policy if exists "super admins manage advisor commissions" on public.advisor_commissions;
create policy "super admins manage advisor commissions"
on public.advisor_commissions for all to authenticated
using (public.is_platform_super_admin())
with check (public.is_platform_super_admin());

drop policy if exists "advisors view own commissions" on public.advisor_commissions;
create policy "advisors view own commissions"
on public.advisor_commissions for select to authenticated
using (public.is_advisor_user(advisor_id));
