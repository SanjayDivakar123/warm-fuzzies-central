import { beforeEach, describe, expect, test } from '@jest/globals';
import { reseedTestData, getTestSupabase, getTestTenant } from '../helpers/db.js';
import { createMockReq, createMockRes } from '../helpers/http.js';
import { importFresh } from '../helpers/module.js';

describe('GET /api/cron/brief', () => {
  beforeEach(async () => {
    await reseedTestData();
  });

  test('writes a daily_reports row to Supabase', async () => {
    const tenant = await getTestTenant();
    const { default: handler } = await importFresh('../../api/cron/brief.js', [
      [
        '../../src/lib/groq.js',
        () => ({
          MODELS: {
            FAST: 'llama-3.1-8b-instant',
            SMART: 'llama-3.3-70b-versatile'
          },
          callGroq: async () => 'Test brief summary from mocked Groq.'
        })
      ]
    ]);

    const req = createMockReq({ method: 'GET' });
    const res = createMockRes();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body?.ok).toBe(true);
    expect(Array.isArray(res.body?.reports)).toBe(true);

    const supabase = getTestSupabase();
    const today = new Date().toISOString().slice(0, 10);
    const { data, error } = await supabase
      .from('daily_reports')
      .select('*')
      .eq('tenant_id', tenant.id)
      .eq('date', today)
      .single();

    expect(error).toBeNull();
    expect(data).toBeTruthy();
    expect(data.summary).toBe('Test brief summary from mocked Groq.');
  });
});
