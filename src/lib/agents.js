import { logAgentError } from './logging.js';

export function withAgentErrorHandling(options, fn) {
  const {
    agentName = 'Agent',
    action = 'agent_failure',
    getContext = null
  } = options || {};

  return async function wrappedAgentFunction(...args) {
    try {
      return await fn(...args);
    } catch (error) {
      const context = typeof getContext === 'function' ? getContext(args, error) || {} : {};

      await logAgentError({
        agentName,
        action,
        error,
        tenantId: context.tenantId ?? null,
        leadId: context.leadId ?? null,
        result: context.result ?? null
      });

      throw error;
    }
  };
}
