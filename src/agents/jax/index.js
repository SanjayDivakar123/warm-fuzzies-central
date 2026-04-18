import { callGroq, MODELS } from '../../lib/groq.js';
import { withAgentErrorHandling } from '../../lib/agents.js';
import { buildJaxSystemPrompt, getTenantConfig } from '../../lib/tenant.js';
import { getServiceSupabase } from '../../lib/supabase.js';
import { generateDailyBrief } from '../ops/reporter.js';
import { getPipelineHealth } from '../atlas/index.js';
import { runLeadFinderSwarm } from '../finders/index.js';
import { cleanupScrapedLeads } from '../finders/external_scraper.js';

const BASE_JAX_SYSTEM_PROMPT = `
You are Jax, Chief of Staff for OutreachOS.

Voice:
- Direct
- Sharp
- Calm under pressure
- Action-oriented

Rules:
- Give clear next actions
- Surface risks early
- Be concise and useful
- If data is provided, trust it and speak from it
- Never invent leads, people, companies, emails, phone numbers, or pipeline facts
- If verified data is missing, say so plainly instead of filling gaps
`;

function looksLikeBriefRequest(message) {
  return /brief|daily report|morning|status update|pipeline/i.test(message);
}

function looksLikeLeadRequest(message) {
  return /\b(find|get|show|give|list)\b[\s\S]*\b(leads?|prospects?|contacts?)\b/i.test(message);
}

function looksLikeContactDetailRequest(message) {
  return /\b(email|emails|phone|phones|number|numbers|contact info|contact details)\b/i.test(message);
}

