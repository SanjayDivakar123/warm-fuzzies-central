import 'dotenv/config';
import { createGmailClient, encodePlainTextEmail } from '../src/lib/gmail.js';

const deploymentUrl = process.argv[2] || process.env.DEPLOYMENT_URL || process.env.VERCEL_URL;

function normalizeBaseUrl(url) {
  if (!url) {
    return null;
  }

  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url.replace(/\/$/, '');
  }

  return `https://${url.replace(/\/$/, '')}`;
}

async function sendAlertEmail(subject, body) {
  const rawCredentials = process.env.SYSTEM_GMAIL_CREDENTIALS;

  if (!rawCredentials) {
    throw new Error('SYSTEM_GMAIL_CREDENTIALS is required to send deployment alerts.');
  }

  const gmail = createGmailClient(JSON.parse(rawCredentials));
  const raw = encodePlainTextEmail({
    to: 'sanjay@rolecolorfinder.com',
    subject,
    body
  });

  await gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw }
  });
}

async function main() {
  const baseUrl = normalizeBaseUrl(deploymentUrl);

  if (!baseUrl) {
    throw new Error('Deployment URL is required. Pass it as the first argument or set DEPLOYMENT_URL / VERCEL_URL.');
  }

  const endpoint = `${baseUrl}/api/jax`;
  const payload = {
    message: 'Production smoke test. Reply with a short health confirmation.',
    history: []
  };

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const rawBody = await response.text();
    let parsedBody = null;

    try {
      parsedBody = JSON.parse(rawBody);
    } catch {
      parsedBody = null;
    }

    if (!response.ok || !parsedBody?.reply || !String(parsedBody.reply).trim()) {
      const detail = `Smoke test failed for ${endpoint}

Status: ${response.status}
Response body:
${rawBody || '<empty>'}

Time: ${new Date().toISOString()}`;

      await sendAlertEmail('[ALERT] Jax production smoke test failed', detail);
      throw new Error(detail);
    }

    console.log(`Post-deploy smoke test passed for ${endpoint}`);
  } catch (error) {
    if (!/\[ALERT\]/.test(error.message)) {
      try {
        await sendAlertEmail(
          '[ALERT] Jax production smoke test failed',
          `Smoke test request crashed for ${endpoint}

Error:
${error.message}

Time: ${new Date().toISOString()}`
        );
      } catch (alertError) {
        console.error(`Failed to send alert email: ${alertError.message}`);
      }
    }

    console.error(error.message);
    process.exit(1);
  }
}

await main();
