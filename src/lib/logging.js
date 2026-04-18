import { getServiceSupabase } from './supabase.js';

export function serializeError(error) {
  if (!error) {
    return 'Unknown error';
  }

  if (error instanceof Error) {
    return error.stack || error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

export async function logAgentError({
  agentName = 'System',
  action = 'unknown_error',
  error,
  tenantId = null,
  leadId = null,
  result = null
} = {}) {
  const message = serializeError(error);

  console.error(`[${agentName}] ${action} failed: ${message}`);

  try {
    const supabase = getServiceSupabase();
    await supabase.from('agent_log').insert({
      agent_name: agentName,
      action,
      tenant_id: tenantId,
      lead_id: leadId,
      result,
      error: message
    });
  } catch (loggingError) {
    console.error(`[System] failed to persist agent_log entry: ${serializeError(loggingError)}`);
  }
}

export function logRequestLine({ method, path, statusCode, durationMs }) {
  console.log(
    `${method.padEnd(6)} ${String(statusCode).padEnd(3)} ${path} ${String(durationMs).padStart(4)}ms`
  );
}
