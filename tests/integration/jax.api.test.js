import { describe, beforeEach, test, expect } from '@jest/globals';
import { reseedTestData, getTestTenant } from '../helpers/db.js';
import { createMockReq, createMockRes } from '../helpers/http.js';

describe('POST /api/jax', () => {
  beforeEach(async () => {
    await reseedTestData();
  });

  test('returns a non-empty Groq reply', async () => {
    const tenant = await getTestTenant();
    const { default: handler } = await import('../../api/jax.js');

    const req = createMockReq({
      method: 'POST',
      body: {
        tenantId: tenant.id,
        message: 'Give me a short status update on the pipeline.',
        history: []
      }
    });
    const res = createMockRes();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(typeof res.body?.reply).toBe('string');
    expect(res.body.reply.trim().length).toBeGreaterThan(0);
  });
});
