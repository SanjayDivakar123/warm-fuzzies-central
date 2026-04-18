import { logAgentError } from './logging.js';

export class HttpError extends Error {
  constructor(status, message, details = null) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.details = details;
  }
}

export function badRequest(message, details = null) {
  return new HttpError(400, message, details);
}

export function unauthorized(message = 'Unauthorized', details = null) {
  return new HttpError(401, message, details);
}

export function methodNotAllowed(method) {
  return new HttpError(405, `Method ${method} not allowed`);
}

export function requireFields(source, fields, location = 'body') {
  const payload = source && typeof source === 'object' ? source : {};
  const missing = fields.filter((field) => {
    const value = payload[field];
    return value === undefined || value === null || value === '';
  });

  if (missing.length > 0) {
    throw badRequest(`Missing required ${location} field${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}`, {
      missing
    });
  }

  return payload;
}

export function requireMethod(req, methods) {
  const allowedMethods = Array.isArray(methods) ? methods : [methods];

  if (!allowedMethods.includes(req.method)) {
    throw methodNotAllowed(req.method);
  }
}

export function withApiHandler(options, handler) {
  const {
    agentName = 'API',
    action = 'request_failed',
    methods = null,
    validate = null,
    getErrorContext = null
  } = options || {};

  return async function wrappedApiHandler(req, res) {
    try {
      if (methods) {
        requireMethod(req, methods);
      }

      const validated = validate ? await validate(req) : undefined;
      await handler(req, res, validated);
    } catch (error) {
      const status = error instanceof HttpError ? error.status : 500;
      const context = typeof getErrorContext === 'function' ? getErrorContext(req, error) || {} : {};

      await logAgentError({
        agentName,
        action,
        error,
        tenantId: context.tenantId ?? null,
        leadId: context.leadId ?? null,
        result: context.result ?? null
      });

      if (res.headersSent) {
        return;
      }

      const payload = { error: error.message };
      if (error instanceof HttpError && error.details) {
        payload.details = error.details;
      }

      res.status(status).json(payload);
    }
  };
}
