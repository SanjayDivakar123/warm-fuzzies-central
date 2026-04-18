import { requireEnv } from './env.js';
import { logAgentError } from './logging.js';

export const MODELS = {
  FAST: 'llama-3.1-8b-instant',
  SMART: 'llama-3.3-70b-versatile'
};

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function callGroq({
  model = MODELS.FAST,
  messages,
  temperature = 0.3,
  max_tokens = 1000
}) {
  const apiKey = requireEnv('GROQ_API_KEY');
  let lastError = null;

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ model, messages, temperature, max_tokens })
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`Groq request failed (${response.status}): ${body}`);
      }

      const data = await response.json();
      return data?.choices?.[0]?.message?.content ?? '';
    } catch (error) {
      lastError = error;
      if (attempt < 2) {
        await delay(2000);
        continue;
      }
    }
  }

  await logAgentError({
    agentName: 'Groq',
    action: 'chat_completion_failed',
    error: lastError
  });

  throw lastError;
}
