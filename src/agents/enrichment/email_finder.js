import { getServiceSupabase } from '../../lib/supabase.js';
import { withAgentErrorHandling } from '../../lib/agents.js';

export const findEmail = withAgentErrorHandling(
  {
    agentName: 'Tess',
    action: 'find_email_failed',
    getContext: ([lead]) => ({ tenantId: lead?.tenant_id, leadId: lead?.id })
  },
  async (lead) => {
  const supabase = getServiceSupabase();
  const domain = extractDomain(lead.company);

  if (!domain || !lead.name) {
    return null;
  }

  const [firstName, ...rest] = lead.name.trim().split(/\s+/);
  const lastName = rest.at(-1) || '';
  const f = firstName?.toLowerCase();
  const l = lastName?.toLowerCase();

  if (!f) {
    return null;
  }

  const patterns = [
    l ? `${f}.${l}@${domain}` : null,
    `${f}@${domain}`,
    l ? `${f}${l}@${domain}` : null,
    l ? `${f[0]}${l}@${domain}` : null,
    l ? `${f[0]}.${l}@${domain}` : null
  ].filter(Boolean);

  const email = patterns.find(verifyEmailFormat) || null;

  if (email) {
    await supabase.from('leads').update({ email }).eq('id', lead.id);
  }

  return email;
  }
);

function extractDomain(company) {
  if (!company) {
    return null;
  }

  return company.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com';
}

function verifyEmailFormat(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
