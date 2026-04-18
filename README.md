# OutreachOS

Multi-tenant autonomous sales SaaS built on React, Vercel serverless routes, Supabase, Groq, Gmail OAuth, and Stripe.

## Included in this scaffold

- Tenant-aware dashboard and onboarding flow
- Jax chief-of-staff chat with daily brief delivery
- Gmail OAuth inbox connection flow
- Warmup, follow-up, reactivation, and A/B subject analysis cron routes
- LinkedIn DM automation scaffold with Playwright
- Proposal generation with PDF output and Vercel Blob upload
- Stripe webhook provisioning and onboarding email flow
- Supabase schema with tenant isolation columns and RLS policies

## Quick start

1. Copy `.env.example` to `.env`
2. Install dependencies with `npm install`
3. Run [supabase/schema.sql](/Users/sanjaydivakar/Desktop/Jax/supabase/schema.sql) in Supabase
4. Start locally with `npm run dev`
5. Open the local URL and complete onboarding

## Main routes

- `POST /api/jax`
- `POST /api/tenant/bootstrap`
- `POST /api/tenant/update`
- `POST /api/tenant/dashboard`
- `GET /api/auth/gmail/connect`
- `GET /api/auth/gmail/callback`
- `POST /api/webhook/stripe`
- `GET /api/cron/brief`
- `GET /api/cron/followup`
- `GET /api/cron/warmup`
- `GET /api/cron/reactivation`
- `GET /api/cron/ab_analysis`

## Notes

- The dashboard now reads through server routes so it works even before a browser auth session exists.
- The LinkedIn automation and inbox warmup reply delay both still need operational hardening before production use.
- Rotate any credentials previously pasted into chat before using this project in a real environment.
