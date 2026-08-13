/**
 * Recura server — HTTP entry point.
 *
 * Serves:
 *   * the built SPA (dist/) and the installer entry (dist/installer/index.html)
 *   * /api/install/*    installer endpoints (locked out after INSTALLED)
 *   * /api/auth/*       app-session bootstrap (login/logout hooks)
 *   * /api/db           data API (DatabaseAdapter contract over HTTP)
 *
 * SECURITY enforced here:
 *   * CSRF double-submit cookie on every state-changing /api request
 *   * per-IP rate limiting (installer / auth / data buckets)
 *   * JSON bodies capped at 1 MB
 *   * installer routes gated on server-side installation state
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { logger } from './logger.js';
import { INSTALL_STATUS, getInstallStatus } from './config.js';
import { getPgModule } from './driver.js';
import {
  createAppSession, destroyAppSession,
  checkCsrf, newCsrfToken, CSRF_COOKIE_NAME, allowRequest,
} from './auth.js';
import * as install from './install.js';
import { handleDataApi } from './appApi.js';
import { verifyPassword } from './hash.js';
import { queryOne, queryAll } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const INSTALLER_HTML = path.join(DIST, 'installer', 'index.html');
const SPA_HTML = path.join(DIST, 'index.html');

const PORT = Number(process.env.PORT || 8787);
const MAX_BODY = 1024 * 1024; // 1 MB

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.map': 'application/json',
};

/** ---------- tiny HTTP helpers ---------- */

function sendJson(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(payload),
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  res.end(payload);
}

function parseCookies(header) {
  const out = {};
  if (!header) return out;
  for (const part of header.split(';')) {
    const eq = part.indexOf('=');
    if (eq > 0) out[part.slice(0, eq).trim()] = decodeURIComponent(part.slice(eq + 1).trim());
  }
  return out;
}

function clientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd.length > 0) return fwd.split(',')[0].trim();
  return req.socket.remoteAddress || 'unknown';
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY) {
        reject(Object.assign(new Error('Request body too large.'), { code: 'PAYLOAD_TOO_LARGE' }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      if (chunks.length === 0) { resolve({}); return; }
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch {
        reject(Object.assign(new Error('Invalid JSON body.'), { code: 'BAD_JSON' }));
      }
    });
    req.on('error', reject);
  });
}

function sendFile(res, filePath, status = 200) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(status, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Content-Length': data.length,
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable',
    });
    res.end(data);
  });
}

function safeResolve(base, requested) {
  const target = path.normalize(path.join(base, decodeURIComponent(requested)));
  if (!target.startsWith(path.normalize(base))) return null;
  return target;
}

/** ---------- API handlers ---------- */

async function handleInstallStatus(res) {
  sendJson(res, 200, install.getStatus());
}

async function handleCsrf(res) {
  const token = newCsrfToken();
  res.setHeader('Set-Cookie', `${CSRF_COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=3600`);
  sendJson(res, 200, { csrfToken: token });
}

/** Gate: installer mutating routes are locked out once installed. */
function installLocked() {
  const status = getInstallStatus();
  return status === INSTALL_STATUS.INSTALLED;
}

async function handleInstall(req, res, route, body) {
  const cookies = parseCookies(req.headers.cookie);
  if (!checkCsrf(cookies, req.headers['x-csrf-token'])) {
    return sendJson(res, 403, { ok: false, code: 'CSRF', message: 'Security token mismatch. Reload the page and try again.' });
  }
  if (installLocked() && route !== 'status') {
    return sendJson(res, 403, { ok: false, code: 'LOCKED', message: 'Recura is already installed. The installer is locked.' });
  }

  const INSTALL_ACTIONS = {
    'test-connection': () => install.testConnection(body),
    start: () => install.startInstall(body),
    migrate: () => install.runInstall(token(), body),
    admin: () => install.createAdmin(token(), body),
    verify: () => install.verifyInstallation(token()),
    complete: () => install.completeInstall(token()),
    cancel: () => install.cancelInstall(token()),
  };
  function token() {
    return String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  }

  const action = INSTALL_ACTIONS[route];
  if (!action) {
    return sendJson(res, 404, { ok: false, code: 'NOT_FOUND', message: 'Unknown install route.' });
  }

  const result = await action();
  sendJson(res, result.ok === false ? 400 : 200, result);
}

