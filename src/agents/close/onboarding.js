import { optionalEnv } from '../../lib/env.js';
import { withAgentErrorHandling } from '../../lib/agents.js';
import { getServiceSupabase } from '../../lib/supabase.js';
import { sendEmail } from '../outreach/gmail_sender.js';

export const sendWelcomeEmail = withAgentErrorHandling(
  {
    agentName: 'Cael',
    action: 'welcome_email_failed',
    getContext: ([lead]) => ({ tenantId: lead?.tenant_id, leadId: lead?.id })
  },
  async (lead, user, org) => {
  const supabase = getServiceSupabase();
  const dashboardUrl = `${optionalEnv('VERCEL_URL', 'http://localhost:3000')}/?tenant_id=${lead.tenant_id || org.tenant_id || ''}&onboarding=false`;

  const body = `Hi ${lead.name},

Welcome to OutreachOS — your autonomous sales system is live.

Your login details:
Email: ${lead.email}
Temporary password: ${user?.tempPassword || 'Use your setup email'}
Dashboard: ${dashboardUrl}

Here's what happens next:
1. Log in and connect your Gmail inboxes
2. Define your ICP
3. Jax starts orchestrating the pipeline automatically

Reply to this email if you need anything.

The OutreachOS Team`;

  await sendEmail({
    tenantId: lead.tenant_id || org.tenant_id || null,
    to: lead.email,
    subject: 'Your OutreachOS account is live',
    body,
    agentName: 'Cael',
    senderCredentials: optionalEnv('SYSTEM_GMAIL_CREDENTIALS')
      ? JSON.parse(optionalEnv('SYSTEM_GMAIL_CREDENTIALS'))
      : undefined
  });

  await supabase.from('agent_log').insert({
    agent_name: 'Cael',
    action: 'welcome_email_sent',
    tenant_id: lead.tenant_id || null,
    lead_id: lead.id,
    result: `Welcome flow completed for ${lead.email} and org ${org.id}`
  });
  }
);