function stripLeadRequestQualifiers(message) {
  return String(message || '')
    .replace(/\bwith\s+(?:email|emails|phone|phones|number|numbers|contact info|contact details)(?:\s+and\s+(?:email|emails|phone|phones|number|numbers|contact info|contact details))*\b/gi, '')
    .replace(/\bplease\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseRequestedLeadCount(message) {
  const numericMatch = message.match(/\b(\d{1,3})\b/);
  if (numericMatch) {
    return Math.max(1, Math.min(Number(numericMatch[1]), 50));
  }

  const wordMap = {
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
    nine: 9,
    ten: 10
  };

  const lower = message.toLowerCase();
  for (const [word, value] of Object.entries(wordMap)) {
    if (lower.includes(word)) {
      return value;
    }
  }

  return 10;
}

function parseLeadSearchParams(message, tenantConfig = null) {
  const count = parseRequestedLeadCount(message);
  const cleanedMessage = stripLeadRequestQualifiers(message);
  const locationMatch = cleanedMessage.match(/\b(?:in|near|around)\s+([a-zA-Z\s.,-]{2,}?)(?=\s+\b(?:for|category|categories|type)\b|$)/i);
  const categoryMatch = cleanedMessage.match(/\b(?:for|category|categories|type)\s+([a-zA-Z\s&/-]{2,}?)(?=$)/i);

  const location = locationMatch?.[1]?.replace(/[.,\s]+$/g, '').trim() || 'New York, NY';
  let category = categoryMatch?.[1]?.replace(/[.,\s]+$/g, '').trim() || null;

  if (!category && tenantConfig?.icp_description) {
    const icp = tenantConfig.icp_description.toLowerCase();
    if (icp.includes('agency')) category = 'marketing agency';
    else if (icp.includes('law')) category = 'law firm';
    else if (icp.includes('real estate')) category = 'real estate agency';
    else if (icp.includes('restaurant')) category = 'restaurant';
    else if (icp.includes('medical') || icp.includes('clinic')) category = 'medical clinic';
  }

  if (!category) {
    category = 'marketing agency';
  }

  return { count, location, category };
}

function buildContextBlock(context) {
  return `
Operational context:
${JSON.stringify(context, null, 2)}
  `.trim();
}

function normalizeText(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function tokenize(value) {
  return normalizeText(value).split(' ').filter(Boolean);
}

function normalizeWebsiteHost(value) {
  try {
    return new URL(value).hostname.replace(/^www\./i, '').toLowerCase();
  } catch {
    return null;
  }
}

function leadMatchesRequest(lead, filters = {}) {
  const { location, category } = filters;
  const noteData = parseLeadNotes(lead);
  const searchLocation = normalizeText(noteData.search_location || '');
  const searchCategory = normalizeText(noteData.search_category || '');
  const haystack = normalizeText([
    lead.name,
    lead.title,
    lead.company,
    noteData.website,
    noteData.address,
    noteData.city,
    noteData.state,
    noteData.search_category,
    noteData.search_location
  ].filter(Boolean).join(' '));

  const categoryTokens = tokenize(category).filter((token) => token.length > 2);
  const locationTokens = tokenize(location).filter((token) => token.length > 2 && !['united', 'states'].includes(token));

  const categoryMatches = categoryTokens.filter((token) => haystack.includes(token));
  const locationMatches = locationTokens.filter((token) => haystack.includes(token));

  let categoryOk = categoryTokens.length === 0;
  let locationOk = locationTokens.length === 0;

  if (!categoryOk) {
    if (searchCategory) {
      categoryOk = categoryTokens.every((token) => searchCategory.includes(token));
    } else {
      categoryOk = categoryMatches.length >= Math.max(1, Math.ceil(categoryTokens.length * 0.6));
    }
  }

  if (!locationOk) {
    if (searchLocation) {
      locationOk = locationTokens.every((token) => searchLocation.includes(token));
    } else {
      locationOk = locationMatches.length >= Math.max(1, Math.ceil(locationTokens.length * 0.6));
    }
  }

  return categoryOk && locationOk;
}

function dedupeLeads(leads) {
  const seen = new Set();
  const results = [];

  for (const lead of leads) {
    const noteData = parseLeadNotes(lead);
    const websiteHost = normalizeWebsiteHost(noteData.website || '');
    const company = normalizeText(lead.company || lead.name || '');
    const email = normalizeText(lead.email || '');
    const key = websiteHost || `${company}::${email || 'no-email'}`;

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    results.push(lead);
  }

  return results;
}

async function getVerifiedLeadRows(tenantId, limit, filters = {}) {
  const supabase = getServiceSupabase();
  let query = supabase
    .from('leads')
    .select('id, name, title, company, email, linkedin_url, source, icp_score, status, created_at, notes')
    .order('icp_score', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(Math.max(limit * 5, 50));

  if (tenantId) {
    query = query.eq('tenant_id', tenantId);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return dedupeLeads((data || []).filter((lead) => leadMatchesRequest(lead, filters))).slice(0, limit);
}

function sortLeadsForDisplay(leads, wantsContactDetails) {
  if (!wantsContactDetails) {
    return leads;
  }

  return [...leads].sort((a, b) => {
    const aNotes = (() => {
      try { return JSON.parse(a.notes || '{}'); } catch { return {}; }
    })();
    const bNotes = (() => {
      try { return JSON.parse(b.notes || '{}'); } catch { return {}; }
    })();

    const aScore = (a.email ? 2 : 0) + (aNotes.phone ? 1 : 0) + (aNotes.website ? 1 : 0);
    const bScore = (b.email ? 2 : 0) + (bNotes.phone ? 1 : 0) + (bNotes.website ? 1 : 0);
    return bScore - aScore;
  });
}

function parseLeadNotes(lead) {
  try {
    return JSON.parse(lead.notes || '{}');
  } catch {
    return {};
  }
}

const COMMON_MAILBOX_PREFIXES = ['hello', 'info', 'contact', 'sales', 'team', 'admin', 'support', 'talk'];
const TRAILING_EMAIL_NOISE = ['verified', 'phone', 'mobile', 'call', 'tel', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

function repairDisplayEmailCandidate(candidate) {
  let email = String(candidate || '')
    .replace(/^mailto:/i, '')
    .replace(/[)>.,;:]+$/g, '')
    .trim()
    .toLowerCase();

  if (!email.includes('@')) {
    return null;
  }

  let [localPart, domainPart] = email.split('@');
  if (!localPart || !domainPart) {
    return null;
  }

  const mailboxHits = COMMON_MAILBOX_PREFIXES
    .map((prefix) => ({ prefix, index: localPart.lastIndexOf(prefix) }))
    .filter((hit) => hit.index > 0);

  if (mailboxHits.length > 0) {
    const bestHit = mailboxHits.sort((a, b) => b.index - a.index)[0];
    localPart = localPart.slice(bestHit.index);
  }

  const labels = domainPart.split('.');
  if (labels.length >= 2) {
    const tld = labels[labels.length - 1];
    for (const noise of TRAILING_EMAIL_NOISE) {
      if (tld.endsWith(noise) && tld.length - noise.length >= 2) {
        labels[labels.length - 1] = tld.slice(0, -noise.length);
        break;
      }
    }
    domainPart = labels.join('.');
  }

  return `${localPart}@${domainPart}`;
}

function normalizeDisplayEmail(value) {
  const raw = String(value || '').trim();
  if (!raw) return null;

  const matches = raw.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || [];
  for (const match of matches) {
    const email = repairDisplayEmailCandidate(match);
    if (!email || !/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,24}$/i.test(email)) {
      continue;
    }
    if (email.endsWith('@sentry.wixpress.com') || email.startsWith('noreply@') || email.startsWith('no-reply@')) {
      continue;
    }
    const localPart = email.split('@')[0] || '';
    if (!/^[a-z]+([._-][a-z]+){0,2}$/.test(localPart) && !/^(hello|info|contact|sales|team|admin|support|talk)$/.test(localPart)) {
      continue;
    }
    return email;
  }

  return null;
}

function normalizeDisplayPhone(value) {
  const raw = String(value || '');
  const digits = raw.replace(/\D/g, '');
  if (digits.length < 10 || digits.length > 15) {
    return null;
  }
  return digits;
}

function normalizeDisplayName(lead, noteData) {
  const rawName = String(lead.name || '').trim();
  const company = String(lead.company || '').trim();
  const ownerName = String(noteData.owner_name || '').trim();

  if (/^[A-Z][A-Za-z.'-]+(?:\s+[A-Z][A-Za-z.'-]+){1,3}$/.test(rawName)
    && !/\b(find out|rankings|verified|hello|agency|marketing|media|plumbing)\b/i.test(rawName)) {
    return rawName;
  }

  if (/^[A-Z][A-Za-z.'-]+(?:\s+[A-Z][A-Za-z.'-]+){1,3}$/.test(ownerName)
    && !/\b(find out|rankings|verified|hello|agency|marketing|media|plumbing)\b/i.test(ownerName)) {
    return ownerName;
  }

  return company || rawName || 'Unknown lead';
}

function formatVerifiedLeadResponse(
  leads,
  requestedCount,
  wantsContactDetails,
  scrapeSummary = null,
  scrapeError = null
) {
  if (leads.length === 0) {
    if (scrapeError) {
      return [
        `I don't have any verified leads in the database yet, and the live scraper failed just now.`,
        `Scraper error: ${scrapeError}`,
        `I won't make leads up. Once the scraper is working, ask again and I'll return only real results stored in the database.`
      ].join('\n');
    }

    return `I don't have any verified leads in the database yet. I won't make them up. If you want, I can help you ingest real leads first and then list them here.`;
  }

  const lines = [];
  lines.push(`I found ${leads.length} verified lead${leads.length === 1 ? '' : 's'} in the database${leads.length < requestedCount ? `, not ${requestedCount}` : ''}.`);

  if (scrapeSummary) {
    lines.push(`I also ran the finder swarm just now: inserted ${scrapeSummary.inserted} new lead seed${scrapeSummary.inserted === 1 ? '' : 's'} across ${scrapeSummary.runs.length} scout run${scrapeSummary.runs.length === 1 ? '' : 's'}.`);
  }

  if (wantsContactDetails) {
    lines.push(`I'll only show contact fields that actually exist in the system. Phone and website may come from scraper metadata, and email will only appear when it was actually found. I won't fabricate any of it.`);
  }

  leads.forEach((lead, index) => {
    const parts = [];
    const noteData = parseLeadNotes(lead);
    const displayName = normalizeDisplayName(lead, noteData);
    const displayEmail = normalizeDisplayEmail(lead.email || noteData.raw_email || null);
    const displayPhone = normalizeDisplayPhone(noteData.phone || noteData.raw_phone || null);
    const displayWebsite = noteData.website || null;
    const displayTitle = displayName === (lead.company || '').trim() ? 'Local Business' : (lead.title || 'Owner / Operator');

    const companySuffix = lead.company && displayName !== lead.company.trim() ? ` at ${lead.company}` : '';
    parts.push(`${index + 1}. ${displayName}${displayTitle ? `, ${displayTitle}` : ''}${companySuffix}`);

    const metadata = [
      displayEmail ? `email: ${displayEmail}` : wantsContactDetails ? 'email: not available' : null,
      wantsContactDetails ? `phone: ${displayPhone || 'not available'}` : null,
      displayWebsite ? `website: ${displayWebsite}` : null,
      lead.icp_score !== null && lead.icp_score !== undefined ? `ICP: ${lead.icp_score}` : null,
      lead.status ? `status: ${lead.status}` : null,
      lead.source ? `source: ${lead.source}` : null
    ].filter(Boolean);

    if (metadata.length > 0) {
      parts.push(`   ${metadata.join(' | ')}`);
    }

    lines.push(parts.join('\n'));
  });

  lines.push(`Next step: if you want, I can filter these to only leads with verified emails, highest ICP scores, or a specific source.`);
  return lines.join('\n');
}

export const answerLeadRequest = withAgentErrorHandling(
  {
    agentName: 'Jax',
    action: 'answer_lead_request_failed',
    getContext: ([, tenantId]) => ({ tenantId })
  },
  async (userMessage, tenantId = null) => {
    const tenantConfig = tenantId ? await getTenantConfig(tenantId).catch(() => null) : null;
    const { count: requestedCount, location, category } = parseLeadSearchParams(userMessage, tenantConfig);
    const wantsContactDetails = looksLikeContactDetailRequest(userMessage);

    await cleanupScrapedLeads(tenantId).catch(() => null);

    let leads = await getVerifiedLeadRows(tenantId, requestedCount, { location, category });
    let scrapeSummary = null;
    let scrapeError = null;

    if (leads.length < requestedCount) {
      try {
        scrapeSummary = await runLeadFinderSwarm({
          tenantId,
          targetCount: requestedCount - leads.length,
          location,
          category
        });
      } catch (error) {
        scrapeError = error.message;
      }

      leads = await getVerifiedLeadRows(tenantId, requestedCount, { location, category });
    }

    return formatVerifiedLeadResponse(
      sortLeadsForDisplay(leads, wantsContactDetails),
      requestedCount,
      wantsContactDetails,
      scrapeSummary,
      scrapeError
    );
  }
);

export const getUndeliveredBrief = withAgentErrorHandling(
  {
    agentName: 'Jax',
    action: 'get_undelivered_brief_failed',
    getContext: ([tenantId]) => ({ tenantId })
  },
  async (tenantId) => {
  const supabase = getServiceSupabase();
  const today = new Date().toISOString().slice(0, 10);
  let query = supabase
    .from('daily_reports')
    .select('*')
    .eq('date', today)
    .eq('delivered', false);

  if (tenantId) {
    query = query.eq('tenant_id', tenantId);
  }

  const { data } = await query.maybeSingle();

  if (!data) {
    return null;
  }

  await supabase.from('daily_reports').update({ delivered: true }).eq('id', data.id);
  return data.summary;
  }
);

export const jax = withAgentErrorHandling(
  {
    agentName: 'Jax',
    action: 'respond_failed',
    getContext: ([, , tenantId]) => ({ tenantId })
  },
  async (userMessage, conversationHistory = [], tenantId = null) => {
  const supabase = getServiceSupabase();
  const tenantConfig = tenantId ? await getTenantConfig(tenantId).catch(() => null) : null;
  const shouldIncludeOpsContext = looksLikeBriefRequest(userMessage);
  const shouldAnswerFromLeadData = looksLikeLeadRequest(userMessage);
  const promptPrefix = tenantConfig ? buildJaxSystemPrompt(tenantConfig) : '';
  let systemContent = [promptPrefix, BASE_JAX_SYSTEM_PROMPT].filter(Boolean).join('\n\n');

  let opsContext = null;

  if (shouldIncludeOpsContext) {
    const [pipeline, brief] = await Promise.all([
      getPipelineHealth(tenantId),
      generateDailyBrief(tenantId).catch(() => null)
    ]);

    opsContext = { pipeline, brief };
  }

  if (conversationHistory.length === 0) {
    const brief = await getUndeliveredBrief(tenantId);
    if (brief) {
      systemContent += `\n\nMORNING BRIEF (deliver this at the start of the conversation):\n${brief}`;
    }
  }

  if (shouldAnswerFromLeadData) {
    const response = await answerLeadRequest(userMessage, tenantId);

    await supabase.from('agent_log').insert({
      agent_name: 'Jax',
      action: 'responded_with_verified_leads',
      tenant_id: tenantId,
      result: response.slice(0, 200)
    });

    return response;
  }

  const messages = [
    { role: 'system', content: systemContent },
    ...conversationHistory,
    ...(opsContext ? [{ role: 'system', content: buildContextBlock(opsContext) }] : []),
    { role: 'user', content: userMessage }
  ];

  const response = await callGroq({
    model: MODELS.SMART,
    messages,
    temperature: 0.4,
    max_tokens: 700
  });

  await supabase.from('agent_log').insert({
    agent_name: 'Jax',
    action: 'responded_to_owner',
    tenant_id: tenantId,
    result: response.slice(0, 200)
  });

  return response;
  }
);
