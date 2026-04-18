import { withAgentErrorHandling } from '../../lib/agents.js';

export const GOOGLE_MAPS_QUERIES = [
  'technology company 50-200 employees',
  'marketing agency team leadership',
  'consulting firm people operations',
  'software company culture',
  'professional services firm HR'
];

export const scrapeGoogleMaps = withAgentErrorHandling(
  {
    agentName: 'Zara',
    action: 'scrape_google_maps_failed'
  },
  async ({ query, location = 'New York' }) => {
    const response = await fetch(
      `https://www.google.com/search?q=${encodeURIComponent(`${query} ${location} HR director email`)}`,
      {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      }
    );

    if (!response.ok) {
      throw new Error(`Google Maps scout search failed: ${response.status}`);
    }

    return response.text();
  }
);
