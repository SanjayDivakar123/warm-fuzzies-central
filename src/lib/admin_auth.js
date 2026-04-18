import crypto from 'node:crypto';
import { requireEnv } from './env.js';
import { unauthorized } from './api_handler.js';

const ADMIN_COOKIE_NAME = 'jax_admin_session';
const ADMIN_SESSION_DURATION_SECONDS = 24 * 60 * 60;

function base64UrlEncode(value) {
  return Buffer.from(value).toString('base64url');
}

function base64UrlDecode(value) {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function getSigningSecret() {
  return requireEnv('ADMIN_PASSWORD');
}

function sign(value) {
  return crypto.createHmac('sha256', getSigningSecret()).update(value).digest('base64url');
}

function parseCookies(cookieHeader = '') {
  return cookieHeader
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce((cookies, part) => {
      const separatorIndex = part.indexOf('=');
      if (separatorIndex === -1) {
        return cookies;
      }

      const key = part.slice(0, separatorIndex).trim();
      const value = decodeURIComponent(part.slice(separatorIndex + 1));
      cookies[key] = value;
      return cookies;
    }, {});
}

export function createAdminSessionToken() {
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = {
    role: 'admin',
    exp: Math.floor(Date.now() / 1000) + ADMIN_SESSION_DURATION_SECONDS
  };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;
  const signature = sign(unsignedToken);
  return `${unsignedToken}.${signature}`;
}

export function verifyAdminSessionToken(token) {
  if (!token) {
    throw unauthorized('Missing admin session.');
  }

  const [encodedHeader, encodedPayload, signature] = token.split('.');
  if (!encodedHeader || !encodedPayload || !signature) {
    throw unauthorized('Invalid admin session.');
  }

  const unsignedToken = `${encodedHeader}.${encodedPayload}`;
  const expectedSignature = sign(unsignedToken);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    throw unauthorized('Invalid admin session signature.');
  }

  const payload = JSON.parse(base64UrlDecode(encodedPayload));
  if (!payload?.exp || payload.exp < Math.floor(Date.now() / 1000)) {
    throw unauthorized('Admin session expired.');
  }

  if (payload.role !== 'admin') {
    throw unauthorized('Invalid admin session role.');
  }

  return payload;
}

export function requireAdminRequest(req) {
  const cookies = parseCookies(req.headers.cookie || '');
  const token = cookies[ADMIN_COOKIE_NAME];
  return verifyAdminSessionToken(token);
}

function shouldUseSecureCookies(req = null) {
  const forwardedProto = req?.headers?.['x-forwarded-proto'];
  const host = req?.headers?.host || '';
  const isLocalHost = /^(localhost|127\.0\.0\.1)(:\d+)?$/i.test(host);

  if (typeof forwardedProto === 'string' && forwardedProto.toLowerCase().includes('https')) {
    return true;
  }

  if (req?.secure === true) {
    return true;
  }

  if (isLocalHost) {
    return false;
  }

  return process.env.NODE_ENV === 'production';
}

export function setAdminSessionCookie(req, res) {
  const token = createAdminSessionToken();
  const isSecure = shouldUseSecureCookies(req);
  const cookieParts = [
    `${ADMIN_COOKIE_NAME}=${token}`,
    'HttpOnly',
    'Path=/',
    `Max-Age=${ADMIN_SESSION_DURATION_SECONDS}`,
    'SameSite=Lax'
  ];

  if (isSecure) {
    cookieParts.push('Secure');
  }

  res.setHeader('Set-Cookie', cookieParts.join('; '));
}

export function clearAdminSessionCookie(req, res) {
  const isSecure = shouldUseSecureCookies(req);
  const cookieParts = [
    `${ADMIN_COOKIE_NAME}=`,
    'HttpOnly',
    'Path=/',
    'Max-Age=0',
    'SameSite=Lax'
  ];

  if (isSecure) {
    cookieParts.push('Secure');
  }

  res.setHeader('Set-Cookie', cookieParts.join('; '));
}

export function verifyAdminPassword(password) {
  const expected = requireEnv('ADMIN_PASSWORD');
  if (!password) {
    throw unauthorized('Password is required.');
  }

  const passwordBuffer = Buffer.from(password);
  const expectedBuffer = Buffer.from(expected);
  if (
    passwordBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(passwordBuffer, expectedBuffer)
  ) {
    throw unauthorized('Invalid admin password.');
  }

  return true;
}
