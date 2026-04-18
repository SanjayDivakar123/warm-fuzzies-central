import { spawn } from 'node:child_process';
import path from 'node:path';
import { withAgentErrorHandling } from '../../lib/agents.js';
import { getServiceSupabase } from '../../lib/supabase.js';

function projectRoot() {
  return process.cwd();
}

function scraperDir() {
  return path.join(projectRoot(), 'scraper');
}

function getPythonBin() {
  const configured = process.env.SCRAPER_PYTHON_BIN;
  if (configured) return configured;

  const bundledVenvPython = path.join(scraperDir(), 'venv', 'bin', 'python');
  return bundledVenvPython;
}

function buildScraperEnv() {
  return {
    PATH: process.env.PATH,
    HOME: process.env.HOME,
    LANG: process.env.LANG || 'en_US.UTF-8',
    LC_ALL: process.env.LC_ALL || 'en_US.UTF-8',
    PYTHONUNBUFFERED: '1'
  };
}

function runBridge({ location, category, limit }) {
  return new Promise((resolve, reject) => {
    const bridgePath = path.join(scraperDir(), 'jax_bridge.py');
    const child = spawn(
      getPythonBin(),
      [bridgePath, '--location', location, '--category', category, '--limit', String(limit)],
      {
        cwd: scraperDir(),
        env: buildScraperEnv()
      }
    );

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += String(chunk);
    });

    child.stderr.on('data', (chunk) => {
      stderr += String(chunk);
    });

    child.on('error', reject);
    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(stderr || `External scraper exited with code ${code}`));
        return;
      }

      try {
        resolve(JSON.parse(stdout.trim()));
      } catch (error) {
        reject(new Error(`External scraper returned invalid JSON: ${stdout || error.message}`));
      }
    });
  });
}

function buildLeadNotes(result, context = {}) {
  const cleanedWebsite = normalizeWebsite(result.website);
  const cleanedPhone = normalizePhone(result.phone);

  return JSON.stringify({
    lead_type: 'business',
    search_category: context.category || null,
    search_location: context.location || null,
    owner_name: result.owner_name || null,
    raw_email: result.email || null,
    raw_phone: result.phone || null,
    raw_website: result.website || null,
    phone: cleanedPhone,
    website: cleanedWebsite,
    address: result.address || null,
    city: result.city || null,
    state: result.state || null,
    zip_code: result.zip_code || null,
    rating: result.rating || null,
    review_count: result.review_count || null,
    gmb_url: result.gmb_url || null,
    scraper: 'external_gmb'
  });
}

function looksLikePersonName(value) {
  if (!value) return false;

  const normalized = String(value).trim();
  if (normalized.length < 5 || normalized.length > 60) return false;
  if (!/^[A-Z][A-Za-z.'-]+(?:\s+[A-Z][A-Za-z.'-]+){1,3}$/.test(normalized)) {
    return false;
  }
  if (/\b(plumbing|service|services|drain|heating|cooling|company|agency|media|marketing|digital|roofing|electric|electrician|hvac|llc|inc|corp|group)\b/i.test(normalized)) {
    return false;
  }
  if (/\b(find out|rankings|verified|contact|support|hello|team)\b/i.test(normalized)) {
    return false;
  }

  return true;
}

function normalizeWhitespace(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function normalizeWebsite(value) {
  if (!value) return null;

  try {
    const url = new URL(String(value).trim());
    url.hash = '';
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid'].forEach((key) => {
      url.searchParams.delete(key);
    });
    return url.toString().replace(/\/$/, '');
  } catch {
    return null;
  }
}

function normalizeHost(hostname) {
  return String(hostname || '').replace(/^www\./i, '').toLowerCase();
}

function getRootDomain(hostname) {
  const host = normalizeHost(hostname);
  const parts = host.split('.').filter(Boolean);
  if (parts.length <= 2) {
    return host;
  }

  const secondLevelSuffixes = new Set(['co', 'com', 'org', 'net', 'gov', 'ac']);
  const last = parts[parts.length - 1];
  const secondLast = parts[parts.length - 2];

  if (last.length === 2 && secondLevelSuffixes.has(secondLast) && parts.length >= 3) {
    return parts.slice(-3).join('.');
  }

  return parts.slice(-2).join('.');
}

