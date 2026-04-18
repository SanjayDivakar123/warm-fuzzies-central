#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

API_BASE="${API_BASE:-http://localhost:3000}"
SERVER_PID=""

if [[ -f ".env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source ".env"
  set +a
fi

cleanup() {
  if [[ -n "${SERVER_PID}" ]] && kill -0 "${SERVER_PID}" >/dev/null 2>&1; then
    kill "${SERVER_PID}" >/dev/null 2>&1 || true
    wait "${SERVER_PID}" >/dev/null 2>&1 || true
  fi
}

trap cleanup EXIT

log_pass() {
  printf '[PASS] %s\n' "$1"
}

log_fail() {
  printf '[FAIL] %s\n' "$1" >&2
}

wait_for_server() {
  for _ in {1..30}; do
    if curl -sS "${API_BASE}/api/admin/session" >/dev/null 2>&1; then
      return 0
    fi
    sleep 1
  done

  return 1
}

assert_status() {
  local description="$1"
  local expected="$2"
  shift 2
  local actual
  actual="$(curl -sS -o /tmp/jax-smoke-response.txt -w '%{http_code}' "$@")"

  if [[ "${actual}" == "${expected}" ]]; then
    log_pass "${description}"
  else
    log_fail "${description} (expected ${expected}, got ${actual})"
    cat /tmp/jax-smoke-response.txt >&2 || true
    exit 1
  fi
}

assert_body_contains() {
  local description="$1"
  local expected_status="$2"
  local expected_text="$3"
  shift 3
  local actual
  actual="$(curl -sS -o /tmp/jax-smoke-response.txt -w '%{http_code}' "$@")"

  if [[ "${actual}" != "${expected_status}" ]]; then
    log_fail "${description} (expected status ${expected_status}, got ${actual})"
    cat /tmp/jax-smoke-response.txt >&2 || true
    exit 1
  fi

  if grep -q "${expected_text}" /tmp/jax-smoke-response.txt; then
    log_pass "${description}"
  else
    log_fail "${description} (body missing ${expected_text})"
    cat /tmp/jax-smoke-response.txt >&2 || true
    exit 1
  fi
}

printf 'Seeding test data...\n'
node scripts/seed.js

printf 'Starting API server...\n'
node server.js >/tmp/jax-smoke-server.log 2>&1 &
SERVER_PID=$!

if ! wait_for_server; then
  log_fail 'Server failed to start'
  cat /tmp/jax-smoke-server.log >&2 || true
  exit 1
fi

log_pass 'Server started'

TENANT_ID="$(node --input-type=module -e "import { createClient } from '@supabase/supabase-js'; const supabase=createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_JWT, { db: { schema: process.env.TEST_SUPABASE_SCHEMA || process.env.SUPABASE_SCHEMA || 'public' }, auth: { persistSession:false, autoRefreshToken:false } }); const { data, error } = await supabase.from('tenants').select('id').eq('owner_email','tests@jax.test').single(); if (error) { console.error(error.message); process.exit(1); } console.log(data.id);")"
LEAD_ID="$(node --input-type=module -e "import { createClient } from '@supabase/supabase-js'; const supabase=createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_JWT, { db: { schema: process.env.TEST_SUPABASE_SCHEMA || process.env.SUPABASE_SCHEMA || 'public' }, auth: { persistSession:false, autoRefreshToken:false } }); const { data, error } = await supabase.from('leads').select('id').eq('tenant_id','${TENANT_ID}').eq('status','closed_won').single(); if (error) { console.error(error.message); process.exit(1); } console.log(data.id);")"

assert_body_contains \
  'POST /api/jax returns reply' \
  '200' \
  'reply' \
  -X POST "${API_BASE}/api/jax" \
  -H 'Content-Type: application/json' \
  -d "{\"tenantId\":\"${TENANT_ID}\",\"message\":\"Give me a short pipeline update.\",\"history\":[]}"

assert_body_contains \
  'POST /api/orchestrate returns results' \
  '200' \
  'results' \
  -X POST "${API_BASE}/api/orchestrate" \
  -H 'Content-Type: application/json' \
  -d "{\"tenantId\":\"${TENANT_ID}\",\"limit\":10}"

assert_body_contains \
  'GET /api/cron/brief writes reports' \
  '200' \
  'reports' \
  "${API_BASE}/api/cron/brief"

assert_body_contains \
  'GET /api/cron/warmup returns warmed count' \
  '200' \
  'warmed' \
  "${API_BASE}/api/cron/warmup"

assert_body_contains \
  'GET /api/cron/followup returns follow-up results' \
  '200' \
  'results' \
  "${API_BASE}/api/cron/followup"

assert_status \
  'POST /api/webhook/stripe mount responds' \
  '400' \
  -X POST "${API_BASE}/api/webhook/stripe" \
  -H 'Content-Type: application/json' \
  -d "{\"type\":\"checkout.session.completed\",\"data\":{\"object\":{\"id\":\"smoke_session\",\"metadata\":{\"lead_id\":\"${LEAD_ID}\",\"tenant_id\":\"${TENANT_ID}\"}}}}"

printf 'Smoke test completed successfully.\n'
