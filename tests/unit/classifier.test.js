import { jest, describe, expect, test } from '@jest/globals';
import { importFresh } from '../helpers/module.js';

function createSupabaseRecorder() {
  const state = {
    replyInsertions: [],
    leadUpdates: [],
    suppressions: []
  };

  const builder = {
    from(table) {
      if (table === 'leads') {
        return {
          select() {
            return {
              eq() {
                return {
                  maybeSingle: jest.fn().mockResolvedValue({
                    data: { tenant_id: 'tenant-1', email: 'lead@jax.test' },
                    error: null
                  })
                };
              }
            };
          },
          update(values) {
            state.leadUpdates.push(values);
            return {
              eq: jest.fn().mockResolvedValue({ data: null, error: null })
            };
          }
        };
      }

      if (table === 'replies') {
        return {
          insert(values) {
            state.replyInsertions.push(values);
            return Promise.resolve({ data: null, error: null });
          }
        };
      }

      if (table === 'suppression') {
        return {
          upsert(values) {
            state.suppressions.push(values);
            return Promise.resolve({ data: null, error: null });
          }
        };
      }

      return {
        insert: jest.fn().mockResolvedValue({ data: null, error: null })
      };
    }
  };

  return { builder, state };
}

describe('classifyReply', () => {
  const categories = ['interested', 'not_now', 'unsubscribe', 'question', 'objection'];

  test.each(categories)('classifies %s replies correctly', async (intent) => {
    const { builder, state } = createSupabaseRecorder();

    const { classifyReply } = await importFresh('../../src/agents/reply/classifier.js', [
      ['../../src/lib/groq.js', () => ({
        MODELS: { FAST: 'fast', SMART: 'smart' },
        callGroq: jest.fn().mockResolvedValue(`{"intent":"${intent}","confidence":95,"summary":"${intent} summary"}`)
      })],
      ['../../src/lib/supabase.js', () => ({
        getServiceSupabase: () => builder
      })]
    ]);

    const result = await classifyReply(`Testing ${intent}`, 'lead-1');

    expect(result.intent).toBe(intent);
    expect(state.replyInsertions).toHaveLength(1);
    expect(state.replyInsertions[0]).toEqual(expect.objectContaining({
      lead_id: 'lead-1',
      classified_intent: intent
    }));

    if (intent === 'interested') {
      expect(state.leadUpdates).toContainEqual({ status: 'replied' });
    }

    if (intent === 'unsubscribe') {
      expect(state.suppressions).toContainEqual({
        email: 'lead@jax.test',
        reason: 'unsubscribed'
      });
      expect(state.leadUpdates).toContainEqual({ status: 'unsubscribed' });
    }
  });
});
