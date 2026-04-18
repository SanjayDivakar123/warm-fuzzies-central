import { google } from 'googleapis';
import { requireEnv } from './env.js';

export function createGmailClient(senderCredentials) {
  const oauth2Client = new google.auth.OAuth2(
    requireEnv('GMAIL_CLIENT_ID'),
    requireEnv('GMAIL_CLIENT_SECRET')
  );

  oauth2Client.setCredentials(senderCredentials);

  return google.gmail({
    version: 'v1',
    auth: oauth2Client
  });
}

export function encodePlainTextEmail({ to, subject, body }) {
  const message = [
    `To: ${to}`,
    `Subject: ${subject}`,
    'Content-Type: text/plain; charset=utf-8',
    '',
    body
  ].join('\n');

  return Buffer.from(message).toString('base64url');
}
