import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const seedFile = path.join(__dirname, '../supabase/seed.sql');

export const TEST_FIXTURES = {
  tenant: {
    company_name: 'Jax Test Workspace',
    owner_email: 'tests@jax.test',
    plan: 'starter',
    status: 'active',
    icp_description: 'People leaders at 20-500 employee companies',
    brand_voice: 'Professional, concise, human',
    platform_name: 'OutreachOS',
    calendly_url: 'https://calendly.com/jax-tests/demo'
  },
  inboxes: [
    {
      email: 'warmup-one@jax.test',
      display_name: 'Warmup One',
      credentials: { access_token: 'token-1', refresh_token: 'refresh-1', token_type: 'Bearer' },
      active: true,
      warmup_phase: 2,
      daily_cold_limit: 15
    },
    {
      email: 'warmup-two@jax.test',
      display_name: 'Warmup Two',
      credentials: { access_token: 'token-2', refresh_token: 'refresh-2', token_type: 'Bearer' },
      active: true,
      warmup_phase: 3,
      daily_cold_limit: 30
    }
  ],
  leads: [
    {
      key: 'new',
      name: 'Alex Mercer',
      title: 'VP People',
      company: 'Acme Corp',
      email: 'alex@acmecorp.com',
      linkedin_url: 'https://linkedin.com/in/alex-mercer-jax',
      source: 'linkedin',
      icp_score: 91,
      personalization_hook: 'You are scaling the people function quickly.',
      status: 'new',
      assigned_agent: 'Ravi',
      notes: 'Seed lead'
    },
    {
      key: 'enriched',
      name: 'Blair Stone',
      title: 'Chief People Officer',
      company: 'Beta Works',
      email: 'blair@betaworks.com',
      linkedin_url: 'https://linkedin.com/in/blair-stone-jax',
      source: 'crunchbase',
      icp_score: 84,
      personalization_hook: 'Recent growth makes team structure a priority.',
      status: 'enriched',
      assigned_agent: 'Aria',
      notes: 'Seed lead'
    },
    {
      key: 'followup',
      name: 'Casey Drew',
      title: 'Head of HR',
      company: 'Charlie Group',
      email: 'casey@charliegroup.com',
      linkedin_url: 'https://linkedin.com/in/casey-drew-jax',
      source: 'google_maps',
      icp_score: 79,
      personalization_hook: 'You are building manager capability at pace.',
      status: 'outreach_sent',
      assigned_agent: 'Cole',
      notes: 'Seed lead for followup'
    },
    {
      key: 'replied',
      name: 'Devon Hart',
      title: 'COO',
      company: 'Delta Ops',
      email: 'devon@deltaops.com',
      linkedin_url: 'https://linkedin.com/in/devon-hart-jax',
      source: 'job_board',
      icp_score: 72,
      personalization_hook: 'Operational hiring is accelerating this quarter.',
      status: 'replied',
      assigned_agent: 'Rex',
      notes: 'Seed lead'
    },
    {
      key: 'closed',
      name: 'Emery Quinn',
      title: 'Founder',
      company: 'Echo Labs',
      email: 'emery@echolabs.com',
      linkedin_url: 'https://linkedin.com/in/emery-quinn-jax',
      source: 'linkedin',
      icp_score: 95,
      personalization_hook: 'Founder-led teams need role clarity under pressure.',
      status: 'closed_won',
      assigned_agent: 'Ova',
      notes: 'Seed lead for payments'
    }
  ]
};

