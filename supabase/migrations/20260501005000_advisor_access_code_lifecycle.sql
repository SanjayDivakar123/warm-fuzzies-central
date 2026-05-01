alter table public.advisors
  add column if not exists active_access_code text,
  add column if not exists access_code_status text not null default 'inactive'
    check (access_code_status in ('inactive', 'active', 'used')),
  add column if not exists access_code_generated_at timestamptz,
  add column if not exists access_code_used_at timestamptz;

with latest_page_codes as (
  select distinct on (advisor_id)
    advisor_id,
    access_code
  from public.advisor_landing_pages
  where access_code is not null and access_code <> ''
  order by advisor_id, updated_at desc, created_at desc
)
update public.advisors a
set
  active_access_code = lpc.access_code,
  access_code_status = 'active',
  access_code_generated_at = coalesce(a.access_code_generated_at, now()),
  access_code_used_at = null
from latest_page_codes lpc
where a.id = lpc.advisor_id
  and (a.active_access_code is null or a.active_access_code = '');
