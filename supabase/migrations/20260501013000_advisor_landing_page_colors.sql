alter table public.advisor_landing_pages
  add column if not exists primary_color text not null default '#0f172a',
  add column if not exists secondary_color text not null default '#1e293b';
