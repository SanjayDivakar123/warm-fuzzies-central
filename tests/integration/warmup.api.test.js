import { beforeEach, describe, expect, test, jest } from '@jest/globals';
import { reseedTestData, getTestTenant } from '../helpers/db.js';
import { createMockReq, createMockRes } from '../helpers/http.js';
import { importFresh } from '../helpers/module.js';

describe('GET /api/cron/warmup', () => {
  beforeEach(async () => {
    await reseedTestData();
    jest.useFakeTimers();
  });

  test('loads inboxes and sends warmup messages', async () => {
    const tenant = await getTestTenant();
    const { default: handler } = await importFresh('../../api/cron/warmup.js', [
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
    expect(typeof res.body?.warmed).toBe('number');
    expect(res.body.warmed).toBeGreaterThan(0);
    expect(Array.isArray(res.body.results)).toBe(true);

    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });
});
