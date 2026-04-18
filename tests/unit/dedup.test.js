import { describe, expect, test, beforeEach } from '@jest/globals';
import { reseedTestData } from '../helpers/db.js';
import { deduplicateLead } from '../../src/agents/ops/dedup.js';

describe('deduplicateLead', () => {
  beforeEach(async () => {
    await reseedTestData();
  });

  test('detects duplicate email or LinkedIn URL against seeded data', async () => {
    await expect(deduplicateLead('alex@acmecorp.com', null)).resolves.toBe(true);
    await expect(deduplicateLead(null, 'https://linkedin.com/in/alex-mercer-jax')).resolves.toBe(true);
    await expect(deduplicateLead('unique@newco.com', 'https://linkedin.com/in/unique-newco')).resolves.toBe(false);
  });
});