function extractWebsiteDomain(website) {
  if (!website) return null;
  try {
    const url = new URL(website);
    return getRootDomain(url.hostname);
  } catch {
    return null;
  }
}

function normalizePhone(value) {
  if (!value) return null;
  const normalized = String(value).replace(/[^\d+]/g, '');
  const digits = normalized.replace(/\D/g, '');
  if (digits.length < 10 || digits.length > 15) {
    return null;
  }
  return normalized.startsWith('+') ? normalized : digits;
}

const COMMON_MAILBOX_PREFIXES = ['hello', 'info', 'contact', 'sales', 'team', 'admin', 'support', 'talk'];
const TRAILING_EMAIL_NOISE = ['verified', 'phone', 'mobile', 'call', 'tel', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

function extractCandidateEmails(value) {
  const input = normalizeWhitespace(value);
  if (!input) return [];

  const matches = input.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || [];
  const repaired = [];

  for (const match of matches) {
    repaired.push(match);

    if (/Verified$/i.test(match)) {
      repaired.push(match.replace(/Verified$/i, ''));
    }
  }

  const embedded = input.match(/[A-Za-z._%+-]*hello@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || [];
  repaired.push(...embedded.map((item) => item.replace(/^[A-Za-z._%+-]*?(hello@)/i, '$1')));

  return [...new Set(repaired.map((item) => item.trim()))];
}

function repairEmailCandidate(candidate) {
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

  email = `${localPart}@${domainPart}`;
  return email;
}

function isBlockedEmail(email) {
  const lower = email.toLowerCase();
  const blockedDomains = [
    'sentry.wixpress.com',
    'users.noreply.github.com',
    'example.com',
    'localhost'
  ];

  const blockedPrefixes = ['noreply@', 'no-reply@', 'donotreply@', 'do-not-reply@'];

  return blockedDomains.some((domain) => lower.endsWith(`@${domain}`) || lower === domain)
    || blockedPrefixes.some((prefix) => lower.startsWith(prefix));
}

function isReasonableMailbox(localPart) {
  if (!localPart || localPart.length < 2 || localPart.length > 32) {
    return false;
  }

  if (/^\d+$/.test(localPart)) {
    return false;
  }

  if (COMMON_MAILBOX_PREFIXES.includes(localPart)) {
    return true;
  }

  if (/^[a-z]+([._-][a-z]+){0,2}$/.test(localPart)) {
    return true;
  }

  if (/^[a-z]{2,12}\d{0,4}$/.test(localPart)) {
    return true;
  }

  return false;
}

function emailMatchesWebsite(email, website) {
  const websiteDomain = extractWebsiteDomain(website);
  if (!websiteDomain) {
    return true;
  }

  const emailDomain = getRootDomain(email.split('@')[1] || '');
  return Boolean(emailDomain) && emailDomain === websiteDomain;
}

function normalizeEmail(value, website = null) {
  for (const candidate of extractCandidateEmails(value)) {
    const email = repairEmailCandidate(candidate);

    if (!email || !/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,24}$/i.test(email)) {
      continue;
    }
    if (isBlockedEmail(email)) {
      continue;
    }
    if (/\.\./.test(email) || /@\./.test(email)) {
      continue;
    }
    if (!isReasonableMailbox(email.split('@')[0])) {
      continue;
    }
    if (!emailMatchesWebsite(email, website)) {
      continue;
    }

    return email;
  }

  return null;
}

function pickLeadIdentity(result) {
  const company = normalizeWhitespace(result.company || result.name || 'Unknown company');
  const ownerName = looksLikePersonName(result.owner_name) ? result.owner_name.trim() : null;

  return {
    name: ownerName || company,
    title: ownerName ? 'Owner / Operator' : 'Local Business',
    company
  };
}

async function leadExists(supabase, tenantId, result) {
  const cleanedEmail = normalizeEmail(result.email, result.website);
  const cleanedWebsite = normalizeWebsite(result.website);

  if (cleanedEmail) {
    let query = supabase.from('leads').select('id').eq('email', cleanedEmail).limit(1);
    if (tenantId) query = query.eq('tenant_id', tenantId);
    const { data } = await query.maybeSingle();
    if (data) return true;
  }

  if (cleanedWebsite) {
    let query = supabase.from('leads').select('id, notes').eq('company', result.company).limit(20);
    if (tenantId) query = query.eq('tenant_id', tenantId);
    const { data } = await query;
    if ((data || []).some((lead) => {
      try {
        return JSON.parse(lead.notes || '{}').website === cleanedWebsite;
      } catch {
        return false;
      }
    })) {
      return true;
    }
  }

  return false;
}

export const runExternalScraper = withAgentErrorHandling(
  {
    agentName: 'Scraper Bridge',
    action: 'run_external_scraper_failed'
  },
  async ({ location, category, limit = 10 }) => {
    return runBridge({ location, category, limit });
  }
);

export const importScrapedLeads = withAgentErrorHandling(
  {
    agentName: 'Scraper Bridge',
    action: 'import_scraped_leads_failed',
    getContext: ([, tenantId]) => ({ tenantId })
  },
  async (scrapeResults, tenantId = null, context = {}) => {
    const supabase = getServiceSupabase();
    const imported = [];

    for (const result of scrapeResults || []) {
      const exists = await leadExists(supabase, tenantId, result);
      if (exists) {
        continue;
      }

      const identity = pickLeadIdentity(result);
      const cleanedEmail = normalizeEmail(result.email, result.website);

      const payload = {
        tenant_id: tenantId,
        name: identity.name,
        title: result.category || identity.title,
        company: identity.company,
        email: cleanedEmail,
        linkedin_url: result.linkedin_url || null,
        source: 'gmb_scraper',
        status: 'new',
        notes: buildLeadNotes(result, context),
        assigned_agent: 'Scraper Bridge'
      };

      const { data, error } = await supabase.from('leads').insert(payload).select().single();
      if (error) {
        throw error;
      }
      imported.push(data);
    }

    return imported;
  }
);

export const cleanupScrapedLeads = withAgentErrorHandling(
  {
    agentName: 'Scraper Bridge',
    action: 'cleanup_scraped_leads_failed',
    getContext: ([tenantId]) => ({ tenantId })
  },
  async (tenantId = null, limit = 250) => {
    const supabase = getServiceSupabase();
    let query = supabase
      .from('leads')
      .select('id, tenant_id, name, title, company, email, notes, source')
      .eq('source', 'gmb_scraper')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (tenantId) {
      query = query.eq('tenant_id', tenantId);
    }

    const { data: leads, error } = await query;
    if (error) {
      throw error;
    }

    let updated = 0;

    for (const lead of leads || []) {
      let notes = {};
      try {
        notes = JSON.parse(lead.notes || '{}');
      } catch {
        notes = {};
      }

      const website = normalizeWebsite(notes.website || notes.raw_website || null);
      const phone = normalizePhone(notes.phone || notes.raw_phone || null);
      const email = normalizeEmail(lead.email || notes.raw_email || null, website);
      const displayName = looksLikePersonName(lead.name) ? lead.name.trim() : (normalizeWhitespace(lead.company || lead.name || 'Unknown company'));
      const nextTitle = displayName === normalizeWhitespace(lead.company || '') ? 'Local Business' : (lead.title || 'Owner / Operator');
      const nextNotes = {
        ...notes,
        phone,
        website,
        raw_email: notes.raw_email || lead.email || null,
        raw_phone: notes.raw_phone || null,
        raw_website: notes.raw_website || notes.website || null,
        lead_type: 'business'
      };

      const nextPayload = {
        name: displayName,
        title: nextTitle,
        email,
        notes: JSON.stringify(nextNotes)
      };

      const changed =
        nextPayload.name !== lead.name
        || nextPayload.title !== lead.title
        || (nextPayload.email || null) !== (lead.email || null)
        || nextPayload.notes !== (lead.notes || '');

      if (!changed) {
        continue;
      }

      const { error: updateError } = await supabase
        .from('leads')
        .update(nextPayload)
        .eq('id', lead.id);

      if (updateError) {
        throw updateError;
      }

      updated += 1;
    }

    return { scanned: (leads || []).length, updated };
  }
);
