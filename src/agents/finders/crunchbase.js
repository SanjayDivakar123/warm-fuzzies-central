import { withAgentErrorHandling } from '../../lib/agents.js';

export const scrapeCrunchbase = withAgentErrorHandling(
  {
    agentName: 'Leila',
    action: 'scrape_crunchbase_failed'
  },
  async ({ fundingStage = 'series-a' }) => {
    const response = await fetch(
      `https://www.google.com/search?q=${encodeURIComponent(`site:crunchbase.com/organization ${fundingStage} funded company people team`)}`,
      {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      }
    );

    if (!response.ok) {
      throw new Error(`Crunchbase scout search failed: ${response.status}`);
    }

    return response.text();
  }
);
