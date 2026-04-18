import { jest, describe, expect, test } from '@jest/globals';
import { importFresh } from '../helpers/module.js';

class MockPDFDocument {
  constructor() {
    this.handlers = {};
  }

  on(event, handler) {
    this.handlers[event] = handler;
    return this;
  }

  fontSize() { return this; }
  font() { return this; }
  fillColor() { return this; }
  text() { return this; }
  moveTo() { return this; }
  lineTo() { return this; }
  strokeColor() { return this; }
  lineWidth() { return this; }
  stroke() { return this; }
  addPage() { return this; }
  rect() { return this; }
  fill() { return this; }
  heightOfString() { return 24; }
  end() {
    if (this.handlers.data) {
      this.handlers.data(Buffer.from('pdf'));
    }
    if (this.handlers.end) {
      this.handlers.end();
    }
  }
}

describe('generateProposal', () => {
  test('returns the uploaded PDF URL', async () => {
    const insertMock = jest.fn().mockResolvedValue({ data: null, error: null });
    const eqMock = jest.fn().mockResolvedValue({ data: null, error: null });
    const updateMock = jest.fn(() => ({ eq: eqMock }));
    const fromMock = jest.fn((table) => {
      if (table === 'proposals') {
        return { insert: insertMock };
      }
      if (table === 'leads') {
        return { update: updateMock };
      }
      return { insert: jest.fn().mockResolvedValue({ data: null, error: null }) };
    });

    const { generateProposal } = await importFresh('../../src/agents/close/proposal_generator.js', [
      ['../../src/lib/groq.js', () => ({
        MODELS: { FAST: 'fast', SMART: 'smart' },
        callGroq: jest.fn().mockResolvedValue('{"executive_summary":"Summary","their_challenge":"Challenge","our_solution":"Solution","whats_included":["A"],"next_steps":["B"]}')
      })],
      ['../../src/lib/supabase.js', () => ({
        getServiceSupabase: () => ({ from: fromMock })
      })],
      ['@vercel/blob', () => ({
        put: jest.fn().mockResolvedValue({ url: 'https://blob.test/proposal.pdf' })
      })],
      ['pdfkit', () => ({
        default: MockPDFDocument
      })]
    ]);

    const result = await generateProposal(
      { id: 'lead-4', tenant_id: 'tenant-1', name: 'Alex', title: 'VP People', company: 'Acme' },
      'Strong demo',
      null
    );

    expect(result).toBe('https://blob.test/proposal.pdf');
    expect(insertMock).toHaveBeenCalled();
    expect(updateMock).toHaveBeenCalledWith({ status: 'proposal_sent' });
  });
});
