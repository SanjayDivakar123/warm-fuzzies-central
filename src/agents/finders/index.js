import { withAgentErrorHandling } from '../../lib/agents.js';
import { runLinkedInScout, LINKEDIN_QUERIES } from './linkedin.js';
import { importScrapedLeads, runExternalScraper } from './external_scraper.js';

function canUseLinkedInFallback(category) {
  if (!category) return true;

  return /\b(vp|head|chief|director|founder|ceo|coo|people|talent|human resources|hr|culture|operations)\b/i.test(category);
}

export const runLeadFinderSwarm = withAgentErrorHandling(
  {
    agentName: 'Finders',
    action: 'run_lead_finder_swarm_failed',
    getContext: ([options]) => ({ tenantId: options?.tenantId || null })
  },
  async ({
    tenantId = null,
    targetCount = 10,
    location = 'New York, NY',
    category = 'marketing agency'
  } = {}) => {
    try {
      const external = await runExternalScraper({
        location,
        category,
        limit: targetCount
      });
      const imported = await importScrapedLeads(external.results || [], tenantId, {
        location,
        category
      });

      return {
        inserted: imported.length,
        imported,
        runs: [
          {
            engine: 'external_scraper',
            location,
            category,
            found: external.count || 0,
            inserted: imported.length
          }
        ]
      };
    } catch (error) {
      if (!canUseLinkedInFallback(category)) {
        throw new Error(`External scraper failed for category "${category}" in ${location}: ${error.message}`);
      }

      const maxRuns = Math.min(Math.max(targetCount, 1), 5);
      const seenQueries = new Set();
      const runs = [];
      let insertedTotal = 0;

      for (let index = 0; index < maxRuns && insertedTotal < targetCount; index += 1) {
        const query = LINKEDIN_QUERIES.find((candidate) => !seenQueries.has(candidate))
          || LINKEDIN_QUERIES[index % LINKEDIN_QUERIES.length];
        seenQueries.add(query);

        const result = await runLinkedInScout({
          agentName: 'Ravi',
          tenantId,
          query,
          location,
          maxResults: Math.min(Math.max(targetCount, 5), 20)
        });

        insertedTotal += result.inserted || 0;
        runs.push(result);
      }

      return {
        inserted: insertedTotal,
        runs,
        fallback: 'linkedin_scout',
        external_scraper_error: error.message
      };
    }
  }
);
