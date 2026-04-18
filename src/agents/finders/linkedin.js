import { getServiceSupabase } from '../../lib/supabase.js';
import { withAgentErrorHandling } from '../../lib/agents.js';

export const LINKEDIN_QUERIES = [
  'VP People Operations',
  'Chief People Officer',
  'Head of HR',
  'Director of Talent',
  'VP Human Resources',
  'People and Culture Manager',
  'Head of Organizational Development',
  'Director of Employee Experience',
  'Founder CEO startup team',
  'COO operations leadership team'
];

export const scrapeLinkedInSearch = withAgentErrorHandling(
  {
    agentName: 'Ravi',
    action: 'scrape_linkedin_search_failed'
  },
  async ({ query, location = 'United States', maxResults = 20 }) => {
  const googleQuery = `site:linkedin.com/in "${query}" "${location}"`;
  const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(googleQuery)}&num=${maxResults}`;

  const response = await fetch(searchUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0',
      Accept: 'text/html,application/xhtml+xml',
      'Accept-Language': 'en-US,en;q=0.9'
    }
  });

  if (!response.ok) {
    throw new Error(`LinkedIn scout search failed: ${response.status}`);
  }

  const html = await response.text();

  return [...html.matchAll(/linkedin\.com\/in\/([a-zA-Z0-9-]+)/g)]
    .map((match) => `https://linkedin.com/in/${match[1]}`)
    .filter((value, index, values) => values.indexOf(value) === index)
    .slice(0, maxResults);
  }
);

function inferNameFromLinkedInUrl(linkedinUrl) {
  const slug = linkedinUrl.split('/in/')[1]?.replace(/\/$/, '') || '';
  const cleaned = slug
    .replace(/[-_]+/g, ' ')
    .replace(/\b\d+\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) {
    return null;
  }

  return cleaned
    .split(' ')
    .slice(0, 4)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

export const runLinkedInScout = withAgentErrorHandling(
  {
    agentName: 'Ravi',
    action: 'run_linkedin_scout_failed',
    getContext: ([options]) => ({ tenantId: options?.tenantId || null })
  },
  async ({
    agentName = 'Ravi',
    tenantId = null,
    query = null,
    location = 'United States',
    maxResults = 20
  } = {}) => {
  const supabase = getServiceSupabase();
  const selectedQuery = query || LINKEDIN_QUERIES[Math.floor(Math.random() * LINKEDIN_QUERIES.length)];
  const urls = await scrapeLinkedInSearch({ query: selectedQuery, location, maxResults });
  let inserted = 0;

  for (const linkedin_url of urls) {
    let existingQuery = supabase
      .from('leads')
      .select('id')
      .eq('linkedin_url', linkedin_url);

    if (tenantId) {
      existingQuery = existingQuery.eq('tenant_id', tenantId);
    }

    const { data: existing } = await existingQuery.maybeSingle();

    if (!existing) {
      await supabase.from('leads').insert({
        tenant_id: tenantId,
        name: inferNameFromLinkedInUrl(linkedin_url),
        linkedin_url,
        source: 'linkedin',
        status: 'new',
        assigned_agent: agentName
      });
      inserted += 1;
    }
  }

  await supabase.from('agent_log').insert({
    agent_name: agentName,
    action: 'linkedin_scrape',
    tenant_id: tenantId,
    result: `Found ${urls.length} LinkedIn profiles for query: ${selectedQuery}. Inserted ${inserted}.`
  });

  return { query: selectedQuery, found: urls.length, inserted, urls };
  }
);