async function handleAuth(req, res, route, body) {
  switch (route) {
    case 'login': {
      const emailOrUsername = String(body?.identifier || '').trim();
      const password = String(body?.password || '');
      if (!emailOrUsername || !password) {
        return sendJson(res, 400, { ok: false, code: 'VALIDATION', message: 'Identifier and password are required.' });
      }
      const result = await handleServerLogin(emailOrUsername, password);
      return sendJson(res, result.ok ? 200 : 401, result);
    }
    case 'logout': {
      const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
      destroyAppSession(token);
      return sendJson(res, 200, { ok: true });
    }
    default:
      return sendJson(res, 404, { ok: false, code: 'NOT_FOUND', message: 'Unknown auth route.' });
  }
}

/**
 * Server-side login used by the installer to sanity-check the created admin
 * account during the verification step (and available to clients on request).
 */
async function handleServerLogin(identifier, password) {
  try {
    const client = await connect();
    try {
      const row = await queryOne(client,
        `SELECT * FROM "User" WHERE LOWER("email") = LOWER($1) OR LOWER("username") = LOWER($1) LIMIT 1`,
        [identifier]
      );
      if (!row) return { ok: false, code: 'AUTH_FAILED', message: 'Invalid credentials.' };
      const valid = await verifyPassword(password, row.passwordHash || '');
      if (!valid) return { ok: false, code: 'AUTH_FAILED', message: 'Invalid credentials.' };
      const token = createAppSession({ email: row.email, userName: row.name });
      return {
        ok: true,
        token,
        user: { id: row.id, name: row.name, username: row.username, email: row.email, role: row.role },
      };
    } finally {
      try { await client.end(); } catch { /* ignore */ }
    }
  } catch (err) {
    logger.error('auth', `Server login failed: ${err?.code ?? err?.message}`);
    return { ok: false, code: 'AUTH_FAILED', message: 'Invalid credentials.' };
  }
}

/** Helper to open a connection to the configured live database. */
async function connect() {
  const { readConfig } = await import('./config.js');
  const config = readConfig();
  if (!config) throw Object.assign(new Error('Not configured.'), { code: 'NOT_CONFIGURED' });
  const Client = getPgModule().Client;
  const client = new Client(config);
  await client.connect();
  return client;
}

/** ---------- routing ---------- */

const API_PATTERN = /^\/api\/([a-z-]+)(?:\/([a-z-]+))?/;

