import { getServiceSupabase } from '../../lib/supabase.js';
import { withAgentErrorHandling } from '../../lib/agents.js';

export const deduplicateLead = withAgentErrorHandling(
  {
    agentName: 'Dupe',
    action: 'deduplicate_lead_failed'
  },
  async (email, linkedinUrl) => {
  const supabase = getServiceSupabase();
  const checks = [];

  if (email) {
    const { data } = await supabase.from('leads').select('id').eq('email', email).maybeSingle();
    if (data) checks.push(true);
  }

  if (linkedinUrl) {
    const { data } = await supabase.from('leads').select('id').eq('linkedin_url', linkedinUrl).maybeSingle();
    if (data) checks.push(true);
  }

  if (email) {
    const { data } = await supabase.from('suppression').select('id').eq('email', email).maybeSingle();
    if (data) checks.push(true);
  }

  return checks.length > 0;
  }
);
