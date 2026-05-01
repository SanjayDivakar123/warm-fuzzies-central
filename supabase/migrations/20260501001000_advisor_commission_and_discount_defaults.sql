alter table public.advisor_landing_pages
  add column if not exists commission_percent integer not null default 30
  check (commission_percent >= 0 and commission_percent <= 100);

alter table public.advisor_landing_pages
  alter column discount_percent set default 15;

alter table public.advisor_landing_submissions
  add column if not exists commission_percent integer not null default 30
  check (commission_percent >= 0 and commission_percent <= 100);

alter table public.advisor_landing_submissions
  alter column discount_percent set default 15;

update public.advisor_landing_pages
set discount_percent = 15
where discount_percent = 30;

update public.advisor_landing_submissions
set discount_percent = 15
where discount_percent = 30;
