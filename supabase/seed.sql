-- Jax test seed reference
-- This file documents the logical test seed used by scripts/seed.js.
-- The JavaScript seed runner applies equivalent records through Supabase.

-- Tenant
-- owner_email: tests@jax.test
-- company_name: Jax Test Workspace

-- Leads
-- 1. Alex Mercer  | new            | alex@acmecorp.com
-- 2. Blair Stone  | enriched       | blair@betaworks.com
-- 3. Casey Drew   | outreach_sent  | casey@charliegroup.com
-- 4. Devon Hart   | replied        | devon@deltaops.com
-- 5. Emery Quinn  | closed_won     | emery@echolabs.com

-- Inboxes
-- warmup-one@jax.test
-- warmup-two@jax.test

-- Existing payment
-- stripe_session_id: seed_paid_session

-- Existing report/log rows are cleared and recreated before every test run.
