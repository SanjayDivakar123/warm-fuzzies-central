import { beforeEach, describe, expect, test } from '@jest/globals';
import { createClient } from '@supabase/supabase-js';
import { reseedTestData, getTestTenant } from '../helpers/db.js';
import { createMockReq, createMockRes } from '../helpers/http.js';
import { importFresh } from '../helpers/module.js';

function getSchema() {
  return process.env.TEST_SUPABASE_SCHEMA || process.env.SUPABASE_SCHEMA || 'public';
}

describe('POST /api/webhook/stripe', () => {
  beforeEach(async () => {
    await reseedTestData();
  });

  test('provisions access after a simulated Stripe completion event', async () => {
    const tenant = await getTestTenant();
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_JWT, {
      db: { schema: getSchema() },
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });

    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('*')
      .eq('tenant_id', tenant.id)
      .eq('status', 'closed_won')
      .single();

    expect(leadError).toBeNull();
    expect(lead).toBeTruthy();

    const sessionId = 'cs_test_completed_session';
    const { error: paymentError } = await supabase
      .from('payments')
      .upsert(
        {
          tenant_id: tenant.id,
          lead_id: lead.id,
          stripe_session_id: sessionId,
          amount: 2497,
          currency: 'usd',
          status: 'pending',
          access_provisioned: false
        },
        {
          onConflict: 'stripe_session_id'
        }
      );

    expect(paymentError).toBeNull();

    const supabaseWithAuthStub = {
      ...supabase,
      auth: {
        ...supabase.auth,
        admin: {
          ...supabase.auth.admin,
          createUser: async ({ email, password, user_metadata }) => ({
            data: {
              user: {
                id: 'test-auth-user',
                email,
                user_metadata,
                tempPassword: password
              }
            },
            error: null
          }),
          listUsers: async () => ({
            data: {
              users: []
            },
            error: null
          })
        }
      }
    };

    const event = {
      type: 'checkout.session.completed',
      data: {
        object: {
          id: sessionId,
          metadata: {
            lead_id: lead.id,
            tenant_id: tenant.id
          }
        }
      }
    };

    const { default: handler } = await importFresh('../../api/webhook/stripe.js', [
      [
        'stripe',
        () => ({
          default: class StripeMock {
            constructor() {
              this.webhooks = {
                constructEvent: () => event
              };
            }
          }
        })
      ],
      [
        '../../src/lib/supabase.js',
        () => ({
          getServiceSupabase: () => supabaseWithAuthStub
        })
      ],
      [
        '../../src/agents/close/onboarding.js',
        () => ({
          sendWelcomeEmail: async () => undefined
        })
      ]
    ]);

    const req = createMockReq({
      method: 'POST',
      body: Buffer.from(JSON.stringify(event)),
      headers: {
        'stripe-signature': 'test-signature'
      }
    });
    const res = createMockRes();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body?.received).toBe(true);

    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('stripe_session_id', sessionId)
      .single();

    expect(orgError).toBeNull();
    expect(organization).toBeTruthy();
    expect(organization.tenant_id).toBe(tenant.id);

    const { data: payment, error: updatedPaymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('stripe_session_id', sessionId)
      .single();

    expect(updatedPaymentError).toBeNull();
    expect(payment.status).toBe('paid');
    expect(payment.access_provisioned).toBe(true);
  });
});
