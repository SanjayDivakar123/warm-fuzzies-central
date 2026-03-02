-- Prevent duplicate hiring subscription charge attempts by enforcing
-- one in-flight request per company at the database layer.
CREATE TABLE IF NOT EXISTS public.hiring_subscription_request_locks (
  company_id UUID PRIMARY KEY REFERENCES public.companies(id) ON DELETE CASCADE,
  request_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  subscription_id TEXT,
  payment_intent_id TEXT,
  last_error TEXT
);

CREATE INDEX IF NOT EXISTS idx_hiring_subscription_request_locks_expires_at
  ON public.hiring_subscription_request_locks (expires_at);

CREATE INDEX IF NOT EXISTS idx_hiring_subscription_request_locks_request_id
  ON public.hiring_subscription_request_locks (request_id);

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
    OR public.hiring_subscription_request_locks.status = 'failed'
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

-- Deduplicate historical billing transactions by payment intent so we can enforce uniqueness.
DELETE FROM public.billing_transactions
WHERE id IN (
  SELECT id
  FROM (
    SELECT
      id,
      ROW_NUMBER() OVER (
        PARTITION BY stripe_payment_intent_id
        ORDER BY created_at DESC, id DESC
      ) AS rn
    FROM public.billing_transactions
    WHERE stripe_payment_intent_id IS NOT NULL
  ) ranked
  WHERE rn > 1
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'billing_transactions_stripe_payment_intent_id_key'
      AND conrelid = 'public.billing_transactions'::regclass
  ) THEN
    ALTER TABLE public.billing_transactions
      ADD CONSTRAINT billing_transactions_stripe_payment_intent_id_key
      UNIQUE (stripe_payment_intent_id);
  END IF;
END;
$$;
