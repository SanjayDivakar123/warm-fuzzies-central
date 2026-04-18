import { jest, describe, expect, test } from '@jest/globals';
import { importFresh } from '../helpers/module.js';

describe('findEmail', () => {
  test.each([
    ['Alex Mercer', 'Acme Corp', 'alex.mercer@acmecorp.com'],
    ['Blair', 'Beta Works', 'blair@betaworks.com'],
    ['Casey Drew', 'Charlie Group', 'casey.drew@charliegroup.com']
  ])('guesses an email pattern for %s at %s', async (name, company, expectedEmail) => {
    const eqMock = jest.fn().mockResolvedValue({ data: null, error: null });
    const updateMock = jest.fn(() => ({ eq: eqMock }));
    const fromMock = jest.fn(() => ({ update: updateMock }));

    const { findEmail } = await importFresh('../../src/agents/enrichment/email_finder.js', [
      ['../../src/lib/supabase.js', () => ({
        getServiceSupabase: () => ({ from: fromMock })
      })]
    ]);

    const result = await findEmail({ id: 'lead-3', name, company });
    expect(result).toBe(expectedEmail);
  });
});