function handleApi(req, res, urlPath, body) {
  const m = API_PATTERN.exec(urlPath);
  if (!m) return sendJson(res, 404, { ok: false, code: 'NOT_FOUND', message: 'Not found.' });
  const area = m[1];
  const route = m[2] || '';

  // Installer and data endpoints are rate limited per IP.
  const bucket = area === 'install' ? 'install' : area === 'db' ? 'data' : 'auth';
  const limit = bucket === 'install' ? 60 : bucket === 'data' ? 240 : 30;
  if (!allowRequest(bucket, clientIp(req), limit)) {
    return sendJson(res, 429, { ok: false, code: 'RATE_LIMITED', message: 'Too many requests. Please wait a moment.' });
  }

  if (req.method === 'GET' && area === 'install' && route === 'status') {
    return handleInstallStatus(res);
  }
  if (req.method === 'GET' && area === 'csrf') {
    return handleCsrf(res);
  }
  if (req.method === 'GET' && area === 'health') {
    return sendJson(res, 200, { ok: true, status: getInstallStatus() });
  }
  if (req.method !== 'POST') {
    return sendJson(res, 405, { ok: false, code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed.' });
  }

  if (area === 'install') {
    const cookies = parseCookies(req.headers.cookie);
    if (!checkCsrf(cookies, req.headers['x-csrf-token'])) {
      return sendJson(res, 403, { ok: false, code: 'CSRF', message: 'Security token mismatch. Reload the page and try again.' });
    }
    return handleInstall(req, res, route, body);
  }
  if (area === 'auth') {
    const cookies = parseCookies(req.headers.cookie);
    if (!checkCsrf(cookies, req.headers['x-csrf-token'])) {
      return sendJson(res, 403, { ok: false, code: 'CSRF', message: 'Security token mismatch. Reload the page and try again.' });
    }
    return handleAuth(req, res, route, body);
  }
  if (area === 'db') {
    const cookies = parseCookies(req.headers.cookie);
    if (!checkCsrf(cookies, req.headers['x-csrf-token'])) {
      return sendJson(res, 403, { ok: false, code: 'CSRF', message: 'Security token mismatch. Reload the page and try again.' });
    }
    return handleDataApi(body, req.headers).then((result) => {
      sendJson(res, result.status || (result.ok ? 200 : 400), result);
    });
  }
  if (area === 'health') {
    return sendJson(res, 200, { ok: true, status: getInstallStatus() });
  }

  sendJson(res, 404, { ok: false, code: 'NOT_FOUND', message: 'Not found.' });
}

function handleStatic(req, res, urlPath) {
  const clean = urlPath.split('?')[0];

  if (clean === '/install' || clean === '/install/') {
    return fs.existsSync(INSTALLER_HTML)
      ? sendFile(res, INSTALLER_HTML)
      : sendJson(res, 503, { ok: false, code: 'NOT_BUILT', message: 'Installer is not built yet. Run "npm run build" first.' });
  }
  if (clean === '/') {
    return fs.existsSync(SPA_HTML)
      ? sendFile(res, SPA_HTML)
      : sendJson(res, 503, { ok: false, code: 'NOT_BUILT', message: 'Application is not built yet. Run "npm run build" first.' });
  }

  const resolved = safeResolve(DIST, clean);
  if (resolved) {
    if (fs.existsSync(resolved) && fs.statSync(resolved).isFile()) {
      return sendFile(res, resolved);
    }
    // SPA fallback for client-side routes (crises, settings, ...)
    if (fs.existsSync(SPA_HTML)) return sendFile(res, SPA_HTML);
  }
  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Not found');
}

function route(req, res) {
  const urlPath = req.url || '/';

  if (urlPath.startsWith('/api/')) {
    if (req.method === 'POST') {
      readBody(req).then((body) => handleApi(req, res, urlPath, body)).catch((err) => {
        const status = err?.code === 'PAYLOAD_TOO_LARGE' ? 413 : err?.code === 'BAD_JSON' ? 400 : 500;
        sendJson(res, status, { ok: false, code: err?.code || 'BAD_REQUEST', message: err?.message || 'Bad request.' });
      });
      return;
    }
    return handleApi(req, res, urlPath, {});
  }

  if (req.method === 'GET' || req.method === 'HEAD') {
    return handleStatic(req, res, urlPath);
  }

  res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Method not allowed');
}

const server = http.createServer((req, res) => {
  // SECURITY: apply hardening headers to every response
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  try {
    route(req, res);
  } catch (err) {
    logger.error('server', `Unhandled error: ${err?.message ?? err}`);
    sendJson(res, 500, { ok: false, code: 'INTERNAL', message: 'Internal server error.' });
  }
});

export function startServer(port = PORT) {
  return new Promise((resolve) => {
    server.listen(port, () => {
      const actual = server.address() && typeof server.address() === 'object' ? server.address().port : port;
      logger.info('server', `Recura server listening on port ${actual}`);
      resolve({ port: actual, server });
    });
  });
}

export async function stopServer() {
  await new Promise((resolve) => server.close(resolve));
}

// Auto-start when run directly: `node server/index.js`
const isMain =
  process.argv[1] &&
  import.meta.url === new URL(pathToFileURL(process.argv[1]).href).href;
if (isMain) {
  startServer(PORT).catch((err) => {
    logger.error('server', `Failed to start: ${err?.message ?? err}`);
    process.exit(1);
  });
}

export { server, PORT };
