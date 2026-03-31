create or replace function public.list_auth_sessions(p_target_user_id uuid)
returns table (
  id uuid,
  user_id uuid,
  created_at timestamptz,
  updated_at timestamptz,
  ip text,
  user_agent text
)
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if current_setting('request.jwt.claim.role', true) <> 'service_role' then
    raise exception 'Forbidden';
  end if;

  return query
  select
    s.id,
    s.user_id,
    s.created_at,
    s.updated_at,
    s.ip::text,
    s.user_agent
  from auth.sessions s
  where s.user_id = p_target_user_id
  order by s.updated_at desc nulls last, s.created_at desc nulls last;
end;
$$;

create or replace function public.revoke_auth_sessions(
  p_target_user_id uuid,
  p_session_id uuid default null
)
returns integer
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  deleted_count integer := 0;
begin
  if current_setting('request.jwt.claim.role', true) <> 'service_role' then
    raise exception 'Forbidden';
  end if;

  if p_session_id is null then
    delete from auth.sessions
    where user_id = p_target_user_id;
  else
    delete from auth.sessions
    where user_id = p_target_user_id
      and id = p_session_id;
  end if;

  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

revoke all on function public.list_auth_sessions(uuid) from public, anon, authenticated;
revoke all on function public.revoke_auth_sessions(uuid, uuid) from public, anon, authenticated;

grant execute on function public.list_auth_sessions(uuid) to service_role;
grant execute on function public.revoke_auth_sessions(uuid, uuid) to service_role;
