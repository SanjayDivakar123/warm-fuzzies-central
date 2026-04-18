import 'dotenv/config';
import { getServiceSupabase } from '../src/lib/supabase.js';
import { REQUIRED_ENV_VARS } from '../src/lib/startup.js';

const checks = [];

function logResult(name, ok, detail) {
  const label = ok ? 'PASS' : 'FAIL';
  console.log(`[${label}] ${name}${detail ? ` — ${detail}` : ''}`);
  checks.push({ name, ok, detail });
}

async function checkEnvVars() {
  const missing = REQUIRED_ENV_VARS.filter((name) => !process.env[name]);

  if (missing.length > 0) {
    logResult('Environment variables', false, `Missing: ${missing.join(', ')}`);
    return false;
  }

  logResult('Environment variables', true, `Found ${REQUIRED_ENV_VARS.length} required variables`);
  return true;
}

async function checkSupabase() {
  try {
    const supabase = getServiceSupabase();
    const { error } = await supabase.from('agent_log').select('id', { head: true, count: 'exact' }).limit(1);

    if (error) {
      throw error;
    }

    logResult('Supabase connection', true, 'Connection is live');
    return true;
  } catch (error) {
    logResult('Supabase connection', false, error.message);
    return false;
  }
}

async function checkGroq() {
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'user',
            content: 'Reply with exactly OK'
          }
        ],
        temperature: 0,
        max_tokens: 5
      })
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Groq returned ${response.status}: ${body}`);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content?.trim();

    if (!content) {
      throw new Error('Groq returned an empty completion');
    }

    logResult('Groq API', true, `Received response: ${content}`);
    return true;
  } catch (error) {
    logResult('Groq API', false, error.message);
    return false;
  }
}

async function checkInboxes() {
  try {
    const supabase = getServiceSupabase();
    const { count, error } = await supabase
      .from('inboxes')
      .select('*', { count: 'exact', head: true })
      .eq('active', true);

    if (error) {
      throw error;
    }

    if (!count || count < 1) {
      throw new Error('No active inboxes found in inboxes table');
    }

    logResult('Active inbox pool', true, `${count} active inbox(es) ready`);
    return true;
  } catch (error) {
    logResult('Active inbox pool', false, error.message);
    return false;
  }
}

async function main() {
  const requiredChecks = [
    await checkEnvVars(),
    await checkSupabase(),
    await checkGroq(),
    await checkInboxes()
  ];

  const failed = checks.filter((check) => !check.ok);

  if (failed.length > 0 || requiredChecks.includes(false)) {
    console.error(`Preflight failed: ${failed.length} check(s) did not pass.`);
    process.exit(1);
  }

  console.log('Preflight passed. Production deployment checks are green.');
}

await main();
