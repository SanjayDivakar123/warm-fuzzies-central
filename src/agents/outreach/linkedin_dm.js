import { chromium } from 'playwright';
import { callGroq, MODELS } from '../../lib/groq.js';
import { withAgentErrorHandling } from '../../lib/agents.js';
import { getServiceSupabase } from '../../lib/supabase.js';

const DM_SYSTEM_PROMPT = `
You are Halo, a LinkedIn outreach agent for OutreachOS.

Write a LinkedIn connection request note:
- Under 300 characters
- Personal, not salesy
- Reference something specific about their company or role
- End with a soft hook

Respond with only the message text.
`;

const FOLLOWUP_DM_PROMPT = `
You are Suki, a LinkedIn follow-up DM agent for OutreachOS.

Write a follow-up DM:
- Under 500 characters
- Natural reference to connection acceptance
- Lead with value
- Soft CTA

Respond with only the message text.
`;

export const writeConnectionRequest = withAgentErrorHandling(
  {
    agentName: 'Halo',
    action: 'write_connection_request_failed',
    getContext: ([lead]) => ({ tenantId: lead?.tenant_id, leadId: lead?.id })
  },
  async (lead, agentName = 'Halo') => {
  const supabase = getServiceSupabase();
  const response = await callGroq({
    model: MODELS.SMART,
    messages: [
      { role: 'system', content: DM_SYSTEM_PROMPT },
      { role: 'user', content: `Lead: ${lead.name}, ${lead.title} at ${lead.company}. Hook: ${lead.personalization_hook || 'No hook available'}` }
    ],
    temperature: 0.7
  });

  await supabase.from('outreach_log').insert({
    lead_id: lead.id,
    tenant_id: lead.tenant_id || null,
    channel: 'linkedin',
    body: response,
    sent_by: agentName,
    touch_number: 1
  });

  return response;
  }
);

export const writeFollowUpDM = withAgentErrorHandling(
  {
    agentName: 'Suki',
    action: 'write_followup_dm_failed',
    getContext: ([lead]) => ({ tenantId: lead?.tenant_id, leadId: lead?.id })
  },
  async (lead, agentName = 'Suki') => {
  const supabase = getServiceSupabase();
  const response = await callGroq({
    model: MODELS.SMART,
    messages: [
      { role: 'system', content: FOLLOWUP_DM_PROMPT },
      { role: 'user', content: `Lead: ${lead.name}, ${lead.title} at ${lead.company}.` }
    ],
    temperature: 0.7
  });

  await supabase.from('outreach_log').insert({
    lead_id: lead.id,
    tenant_id: lead.tenant_id || null,
    channel: 'linkedin',
    body: response,
    sent_by: agentName,
    touch_number: 2
  });

  return response;
  }
);

export const sendLinkedInDM = withAgentErrorHandling(
  {
    agentName: 'Halo',
    action: 'send_linkedin_dm_failed',
    getContext: ([, , , tenantId]) => ({ tenantId })
  },
  async (linkedinUrl, message, linkedinCredentials, tenantId = null) => {
  const supabase = getServiceSupabase();
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    storageState: linkedinCredentials.storageState
  });
  const page = await context.newPage();

  try {
    await page.goto(linkedinUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    const connectBtn = page.locator('[aria-label="Connect"]').first();
    const messageBtn = page.locator('[aria-label="Message"]').first();

    if (await connectBtn.isVisible().catch(() => false)) {
      await connectBtn.click();
      await page.locator('[aria-label="Add a note"]').click();
      await page.locator('textarea[name="message"]').fill(message.slice(0, 300));
      await page.locator('[aria-label="Send now"]').click();
    } else if (await messageBtn.isVisible().catch(() => false)) {
      await messageBtn.click();
      await page.locator('.msg-form__contenteditable').fill(message);
      await page.keyboard.press('Enter');
    }

    await supabase.from('agent_log').insert({
      agent_name: 'Halo',
      tenant_id: tenantId,
      action: 'linkedin_dm_sent',
      result: `Sent to ${linkedinUrl}`
    });

    return true;
  } catch (error) {
    await supabase.from('agent_log').insert({
      agent_name: 'Halo',
      tenant_id: tenantId,
      action: 'linkedin_dm_failed',
      error: error.message
    });
    return false;
  } finally {
    await browser.close();
  }
  }
);
