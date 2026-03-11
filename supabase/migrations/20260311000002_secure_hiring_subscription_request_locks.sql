-- Security hardening for server-only subscription lock table.
-- This table is used by Edge Functions and should not be client-accessible.

ALTER TABLE public.hiring_subscription_request_locks ENABLE ROW LEVEL SECURITY;

-- Deny direct table access from client-facing roles.
REVOKE ALL ON TABLE public.hiring_subscription_request_locks FROM anon, authenticated;

-- Deny direct client execution of the lock RPC.
REVOKE ALL ON FUNCTION public.acquire_hiring_subscription_lock(UUID, TEXT, INTEGER) FROM anon, authenticated;
