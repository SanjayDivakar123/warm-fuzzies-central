import { beforeEach, describe, expect, test } from '@jest/globals';
import { reseedTestData, getTestTenant } from '../helpers/db.js';
import { createMockReq, createMockRes } from '../helpers/http.js';
import { importFresh } from '../helpers/module.js';

describe('POST /api/orchestrate', () => {
  beforeEach(async () => {
    await reseedTestData();
  });

  test('routes seeded leads correctly by status', async () => {
    const tenant = await getTestTenant();
    const { default: handler } = await importFresh('../../api/orchestrate.js', [
      [
        '../../src/agents/enrichment/icp_scorer.js',
        () => ({ scoreLeadICP: async () => ({ score: 90, hook: 'Mock hook' }) })
      ],
      [
        '../../src/agents/enrichment/email_finder.js',
        () => ({ findEmail: async (lead) => lead.email || 'mock@example.com' })
      ],
      [
        '../../src/agents/outreach/copywriter.js',
        () => ({ writeColdEmail: async () => ({ subject: 'Mock Subject', body: 'Mock body' }) })
      ],
      [
        '../../src/agents/outreach/gmail_sender.js',
        () => ({ sendEmail: async () => ({ ok: true }) })
      ]
    ]);

    const req = createMockReq({
      method: 'POST',
      body: {
        tenantId: tenant.id,
        limit: 10
      }
    });
    const res = createMockRes();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body?.ok).toBe(true);
    expect(Array.isArray(res.body?.results)).toBe(true);

    const routedTargets = new Set(res.body.results.map((row) => row.routed_to));
    expect(routedTargets.has('enrichment')).toBe(true);
    expect(routedTargets.has('outreach')).toBe(true);
    expect(routedTargets.has('followup')).toBe(true);
    expect(routedTargets.has('reply_handler')).toBe(true);
  });
});
