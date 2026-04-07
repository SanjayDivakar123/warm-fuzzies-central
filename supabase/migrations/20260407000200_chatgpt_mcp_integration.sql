CREATE TABLE IF NOT EXISTS public.chatgpt_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  connected_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  org_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  connection_type TEXT NOT NULL,
  openai_user_id TEXT,
  access_token TEXT NOT NULL DEFAULT '',
  access_token_hash TEXT NOT NULL DEFAULT '',
  refresh_token TEXT,
  refresh_token_hash TEXT,
  token_expires_at TIMESTAMPTZ,
  scopes_granted TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  enabled_tools TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  auto_inject_context BOOLEAN NOT NULL DEFAULT true,
  share_profile BOOLEAN NOT NULL DEFAULT true,
  include_teammates BOOLEAN NOT NULL DEFAULT false,
  last_sync_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'chatgpt_connections_connection_type_check'
      AND conrelid = 'public.chatgpt_connections'::regclass
  ) THEN
    ALTER TABLE public.chatgpt_connections
      ADD CONSTRAINT chatgpt_connections_connection_type_check
      CHECK (connection_type IN ('personal', 'b2b'));
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'chatgpt_connections_scope_check'
      AND conrelid = 'public.chatgpt_connections'::regclass
  ) THEN
    ALTER TABLE public.chatgpt_connections
      ADD CONSTRAINT chatgpt_connections_scope_check
      CHECK (
        (connection_type = 'personal' AND user_id IS NOT NULL AND org_id IS NULL)
        OR
        (connection_type = 'b2b' AND org_id IS NOT NULL)
      );
  END IF;
END
$$;

CREATE UNIQUE INDEX IF NOT EXISTS chatgpt_connections_access_token_hash_idx
  ON public.chatgpt_connections(access_token_hash)
  WHERE access_token_hash <> '';

CREATE UNIQUE INDEX IF NOT EXISTS chatgpt_connections_active_personal_idx
  ON public.chatgpt_connections(user_id, connection_type)
  WHERE connection_type = 'personal' AND is_active = true;

CREATE UNIQUE INDEX IF NOT EXISTS chatgpt_connections_active_b2b_idx
  ON public.chatgpt_connections(org_id, connection_type)
  WHERE connection_type = 'b2b' AND is_active = true;

CREATE INDEX IF NOT EXISTS chatgpt_connections_active_org_idx
  ON public.chatgpt_connections(org_id, is_active, updated_at DESC);

CREATE INDEX IF NOT EXISTS chatgpt_connections_active_user_idx
  ON public.chatgpt_connections(user_id, is_active, updated_at DESC);

CREATE TABLE IF NOT EXISTS public.chatgpt_tool_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES public.chatgpt_connections(id) ON DELETE CASCADE,
  tool_name TEXT NOT NULL,
  input_params JSONB NOT NULL DEFAULT '{}'::JSONB,
  response_summary TEXT,
  latency_ms INTEGER,
  is_error BOOLEAN NOT NULL DEFAULT false,
  error_message TEXT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS chatgpt_tool_calls_connection_time_idx
  ON public.chatgpt_tool_calls(connection_id, occurred_at DESC);

CREATE INDEX IF NOT EXISTS chatgpt_tool_calls_error_idx
  ON public.chatgpt_tool_calls(connection_id, is_error, occurred_at DESC);

CREATE TABLE IF NOT EXISTS public.chatgpt_oauth_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state_token TEXT NOT NULL UNIQUE,
  connection_type TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  connected_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  org_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  requested_scopes TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  redirect_uri TEXT,
  resource TEXT,
  client_id TEXT,
  code TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '15 minutes'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'chatgpt_oauth_states_connection_type_check'
      AND conrelid = 'public.chatgpt_oauth_states'::regclass
  ) THEN
    ALTER TABLE public.chatgpt_oauth_states
      ADD CONSTRAINT chatgpt_oauth_states_connection_type_check
      CHECK (connection_type IN ('personal', 'b2b'));
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'chatgpt_oauth_states_status_check'
      AND conrelid = 'public.chatgpt_oauth_states'::regclass
  ) THEN
    ALTER TABLE public.chatgpt_oauth_states
      ADD CONSTRAINT chatgpt_oauth_states_status_check
      CHECK (status IN ('pending', 'approved', 'consumed', 'expired', 'cancelled'));
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'chatgpt_oauth_states_scope_check'
      AND conrelid = 'public.chatgpt_oauth_states'::regclass
  ) THEN
    ALTER TABLE public.chatgpt_oauth_states
      ADD CONSTRAINT chatgpt_oauth_states_scope_check
      CHECK (
        (connection_type = 'personal' AND user_id IS NOT NULL AND org_id IS NULL)
        OR
        (connection_type = 'b2b' AND org_id IS NOT NULL)
      );
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS chatgpt_oauth_states_status_idx
  ON public.chatgpt_oauth_states(status, expires_at DESC);

ALTER TABLE public.chatgpt_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chatgpt_tool_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chatgpt_oauth_states ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role manages chatgpt connections" ON public.chatgpt_connections;
CREATE POLICY "Service role manages chatgpt connections"
ON public.chatgpt_connections
FOR ALL
USING ((auth.jwt() ->> 'role') = 'service_role')
WITH CHECK ((auth.jwt() ->> 'role') = 'service_role');

DROP POLICY IF EXISTS "Service role manages chatgpt tool calls" ON public.chatgpt_tool_calls;
CREATE POLICY "Service role manages chatgpt tool calls"
ON public.chatgpt_tool_calls
FOR ALL
USING ((auth.jwt() ->> 'role') = 'service_role')
WITH CHECK ((auth.jwt() ->> 'role') = 'service_role');

DROP POLICY IF EXISTS "Service role manages chatgpt oauth states" ON public.chatgpt_oauth_states;
CREATE POLICY "Service role manages chatgpt oauth states"
ON public.chatgpt_oauth_states
FOR ALL
USING ((auth.jwt() ->> 'role') = 'service_role')
WITH CHECK ((auth.jwt() ->> 'role') = 'service_role');

REVOKE ALL ON TABLE public.chatgpt_connections FROM anon, authenticated;
REVOKE ALL ON TABLE public.chatgpt_tool_calls FROM anon, authenticated;
REVOKE ALL ON TABLE public.chatgpt_oauth_states FROM anon, authenticated;

DROP TRIGGER IF EXISTS update_chatgpt_connections_updated_at ON public.chatgpt_connections;
CREATE TRIGGER update_chatgpt_connections_updated_at
  BEFORE UPDATE ON public.chatgpt_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_chatgpt_oauth_states_updated_at ON public.chatgpt_oauth_states;
CREATE TRIGGER update_chatgpt_oauth_states_updated_at
  BEFORE UPDATE ON public.chatgpt_oauth_states
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
