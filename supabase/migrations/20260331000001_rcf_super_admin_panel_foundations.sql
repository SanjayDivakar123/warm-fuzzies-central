create extension if not exists pgcrypto;

create or replace function public.is_super_admin(uid uuid default auth.uid())
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  lookup_email text;
begin
  if uid is null then
    return false;
  end if;

  select lower(email) into lookup_email
  from auth.users
  where id = uid;

  if lookup_email is null then
    return false;
  end if;

  return exists (
    select 1
    from public.platform_super_admins psa
    where lower(psa.email) = lookup_email
  );
end;
$$;

create table if not exists public.admin_action_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  actor_email text,
  action_type text not null,
  target_type text,
  target_id uuid,
  target_label text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists admin_action_logs_created_at_idx on public.admin_action_logs (created_at desc);
create index if not exists admin_action_logs_action_type_idx on public.admin_action_logs (action_type);
create index if not exists admin_action_logs_actor_email_idx on public.admin_action_logs (lower(actor_email));

create table if not exists public.platform_settings (
  key text primary key,
  value jsonb not null default 'null'::jsonb,
  updated_at timestamptz not null default now()
);

insert into public.platform_settings (key, value)
values
  ('require_2fa_super_admins', 'false'::jsonb),
  ('on_call_engineer', 'null'::jsonb)
on conflict (key) do nothing;

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text,
  audience text not null default 'all',
  company_id uuid references public.companies(id) on delete cascade,
  scheduled_at timestamptz,
  is_active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists announcements_company_id_idx on public.announcements (company_id);
create index if not exists announcements_scheduled_at_idx on public.announcements (scheduled_at);

