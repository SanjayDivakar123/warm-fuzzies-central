-- Add a timestamp that blocks self-service hiring cancellation during the
-- short-window commitment period (< 7 days before the shared portal renewal).
-- Set by subscribe-hiring-tab when the proration clause is triggered.
-- Cleared (or ignored) once the date has passed.
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS hiring_commitment_block_cancel_until timestamptz;
