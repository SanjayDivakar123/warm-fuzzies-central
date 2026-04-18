import { jest, describe, expect, test } from '@jest/globals';
import { importFresh } from '../helpers/module.js';

describe('writeColdEmail', () => {
  test('returns the parsed subject and body from Groq', async () => {
    const insertMock = jest.fn().mockResolvedValue({ data: null, error: null });
    const fromMock = jest.fn(() => ({ insert: insertMock }));

    const { writeColdEmail } = await importFresh('../../src/agents/outreach/copywriter.js', [
      ['../../src/lib/groq.js', () => ({
        MODELS: { FAST: 'fast', SMART: 'smart' },
        callGroq: jest.fn().mockResolvedValue('{"subject":"Quick idea","body":"Body copy here."}')
      })],
      ['../../src/lib/supabase.js', () => ({
        getServiceSupabase: () => ({ from: fromMock })
      })]
    ]);

    const lead = {
      id: 'lead-2',
      tenant_id: 'tenant-1',
      name: 'Blair Stone',
      title: 'Chief People Officer',
      company: 'Beta Works',
      personalization_hook: 'Growth is accelerating.',
      icp_score: 90
    };

    const result = await writeColdEmail(lead);

    expect(result).toEqual({
      subject: 'Quick idea',
      body: 'Body copy here.'
    });
    expect(insertMock).toHaveBeenCalledWith(expect.objectContaining({
      lead_id: 'lead-2',
      tenant_id: 'tenant-1',
      subject: 'Quick idea',
      body: 'Body copy here.'
    }));
  });
});