create table if not exists public.contact_replies (
  id uuid primary key default gen_random_uuid(),
  contact_query_id uuid not null references public.contact_queries(id) on delete cascade,
  body text not null,
  sent_via text not null default 'draft',
  sent_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists contact_replies_contact_query_id_idx on public.contact_replies (contact_query_id);

create table if not exists public.platform_errors (
  id uuid primary key default gen_random_uuid(),
  message text not null,
  context jsonb not null default '{}'::jsonb,
  severity int not null default 1,
  resolved_at timestamptz,
  resolved_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.incidents (
  id uuid primary key default gen_random_uuid(),
  code int not null,
  description text not null,
  status text not null default 'open',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.companies
  add column if not exists plan_tier text not null default 'free',
  add column if not exists archived_at timestamptz,
  add column if not exists require_2fa boolean not null default false,
  add column if not exists notes text;

alter table public.contact_queries
  add column if not exists assigned_to uuid references auth.users(id) on delete set null,
  add column if not exists replied_at timestamptz,
  add column if not exists reply_status text not null default 'pending';

alter table public.client_proposals
  add column if not exists version int not null default 1,
  add column if not exists parent_proposal_id uuid references public.client_proposals(id) on delete set null,
  add column if not exists linked_company_id uuid references public.companies(id) on delete set null,
  add column if not exists viewed_at timestamptz,
  add column if not exists accepted_at timestamptz;

create index if not exists client_proposals_parent_proposal_id_idx on public.client_proposals (parent_proposal_id);
create index if not exists client_proposals_linked_company_id_idx on public.client_proposals (linked_company_id);

create or replace function public.log_admin_action(
  p_actor_id uuid,
  p_actor_email text,
  p_action_type text,
  p_target_type text default null,
  p_target_id uuid default null,
  p_target_label text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted_id uuid;
begin
  insert into public.admin_action_logs (
    actor_id,
    actor_email,
    action_type,
    target_type,
    target_id,
    target_label,
    metadata
  )
  values (
    p_actor_id,
    lower(p_actor_email),
    p_action_type,
    p_target_type,
    p_target_id,
    p_target_label,
    coalesce(p_metadata, '{}'::jsonb)
  )
  returning id into inserted_id;

  return inserted_id;
end;
$$;

create or replace function public.get_admin_action_logs(
  p_action_type text default null,
  p_actor_email text default null,
  p_date_from timestamptz default null,
  p_date_to timestamptz default null,
  p_page int default 1,
  p_page_size int default 25
)
returns table (
  id uuid,
  actor_id uuid,
  actor_email text,
  action_type text,
  target_type text,
  target_id uuid,
  target_label text,
  metadata jsonb,
  created_at timestamptz,
  total_count bigint
)
language sql
security definer
set search_path = public
as $$
  with filtered as (
    select *
    from public.admin_action_logs
    where (p_action_type is null or action_type = p_action_type)
      and (p_actor_email is null or lower(actor_email) = lower(p_actor_email))
      and (p_date_from is null or created_at >= p_date_from)
      and (p_date_to is null or created_at <= p_date_to)
  )
  select
    id,
    actor_id,
    actor_email,
    action_type,
    target_type,
    target_id,
    target_label,
    metadata,
    created_at,
    count(*) over() as total_count
  from filtered
  order by created_at desc
  offset greatest(coalesce(p_page, 1) - 1, 0) * greatest(coalesce(p_page_size, 25), 1)
  limit greatest(coalesce(p_page_size, 25), 1);
$$;

create or replace function public.get_rolecolor_distribution(p_company_id uuid default null)
returns table (
  role_color text,
  total bigint
)
language sql
security definer
set search_path = public
as $$
  with source_rows as (
    select
      coalesce(
        nullif(assessment_results.results ->> 'dominantColor', ''),
        nullif(assessment_results.results ->> 'primaryColor', ''),
        nullif(assessment_results.results ->> 'role_color', '')
      ) as role_color
    from public.assessment_results
    left join public.company_users on company_users.assessment_result_id = assessment_results.id
    where (
      p_company_id is null
      or company_users.company_id = p_company_id
    )
  )
  select role_color, count(*)
  from source_rows
  where role_color is not null
  group by role_color
  order by count(*) desc;
$$;

create or replace function public.get_admin_assessment_funnel()
returns table (
  total_started bigint,
  total_completed bigint,
  completion_rate numeric,
  question_25_count bigint,
  question_50_count bigint
)
language sql
security definer
set search_path = public
as $$
  with rows as (
    select
      assessment_type,
      case
        when coalesce(assessment_results.results ->> 'dominantColor', assessment_results.results ->> 'primaryColor', '') <> '' then true
        else false
      end as is_completed
    from public.assessment_results
  )
  select
    count(*)::bigint as total_started,
    count(*) filter (where is_completed)::bigint as total_completed,
    case when count(*) = 0 then 0 else round((count(*) filter (where is_completed)::numeric / count(*)::numeric) * 100, 2) end as completion_rate,
    count(*) filter (where assessment_type = '25q')::bigint as question_25_count,
    count(*) filter (where assessment_type = '50q')::bigint as question_50_count
  from rows;
$$;

create or replace function public.get_company_creation_cohorts()
returns table (
  week_start date,
  new_companies bigint,
  active_companies bigint,
  dormant_companies bigint
)
language sql
security definer
set search_path = public
as $$
  with weeks as (
    select generate_series(
      date_trunc('week', now())::date - interval '11 weeks',
      date_trunc('week', now())::date,
      interval '1 week'
    )::date as week_start
  ),
  company_weeks as (
    select
      date_trunc('week', companies.created_at)::date as week_start,
      count(*)::bigint as new_companies
    from public.companies
    group by 1
  ),
  company_activity as (
    select
      companies.id,
      exists (
        select 1
        from public.company_users
        join public.assessment_results on assessment_results.id = company_users.assessment_result_id
        where company_users.company_id = companies.id
          and assessment_results.created_at >= now() - interval '30 days'
      ) as is_active
    from public.companies
  )
  select
    weeks.week_start,
    coalesce(company_weeks.new_companies, 0) as new_companies,
    count(*) filter (where company_activity.is_active)::bigint as active_companies,
    count(*) filter (where not company_activity.is_active)::bigint as dormant_companies
  from weeks
  left join company_weeks on company_weeks.week_start = weeks.week_start
  left join public.companies on date_trunc('week', public.companies.created_at)::date <= weeks.week_start
  left join company_activity on company_activity.id = public.companies.id
  group by weeks.week_start, company_weeks.new_companies
  order by weeks.week_start asc;
$$;

alter table public.admin_action_logs enable row level security;
alter table public.platform_settings enable row level security;
alter table public.announcements enable row level security;
alter table public.contact_replies enable row level security;
alter table public.platform_errors enable row level security;
alter table public.incidents enable row level security;

drop policy if exists "service role manages admin action logs" on public.admin_action_logs;
create policy "service role manages admin action logs"
on public.admin_action_logs
as permissive
for all
to service_role
using (true)
with check (true);

drop policy if exists "super admins can read admin action logs" on public.admin_action_logs;
create policy "super admins can read admin action logs"
on public.admin_action_logs
as permissive
for select
to authenticated
using (public.is_super_admin(auth.uid()));

drop policy if exists "service role manages platform settings" on public.platform_settings;
create policy "service role manages platform settings"
on public.platform_settings
as permissive
for all
to service_role
using (true)
with check (true);

drop policy if exists "super admins can read platform settings" on public.platform_settings;
create policy "super admins can read platform settings"
on public.platform_settings
as permissive
for select
to authenticated
using (public.is_super_admin(auth.uid()));

drop policy if exists "service role manages announcements" on public.announcements;
create policy "service role manages announcements"
on public.announcements
as permissive
for all
to service_role
using (true)
with check (true);

drop policy if exists "super admins can read announcements" on public.announcements;
create policy "super admins can read announcements"
on public.announcements
as permissive
for select
to authenticated
using (public.is_super_admin(auth.uid()));

drop policy if exists "service role manages contact replies" on public.contact_replies;
create policy "service role manages contact replies"
on public.contact_replies
as permissive
for all
to service_role
using (true)
with check (true);

drop policy if exists "super admins can read contact replies" on public.contact_replies;
create policy "super admins can read contact replies"
on public.contact_replies
as permissive
for select
to authenticated
using (public.is_super_admin(auth.uid()));

drop policy if exists "service role manages platform errors" on public.platform_errors;
create policy "service role manages platform errors"
on public.platform_errors
as permissive
for all
to service_role
using (true)
with check (true);

drop policy if exists "super admins can read platform errors" on public.platform_errors;
create policy "super admins can read platform errors"
on public.platform_errors
as permissive
for select
to authenticated
using (public.is_super_admin(auth.uid()));

drop policy if exists "service role manages incidents" on public.incidents;
create policy "service role manages incidents"
on public.incidents
as permissive
for all
to service_role
using (true)
with check (true);

drop policy if exists "super admins can read incidents" on public.incidents;
create policy "super admins can read incidents"
on public.incidents
as permissive
for select
to authenticated
using (public.is_super_admin(auth.uid()));
