import { beforeEach, describe, expect, test } from '@jest/globals';
import { reseedTestData, getTestSupabase, getTestTenant } from '../helpers/db.js';
import { createMockReq, createMockRes } from '../helpers/http.js';
import { importFresh } from '../helpers/module.js';

describe('GET /api/cron/followup', () => {
  beforeEach(async () => {
    await reseedTestData();
  });

  test('queues follow-up emails for due leads', async () => {
    const tenant = await getTestTenant();
    const { default: handler } = await importFresh('../../api/cron/followup.js', [
      [
        '../../src/lib/groq.js',
        () => ({
          MODELS: {
            FAST: 'llama-3.1-8b-instant',
            SMART: 'llama-3.3-70b-versatile'
          },
          callGroq: async () => JSON.stringify({ subject: 'Following up', body: 'Checking back in.' })
        })
      ],
      [
        '../../src/agents/outreach/gmail_sender.js',
        () => ({
          sendEmail: async () => ({ ok: true })
        })
      ]
    ]);

    const req = createMockReq({
      method: 'GET',
      body: {
        tenantId: tenant.id
      }
    });
    const res = createMockRes();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body?.ok).toBe(true);
    expect(Array.isArray(res.body?.results)).toBe(true);
    expect(res.body.results.some((row) => row.touch === 2)).toBe(true);

    const supabase = getTestSupabase();
    const { data, error } = await supabase
      .from('outreach_log')
      .select('*')
      .eq('tenant_id', tenant.id)
      .eq('touch_number', 2);

    expect(error).toBeNull();
    expect((data || []).length).toBeGreaterThan(0);
  });
});
