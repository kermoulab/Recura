/**
 * Server-side auth primitives.
 *
 *   * Install session: bearer token created by /api/install/start, expires
 *     after INSTALL_SESSION_TTL_MS, destroyed on completion.
 *   * CSRF: double-submit cookie — every POST under /api must echo the
 *     recura_csrf cookie value in the X-CSRF-Token header.
 *   * Rate limiting: per-IP sliding window, separate buckets for installer and
 *     data APIs.
 *   * App session registry: bearer tokens issued after a successful login so
 *     /api/db can be called without re-authenticating on every request.
 */

import crypto from 'node:crypto';

export const INSTALL_SESSION_TTL_MS = 30 * 60 * 1000;
export const APP_SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const CSRF_COOKIE = 'recura_csrf';

/** ---------- install session ---------- */

const installSessions = new Map(); // token -> { createdAt, expiresAt }

export function createInstallSession() {
  const token = crypto.randomBytes(32).toString('hex');
  const now = Date.now();
  installSessions.set(token, { createdAt: now, expiresAt: now + INSTALL_SESSION_TTL_MS });
  return token;
}

export function verifyInstallSession(token) {
  if (!token) return false;
  const s = installSessions.get(token);
  if (!s) return false;
  if (Date.now() > s.expiresAt) {
    installSessions.delete(token);
    return false;
  }
  return true;
}

export function destroyInstallSession(token) {
  if (token) installSessions.delete(token);
}

export function destroyAllInstallSessions() {
  installSessions.clear();
}

/** ---------- CSRF ---------- */

export function newCsrfToken() {
  return crypto.randomBytes(24).toString('hex');
}

export const CSRF_COOKIE_NAME = CSRF_COOKIE;

export function checkCsrf(cookies, header) {
  const cookie = cookies[CSRF_COOKIE];
  return Boolean(cookie && header && cookie.length >= 16 && cookie === header);
}

/** ---------- rate limiting ---------- */

const buckets = new Map(); // `${bucket}:${ip}` -> number[]

function prune(now) {
  for (const [key, stamps] of buckets) {
    const alive = stamps.filter((t) => now - t < 60_000);
    if (alive.length === 0) buckets.delete(key);
    else buckets.set(key, alive);
  }
}

/** Returns true when the request is allowed. */
export function allowRequest(bucketName, ip, limitPerMinute) {
  const now = Date.now();
  if (buckets.size > 5000) prune(now);
  const key = `${bucketName}:${ip || 'unknown'}`;
  const stamps = (buckets.get(key) || []).filter((t) => now - t < 60_000);
  if (stamps.length >= limitPerMinute) return false;
  stamps.push(now);
  buckets.set(key, stamps);
  return true;
}

/** ---------- app (data API) session registry ---------- */

const appSessions = new Map(); // token -> { email, userName, createdAt, expiresAt }

export function createAppSession({ email, userName }) {
  const token = crypto.randomBytes(32).toString('hex');
  const now = Date.now();
  appSessions.set(token, { email, userName, createdAt: now, expiresAt: now + APP_SESSION_TTL_MS });
  return token;
}

export function verifyAppSession(token) {
  if (!token) return null;
  const s = appSessions.get(token);
  if (!s) return null;
  if (Date.now() > s.expiresAt) {
    appSessions.delete(token);
    return null;
  }
  return { email: s.email, userName: s.userName };
}

export function destroyAppSession(token) {
  if (token) appSessions.delete(token);
}

export function destroyAllAppSessions() {
  appSessions.clear();
}
