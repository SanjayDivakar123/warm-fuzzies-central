import { jest, describe, expect, test, beforeEach, afterEach } from '@jest/globals';
import { importFresh } from '../helpers/module.js';

describe('runWarmupCycle', () => {
  let setTimeoutSpy;

  beforeEach(() => {
    setTimeoutSpy = jest.spyOn(global, 'setTimeout').mockImplementation(() => 0);
  });

  afterEach(() => {
    setTimeoutSpy.mockRestore();
  });

  test('sends the expected number of warmup emails with mocked Gmail', async () => {
    const insertMock = jest.fn().mockResolvedValue({ data: null, error: null });
    const gteMock = jest.fn().mockResolvedValue({ count: 0, error: null });
    const likeMock = jest.fn(() => ({ gte: gteMock }));
    const eqSecondMock = jest.fn(() => ({ like: likeMock }));
    const eqFirstMock = jest.fn(() => ({ eq: eqSecondMock }));
    const selectMock = jest.fn(() => ({ eq: eqFirstMock }));

    const fromMock = jest.fn((table) => {
      if (table === 'agent_log') {
        return {
          select: selectMock,
          insert: insertMock
        };
      }
      return { insert: insertMock };
    });

    const sendEmailMock = jest.fn().mockResolvedValue({ ok: true, messageId: 'msg-1' });

    const { runWarmupCycle } = await importFresh('../../src/agents/outreach/warmup.js', [
      ['../../src/agents/outreach/gmail_sender.js', () => ({
        sendEmail: sendEmailMock
      })],
      ['../../src/lib/supabase.js', () => ({
        getServiceSupabase: () => ({ from: fromMock })
      })]
    ]);

    const inboxes = [
      { email: 'one@jax.test', credentials: { token: 'a' }, active: true, warmup_phase: 1 },
      { email: 'two@jax.test', credentials: { token: 'b' }, active: true, warmup_phase: 1 }
    ];

    const result = await runWarmupCycle(inboxes);

    expect(result).toHaveLength(2);
    expect(sendEmailMock).toHaveBeenCalledTimes(2);
  });
});
