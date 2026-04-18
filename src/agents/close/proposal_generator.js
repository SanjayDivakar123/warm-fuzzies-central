import PDFDocument from 'pdfkit';
import { put } from '@vercel/blob';
import { callGroq, MODELS } from '../../lib/groq.js';
import { withAgentErrorHandling } from '../../lib/agents.js';
import { parseJsonResponse } from '../../lib/json.js';
import { getServiceSupabase } from '../../lib/supabase.js';

const PROPOSAL_PROMPT = `
You are Rowan, a proposal writing agent for OutreachOS.

Write a professional B2B proposal and return JSON with:
- executive_summary
- their_challenge
- our_solution
- whats_included
- next_steps
`;

export const generateProposal = withAgentErrorHandling(
  {
    agentName: 'Rowan',
    action: 'generate_proposal_failed',
    getContext: ([lead]) => ({ tenantId: lead?.tenant_id, leadId: lead?.id })
  },
  async (lead, meetingNotes, pricing) => {
  const supabase = getServiceSupabase();
  const content = await callGroq({
    model: MODELS.SMART,
    messages: [
      { role: 'system', content: PROPOSAL_PROMPT },
      {
        role: 'user',
        content: `
Company: ${lead.company}
Contact: ${lead.name}, ${lead.title}
Meeting notes: ${meetingNotes || 'Standard demo with strong engagement'}
Pricing: ${JSON.stringify(pricing || {})}
Platform: OutreachOS
        `.trim()
      }
    ],
    temperature: 0.5,
    max_tokens: 1200
  });

  const parsed = parseJsonResponse(content, {
    executive_summary: content,
    their_challenge: '',
    our_solution: '',
    whats_included: [
      'Lead sourcing and enrichment',
      'Inbox warmup and outreach automation',
      'Reply handling and booking flow',
      'Proposals, payments, and provisioning'
    ],
    next_steps: [
      'Review this proposal',
      'Reply with any questions',
      'Approve the recommended plan to launch'
    ]
  });

  const pricingSection = buildPricingSection(pricing);
  const pdfBuffer = await buildProposalPDF(lead, parsed, pricingSection);
  const blob = await put(`proposals/${lead.id}-${Date.now()}.pdf`, pdfBuffer, {
    access: 'public',
    contentType: 'application/pdf'
  });

  await supabase.from('proposals').insert({
    lead_id: lead.id,
    tenant_id: lead.tenant_id || null,
    proposal_url: blob.url,
    sent_at: new Date().toISOString(),
    status: 'sent'
  });

  await supabase.from('leads').update({ status: 'proposal_sent' }).eq('id', lead.id);
  return blob.url;
  }
);

function buildPricingSection(pricing) {
  return (
    pricing || {
      starter: { name: 'Starter', price: 497, period: 'month', seats: 5, description: 'Perfect for small sales teams' },
      growth: { name: 'Growth', price: 997, period: 'month', seats: 15, description: 'For growing companies' },
      enterprise: { name: 'Enterprise', price: 2497, period: 'month', seats: 'Unlimited', description: 'Full platform access' }
    }
  );
}

async function buildProposalPDF(lead, content, pricing) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 60, size: 'A4' });
    const buffers = [];

    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    doc.fontSize(28).font('Helvetica-Bold').fillColor('#17324d').text('OutreachOS', 60, 60);
    doc.fontSize(12).font('Helvetica').fillColor('#5e7185').text('Autonomous AI Sales Platform', 60, 95);
    doc.moveTo(60, 115).lineTo(535, 115).strokeColor('#d7dde5').lineWidth(1).stroke();
    doc.fontSize(22).font('Helvetica-Bold').fillColor('#17324d').text(`Proposal for ${lead.company}`, 60, 130);
    doc.fontSize(12).font('Helvetica').fillColor('#5e7185').text(
      `Prepared for ${lead.name} • ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`,
      60,
      160
    );

    let y = 200;
    y = addSection(doc, 'Executive Summary', content.executive_summary, y);
    if (content.their_challenge) y = addSection(doc, 'Your Challenge', content.their_challenge, y);
    if (content.our_solution) y = addSection(doc, 'The Solution', content.our_solution, y);

    doc.addPage();
    y = 60;
    doc.fontSize(16).font('Helvetica-Bold').fillColor('#17324d').text("What's Included", 60, y);
    y += 30;
    (content.whats_included || []).forEach((item) => {
      doc.fontSize(11).font('Helvetica').fillColor('#333').text(`• ${item}`, 75, y);
      y += 22;
    });
    y += 18;

    doc.fontSize(16).font('Helvetica-Bold').fillColor('#17324d').text('Investment', 60, y);
    y += 30;
    Object.values(pricing).forEach((plan, index) => {
      const x = 60 + index * 158;
      const featured = index === 1;
      doc.rect(x, y, 145, 120).fillColor(featured ? '#17324d' : '#f6f7f9').fill();
      doc.fontSize(13).font('Helvetica-Bold').fillColor(featured ? '#fff' : '#17324d').text(plan.name, x + 12, y + 14);
      doc.fontSize(22).font('Helvetica-Bold').fillColor(featured ? '#fff' : '#17324d').text(`$${plan.price}`, x + 12, y + 35);
      doc.fontSize(10).font('Helvetica').fillColor(featured ? '#ced7e3' : '#5e7185').text(`/${plan.period}`, x + 12, y + 62);
      doc.fontSize(9).font('Helvetica').fillColor(featured ? '#ced7e3' : '#6c7e92').text(plan.description, x + 12, y + 80, { width: 121 });
    });

    y += 150;
    doc.fontSize(16).font('Helvetica-Bold').fillColor('#17324d').text('Next Steps', 60, y);
    y += 30;
    (content.next_steps || []).forEach((step, index) => {
      doc.fontSize(11).font('Helvetica').fillColor('#333').text(`${index + 1}. ${step}`, 75, y);
      y += 24;
    });

    doc.fontSize(9).font('Helvetica').fillColor('#96a1ae').text(
      'OutreachOS • Autonomous AI Sales Platform • Questions? Reply to this email.',
      60,
      760,
      { align: 'center', width: 475 }
    );

    doc.end();
  });
}

function addSection(doc, title, body, y) {
  doc.fontSize(16).font('Helvetica-Bold').fillColor('#17324d').text(title, 60, y);
  y += 30;
  doc.fontSize(11).font('Helvetica').fillColor('#333').text(body, 60, y, { width: 475, lineGap: 4 });
  return y + doc.heightOfString(body, { width: 475 }) + 30;
}
