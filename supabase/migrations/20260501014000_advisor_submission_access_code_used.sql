alter table public.advisor_landing_submissions
  add column if not exists access_code_used text;
