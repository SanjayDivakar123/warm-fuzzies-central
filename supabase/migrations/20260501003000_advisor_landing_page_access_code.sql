alter table public.advisor_landing_pages
  add column if not exists access_code text;

update public.advisor_landing_pages
set access_code = coalesce(nullif(access_code, ''), substring(md5(id::text) from 1 for 6))
where access_code is null or access_code = '';
