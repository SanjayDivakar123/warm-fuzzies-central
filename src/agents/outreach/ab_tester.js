import { callGroq, MODELS } from '../../lib/groq.js';
import { withAgentErrorHandling } from '../../lib/agents.js';
import { parseJsonResponse } from '../../lib/json.js';
import { getServiceSupabase } from '../../lib/supabase.js';

export const generateSubjectVariants = withAgentErrorHandling(
  {
    agentName: 'Oryn',
    action: 'generate_subject_variants_failed'
  },
  async (emailBody) => {
  const response = await callGroq({
    model: MODELS.FAST,
    messages: [
      {
        role: 'user',
        content: `Write 2 subject line variants for this cold email. One curiosity-based, one benefit-based. Under 8 words each. Respond ONLY with JSON: {"a":"...","b":"..."}\n\nEmail: ${emailBody}`
      }
    ],
    temperature: 0.8
  });

  return parseJsonResponse(response, {
    a: 'Quick question for you',
    b: 'Thought this might help'
  });
  }
);

export const assignVariant = withAgentErrorHandling(
  {
    agentName: 'Oryn',
    action: 'assign_variant_failed',
    getContext: ([leadId]) => ({ leadId })
  },
  async (leadId, variants) => {
  const supabase = getServiceSupabase();
  const variant = Math.random() > 0.5 ? 'a' : 'b';
  const subject = variants[variant];

  await supabase
    .from('outreach_log')
    .update({ subject, ab_variant: variant })
    .eq('lead_id', leadId)
    .eq('touch_number', 1);

  return { variant, subject };
  }
);

export const analyzeABResults = withAgentErrorHandling(
  {
    agentName: 'Cove',
    action: 'analyze_ab_results_failed',
    getContext: ([tenantId]) => ({ tenantId })
  },
  async (tenantId = null) => {
  const supabase = getServiceSupabase();
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  let query = supabase
    .from('outreach_log')
    .select('subject, ab_variant, opened, replied')
    .gte('created_at', weekAgo)
    .not('ab_variant', 'is', null);

  if (tenantId) {
    query = query.eq('tenant_id', tenantId);
  }

  const { data: logs, error } = await query;
  if (error) {
    throw error;
  }

  const results = { a: { sent: 0, opened: 0, replied: 0 }, b: { sent: 0, opened: 0, replied: 0 } };
  (logs || []).forEach((log) => {
    if (!results[log.ab_variant]) return;
    results[log.ab_variant].sent += 1;
    if (log.opened) results[log.ab_variant].opened += 1;
    if (log.replied) results[log.ab_variant].replied += 1;
  });

  const analysis = await callGroq({
    model: MODELS.FAST,
    messages: [
      {
        role: 'user',
        content: `Analyze these A/B subject line results in 2 concise sentences with open and reply rate insight: ${JSON.stringify(results)}`
      }
    ]
  });

  await supabase.from('agent_log').insert({
    agent_name: 'Cove',
    tenant_id: tenantId,
    action: 'ab_analysis_complete',
    result: analysis
  });

  return { results, analysis };
  }
);
