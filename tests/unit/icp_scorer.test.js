import { jest, describe, expect, test } from '@jest/globals';
import { importFresh } from '../helpers/module.js';

describe('scoreLeadICP', () => {
  test('returns the parsed score and hook from Groq', async () => {
    const eqMock = jest.fn().mockResolvedValue({ data: null, error: null });
    const updateMock = jest.fn(() => ({ eq: eqMock }));
    const fromMock = jest.fn(() => ({ update: updateMock }));

    const { scoreLeadICP } = await importFresh('../../src/agents/enrichment/icp_scorer.js', [
      ['../../src/lib/groq.js', () => ({
        MODELS: { FAST: 'fast', SMART: 'smart' },
        callGroq: jest.fn().mockResolvedValue('{"score":88,"reason":"Great fit","hook":"Recent hiring stood out."}')
      })],
      ['../../src/lib/supabase.js', () => ({
        getServiceSupabase: () => ({ from: fromMock })
      })]
    ]);

    const lead = { id: 'lead-1', name: 'Alex Mercer', title: 'VP People', company: 'Acme', source: 'linkedin' };
    const result = await scoreLeadICP(lead);

    expect(result.score).toBe(88);
    expect(result.hook).toBe('Recent hiring stood out.');
    expect(updateMock).toHaveBeenCalledWith({
      icp_score: 88,
      personalization_hook: 'Recent hiring stood out.',
      status: 'enriched'
    });
    expect(eqMock).toHaveBeenCalledWith('id', 'lead-1');
  });
});
