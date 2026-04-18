import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import express from 'express';
import dotenv from 'dotenv';
import { logAgentError, logRequestLine, serializeError } from './src/lib/logging.js';
import { validateRequiredEnvVars, verifySupabaseConnection } from './src/lib/startup.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const apiRoot = path.join(__dirname, 'api');
const port = Number(process.env.PORT || 3000);
process.env.PORT = String(port);

const app = express();
app.set('trust proxy', 1);

const allowedOrigins = new Set(
  [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    process.env.VERCEL_URL
  ].filter(Boolean)
);

const jaxRateLimitWindowMs = 60 * 1000;
const jaxRateLimitMax = 60;
const jaxRateLimitStore = new Map();

function applyCors(req, res) {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Stripe-Signature');
}

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }

  return req.ip || req.socket?.remoteAddress || 'unknown';
}

app.use((req, res, next) => {
  const startedAt = Date.now();

  applyCors(req, res);
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  res.on('finish', () => {
    logRequestLine({
      method: req.method,
      path: req.originalUrl || req.path,
      statusCode: res.statusCode,
      durationMs: Date.now() - startedAt
    });
  });

  next();
});

app.use('/api/jax', (req, res, next) => {
  const now = Date.now();
  const ip = getClientIp(req);
  const windowStart = now - jaxRateLimitWindowMs;
  const recentRequests = (jaxRateLimitStore.get(ip) || []).filter((timestamp) => timestamp > windowStart);

  if (recentRequests.length >= jaxRateLimitMax) {
    res.status(429).json({ error: 'Rate limit exceeded. Max 60 requests per minute per IP.' });
    return;
  }

  recentRequests.push(now);
  jaxRateLimitStore.set(ip, recentRequests);
  next();
});

app.use('/api/webhook', express.raw({ type: '*/*' }));
app.use('/api', (req, res, next) => {
  if (req.path.startsWith('/webhook/')) {
    next();
    return;
  }

  express.json({ limit: '10mb' })(req, res, next);
});
app.use('/api', express.urlencoded({ extended: true }));
app.use(async (error, req, res, next) => {
  if (!error) {
    next();
    return;
  }

  if (error instanceof SyntaxError && 'body' in error) {
    await logAgentError({
      agentName: 'API',
      action: 'invalid_json',
      error,
      result: `${req.method} ${req.originalUrl || req.path}`
    });
    res.status(400).json({ error: 'Invalid JSON body.' });
    return;
  }

  next(error);
});

function normalizeRoute(filePath) {
  const relativePath = path.relative(apiRoot, filePath).replace(/\\/g, '/');
  return `/api/${relativePath.replace(/\.js$/, '')}`;
}

async function collectApiFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        return collectApiFiles(fullPath);
      }
      return entry.isFile() && entry.name.endsWith('.js') ? [fullPath] : [];
    })
  );

  return files.flat();
}

async function mountApiRoutes() {
  const files = await collectApiFiles(apiRoot);
  const mountedRoutes = [];

  await Promise.all(
    files.map(async (filePath) => {
      const routePath = normalizeRoute(filePath);
      const moduleUrl = pathToFileURL(filePath).href;
      const imported = await import(moduleUrl);
      const handler = imported.default;

      if (typeof handler !== 'function') {
        throw new Error(`API module ${filePath} does not export a default handler`);
      }

      mountedRoutes.push(routePath);
      app.all(routePath, async (req, res) => {
        try {
          await handler(req, res);
        } catch (error) {
          console.error(`Unhandled route error for ${routePath}: ${serializeError(error)}`);
          if (!res.headersSent) {
            res.status(500).json({ error: error.message });
          }
        }
      });
    })
  );

  mountedRoutes.sort().forEach((routePath) => {
    console.log(`Mounted ${routePath}`);
  });
}

validateRequiredEnvVars();
await verifySupabaseConnection();
await mountApiRoutes();

const server = app.listen(port, () => {
  console.log(`API server listening on http://localhost:${port}`);
});

server.on('error', (error) => {
  if (error?.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use. Stop the existing API server first, then restart Jax.`);
    process.exit(1);
  }

  console.error(`Server failed to start: ${serializeError(error)}`);
  process.exit(1);
});
