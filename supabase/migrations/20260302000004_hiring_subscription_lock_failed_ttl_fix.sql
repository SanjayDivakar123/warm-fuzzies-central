-- Keep failed lock rows until expiry so near-simultaneous duplicate requests
-- cannot immediately re-acquire the lock after the first request fails.
CREATE OR REPLACE FUNCTION public.acquire_hiring_subscription_lock(
  p_company_id UUID,
  p_request_id TEXT,
  p_ttl_seconds INTEGER DEFAULT 120
)
RETURNS TABLE (
  acquired BOOLEAN,
  current_request_id TEXT,
  current_status TEXT,
  current_expires_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now TIMESTAMPTZ := now();
  v_expires TIMESTAMPTZ := v_now + make_interval(secs => GREATEST(p_ttl_seconds, 30));
  v_row public.hiring_subscription_request_locks%ROWTYPE;
BEGIN
  INSERT INTO public.hiring_subscription_request_locks (
    company_id,
    request_id,
    status,
    started_at,
    updated_at,
    expires_at,
    last_error
  )
  VALUES (
    p_company_id,
    p_request_id,
    'processing',
    v_now,
    v_now,
    v_expires,
    NULL
  )
  ON CONFLICT (company_id) DO UPDATE
    SET request_id = EXCLUDED.request_id,
        status = 'processing',
        started_at = CASE
          WHEN public.hiring_subscription_request_locks.request_id = EXCLUDED.request_id
            THEN public.hiring_subscription_request_locks.started_at
          ELSE EXCLUDED.started_at
        END,
        updated_at = EXCLUDED.updated_at,
        expires_at = EXCLUDED.expires_at,
        subscription_id = CASE
          WHEN public.hiring_subscription_request_locks.request_id = EXCLUDED.request_id
            THEN public.hiring_subscription_request_locks.subscription_id
          ELSE NULL
        END,
        payment_intent_id = CASE
          WHEN public.hiring_subscription_request_locks.request_id = EXCLUDED.request_id
            THEN public.hiring_subscription_request_locks.payment_intent_id
          ELSE NULL
        END,
        last_error = NULL
  WHERE
    public.hiring_subscription_request_locks.request_id = EXCLUDED.request_id
    OR public.hiring_subscription_request_locks.expires_at <= v_now
  RETURNING * INTO v_row;

  IF FOUND THEN
    RETURN QUERY SELECT TRUE, v_row.request_id, v_row.status, v_row.expires_at;
    RETURN;
  END IF;

  SELECT *
  INTO v_row
  FROM public.hiring_subscription_request_locks
  WHERE company_id = p_company_id;

  RETURN QUERY
  SELECT
    FALSE,
    COALESCE(v_row.request_id, ''),
    COALESCE(v_row.status, 'processing'),
    v_row.expires_at;
END;
$$;