function getSupabase() {
  const schema = process.env.TEST_SUPABASE_SCHEMA || process.env.SUPABASE_SCHEMA || 'public';

  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_JWT, {
    db: { schema },
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

export async function runSeed() {
  if (!fs.existsSync(seedFile)) {
    throw new Error(`Missing seed file: ${seedFile}`);
  }

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_JWT) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_JWT are required for test seeding.');
  }

  const supabase = getSupabase();
  const { tenant: tenantFixture, inboxes, leads } = TEST_FIXTURES;

  let { data: tenant, error: tenantLookupError } = await supabase
    .from('tenants')
    .select('*')
    .eq('owner_email', tenantFixture.owner_email)
    .maybeSingle();

  if (tenantLookupError) {
    throw tenantLookupError;
  }

  if (!tenant) {
    const tenantInsert = await supabase.from('tenants').insert(tenantFixture).select().single();
    if (tenantInsert.error) {
      throw tenantInsert.error;
    }
    tenant = tenantInsert.data;
  } else {
    const tenantUpdate = await supabase
      .from('tenants')
      .update(tenantFixture)
      .eq('id', tenant.id)
      .select()
      .single();
    if (tenantUpdate.error) {
      throw tenantUpdate.error;
    }
    tenant = tenantUpdate.data;
  }

  const tenantId = tenant.id;
  const tableNames = ['outreach_log', 'replies', 'meetings', 'proposals', 'payments', 'agent_log', 'inboxes', 'organizations', 'daily_reports', 'leads'];

  for (const table of tableNames) {
    const { error } = await supabase.from(table).delete().eq('tenant_id', tenantId);
    if (error) {
      throw error;
    }
  }

  const leadInsert = await supabase.from('leads').insert(
    leads.map(({ key, ...lead }) => ({
      ...lead,
      tenant_id: tenantId
    }))
  ).select();

  if (leadInsert.error) {
    throw leadInsert.error;
  }

  const insertedLeads = leadInsert.data || [];
  const leadMap = insertedLeads.reduce((accumulator, lead, index) => {
    accumulator[leads[index].key] = lead;
    return accumulator;
  }, {});

  const inboxInsert = await supabase.from('inboxes').insert(
    inboxes.map((inbox) => ({
      ...inbox,
      tenant_id: tenantId
    }))
  ).select();

  if (inboxInsert.error) {
    throw inboxInsert.error;
  }

  const fourDaysAgo = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString();
  const today = new Date().toISOString().slice(0, 10);

  const outreachInsert = await supabase.from('outreach_log').insert([
    {
      tenant_id: tenantId,
      lead_id: leadMap.followup.id,
      channel: 'email',
      subject: 'Intro note',
      body: 'Initial outreach body',
      sent_by: 'Cole',
      touch_number: 1,
      created_at: fourDaysAgo
    },
    {
      tenant_id: tenantId,
      lead_id: leadMap.closed.id,
      channel: 'email',
      subject: 'Closed won follow-through',
      body: 'Closed outreach body',
      sent_by: 'Cole',
      touch_number: 1
    }
  ]);

  if (outreachInsert.error) {
    throw outreachInsert.error;
  }

  const meetingsInsert = await supabase.from('meetings').insert({
    tenant_id: tenantId,
    lead_id: leadMap.closed.id,
    scheduled_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    status: 'scheduled',
    notes: 'Seed meeting'
  });

  if (meetingsInsert.error) {
    throw meetingsInsert.error;
  }

  const paymentsInsert = await supabase.from('payments').insert({
    tenant_id: tenantId,
    lead_id: leadMap.closed.id,
    stripe_session_id: 'seed_paid_session',
    amount: 997,
    currency: 'usd',
    status: 'paid',
    access_provisioned: true
  });

  if (paymentsInsert.error) {
    throw paymentsInsert.error;
  }

  const reportsInsert = await supabase.from('daily_reports').upsert({
    tenant_id: tenantId,
    date: today,
    leads_found: insertedLeads.length,
    emails_sent: 1,
    replies_received: 0,
    meetings_booked: 1,
    deals_closed: 1,
    revenue: 997,
    summary: 'Seed report',
    delivered: false
  }, {
    onConflict: 'tenant_id,date'
  });

  if (reportsInsert.error) {
    throw reportsInsert.error;
  }

  const logsInsert = await supabase.from('agent_log').insert([
    {
      tenant_id: tenantId,
      agent_name: 'Seed',
      action: 'seed_completed',
      result: 'Seed data inserted successfully'
    },
    {
      tenant_id: tenantId,
      agent_name: 'Seed',
      action: 'seed_warning',
      error: 'Intentional seeded warning row'
    }
  ]);

  if (logsInsert.error) {
    throw logsInsert.error;
  }

  return {
    tenantId,
    leadIds: Object.fromEntries(Object.entries(leadMap).map(([key, lead]) => [key, lead.id])),
    inboxCount: inboxes.length
  };
}

const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === __filename;
if (isDirectRun) {
  runSeed()
    .then((summary) => {
      console.log(`Seed complete for tenant ${summary.tenantId}`);
    })
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
}
