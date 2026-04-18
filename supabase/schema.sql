create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists tenants (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  company_name text not null,
  owner_email text not null,
  plan text not null default 'starter',
  status text not null default 'active',
  stripe_customer_id text,
  icp_description text,
  brand_voice text,
  platform_name text not null default 'OutreachOS'
);

alter table tenants add column if not exists calendly_url text;

create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  tenant_id uuid references tenants(id) on delete cascade,
  name text,
  title text,
  company text,
  email text,
  linkedin_url text,
  source text,
  icp_score integer,
  personalization_hook text,
  status text not null default 'new',
  assigned_agent text,
  notes text
);

create table if not exists outreach_log (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  lead_id uuid references leads(id) on delete cascade,
  tenant_id uuid references tenants(id) on delete cascade,
  channel text,
  subject text,
  body text,
  sent_by text,
  opened boolean not null default false,
  replied boolean not null default false,
  touch_number integer,
  ab_variant text
);

create table if not exists replies (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  lead_id uuid references leads(id) on delete cascade,
  tenant_id uuid references tenants(id) on delete cascade,
  raw_text text,
  classified_intent text,
  handled boolean not null default false,
  handled_by text,
  response_sent text
);

create table if not exists meetings (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  lead_id uuid references leads(id) on delete cascade,
  tenant_id uuid references tenants(id) on delete cascade,
  scheduled_at timestamptz,
  status text not null default 'scheduled',
  notes text
);

create table if not exists proposals (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  lead_id uuid references leads(id) on delete cascade,
  tenant_id uuid references tenants(id) on delete cascade,
  proposal_url text,
  sent_at timestamptz,
  opened_at timestamptz,
  status text not null default 'sent'
);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  lead_id uuid references leads(id) on delete cascade,
  tenant_id uuid references tenants(id) on delete cascade,
  stripe_session_id text,
  amount integer,
  currency text not null default 'usd',
  status text not null default 'pending',
  access_provisioned boolean not null default false
);

create table if not exists suppression (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  reason text,
  created_at timestamptz not null default now()
);

create table if not exists agent_log (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  agent_name text,
  action text,
  tenant_id uuid references tenants(id) on delete cascade,
  lead_id uuid,
  result text,
  error text
);

create table if not exists daily_reports (
  id uuid primary key default gen_random_uuid(),
  date date not null default current_date,
  tenant_id uuid references tenants(id) on delete cascade,
  leads_found integer not null default 0,
  emails_sent integer not null default 0,
  replies_received integer not null default 0,
  meetings_booked integer not null default 0,
  deals_closed integer not null default 0,
  revenue integer not null default 0,
  summary text,
  delivered boolean not null default false
);

create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  tenant_id uuid references tenants(id) on delete set null,
  name text not null,
  contact_email text,
  contact_name text,
  stripe_session_id text,
  status text not null default 'active',
  plan text,
  created_by text
);

create table if not exists inboxes (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  tenant_id uuid references tenants(id) on delete cascade,
  display_name text,
  credentials jsonb,
  linkedin_storage_state jsonb,
  active boolean not null default true,
  warmup_phase integer not null default 1,
  daily_cold_limit integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists leads_tenant_id_idx on leads(tenant_id);
create index if not exists outreach_log_tenant_id_idx on outreach_log(tenant_id);
create index if not exists replies_tenant_id_idx on replies(tenant_id);
create index if not exists meetings_tenant_id_idx on meetings(tenant_id);
create index if not exists proposals_tenant_id_idx on proposals(tenant_id);
create index if not exists payments_tenant_id_idx on payments(tenant_id);
create index if not exists inboxes_tenant_id_idx on inboxes(tenant_id);
create index if not exists agent_log_tenant_id_idx on agent_log(tenant_id);
create unique index if not exists daily_reports_unique_tenant_date_idx on daily_reports(tenant_id, date);

alter table tenants enable row level security;
alter table leads enable row level security;
alter table outreach_log enable row level security;
alter table replies enable row level security;
alter table meetings enable row level security;
alter table proposals enable row level security;
alter table payments enable row level security;
alter table inboxes enable row level security;
alter table agent_log enable row level security;
alter table daily_reports enable row level security;

drop policy if exists "Tenants see own tenant row" on tenants;
create policy "Tenants see own tenant row" on tenants
for all using (id::text = auth.jwt() ->> 'tenant_id');

drop policy if exists "Tenants see own leads" on leads;
create policy "Tenants see own leads" on leads
for all using (tenant_id::text = auth.jwt() ->> 'tenant_id');

drop policy if exists "Tenants see own outreach" on outreach_log;
create policy "Tenants see own outreach" on outreach_log
for all using (tenant_id::text = auth.jwt() ->> 'tenant_id');

drop policy if exists "Tenants see own replies" on replies;
create policy "Tenants see own replies" on replies
for all using (tenant_id::text = auth.jwt() ->> 'tenant_id');

drop policy if exists "Tenants see own meetings" on meetings;
create policy "Tenants see own meetings" on meetings
for all using (tenant_id::text = auth.jwt() ->> 'tenant_id');

drop policy if exists "Tenants see own proposals" on proposals;
create policy "Tenants see own proposals" on proposals
for all using (tenant_id::text = auth.jwt() ->> 'tenant_id');

drop policy if exists "Tenants see own payments" on payments;
create policy "Tenants see own payments" on payments
for all using (tenant_id::text = auth.jwt() ->> 'tenant_id');

drop policy if exists "Tenants see own inboxes" on inboxes;
create policy "Tenants see own inboxes" on inboxes
for all using (tenant_id::text = auth.jwt() ->> 'tenant_id');

drop policy if exists "Tenants see own agent logs" on agent_log;
create policy "Tenants see own agent logs" on agent_log
for all using (tenant_id::text = auth.jwt() ->> 'tenant_id');

drop policy if exists "Tenants see own daily reports" on daily_reports;
create policy "Tenants see own daily reports" on daily_reports
for all using (tenant_id::text = auth.jwt() ->> 'tenant_id');

drop trigger if exists set_leads_updated_at on leads;
create trigger set_leads_updated_at
before update on leads
for each row
execute procedure public.set_updated_at();
