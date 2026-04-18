import { withAgentErrorHandling } from '../../lib/agents.js';

export const scrapeIndeedJobs = withAgentErrorHandling(
  {
    agentName: 'Nico',
    action: 'scrape_indeed_jobs_failed'
  },
  async ({ query = 'director people operations' }) => {
    const url = `https://www.indeed.com/jobs?q=${encodeURIComponent(query)}&l=United+States`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    });

    if (!response.ok) {
      throw new Error(`Job board scout failed: ${response.status}`);
    }

    const html = await response.text();

    return [...html.matchAll(/data-company-name="([^"]+)"/g)]
      .map((match) => match[1])
      .filter((value, index, values) => values.indexOf(value) === index);
  }
);
