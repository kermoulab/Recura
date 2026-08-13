/**
 * Cross-origin (split hosting) integration test: boots the real server with
 * RECURA_CORS_ORIGINS configured and verifies preflight, CORS headers, the
 * SameSite=None; Secure CSRF cookie, and a cross-origin /api/db call.
 */

process.env.RECURA_CORS_ORIGINS = 'https://spa.example.com';

// Import must be dynamic: ESM hoists static imports above this assignment, so
// the server module would otherwise read an unset RECURA_CORS_ORIGINS.
const { startServer, stopServer } = await import('../index.js');

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

const SPA_ORIGIN = 'https://spa.example.com';

let base;

before(async () => {
  const { port } = await startServer(0);
  base = `http://127.0.0.1:${port}`;
});

after(async () => {
  await stopServer();
});

test('cors: preflight from an allowed origin is answered 204', async () => {
  const res = await fetch(`${base}/api/auth/login`, {
    method: 'OPTIONS',
    headers: {
      Origin: SPA_ORIGIN,
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'content-type,x-csrf-token',
    },
  });
  assert.equal(res.status, 204);
  assert.equal(res.headers.get('access-control-allow-origin'), SPA_ORIGIN);
  assert.equal(res.headers.get('access-control-allow-credentials'), 'true');
  assert.match(res.headers.get('access-control-allow-headers') || '', /x-csrf-token/i);
});

test('cors: disallowed origins get no CORS headers', async () => {
  const res = await fetch(`${base}/api/csrf`, { headers: { Origin: 'https://evil.example' } });
  assert.equal(res.headers.get('access-control-allow-origin'), null);
});

test('cors: csrf issues a SameSite=None; Secure cookie and CORS headers', async () => {
  const res = await fetch(`${base}/api/csrf`, { headers: { Origin: SPA_ORIGIN } });
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('access-control-allow-origin'), SPA_ORIGIN);
  const setCookie = res.headers.get('set-cookie') || '';
  assert.match(setCookie, /recura_csrf=/);
  assert.match(setCookie, /SameSite=None/);
  assert.match(setCookie, /Secure/);
});

test('cors: cross-origin POST is CSRF-gated and CORS-decorated', async () => {
  const csrf = await fetch(`${base}/api/csrf`, { headers: { Origin: SPA_ORIGIN } });
  const { csrfToken } = await csrf.json();
  const cookie = (csrf.headers.get('set-cookie') || '').split(';')[0];

  const res = await fetch(`${base}/api/db`, {
    method: 'POST',
    headers: {
      Origin: SPA_ORIGIN,
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken,
      Cookie: cookie,
    },
    body: JSON.stringify({ op: 'list', table: 'Customer' }),
  });
  assert.equal(res.headers.get('access-control-allow-origin'), SPA_ORIGIN);
  assert.equal(res.status, 401);
  const body = await res.json();
  assert.equal(body.code, 'PERMISSION_DENIED');

  // A request without the CSRF header must be rejected even with the cookie.
  const denied = await fetch(`${base}/api/db`, {
    method: 'POST',
    headers: {
      Origin: SPA_ORIGIN,
      'Content-Type': 'application/json',
      Cookie: cookie,
    },
    body: JSON.stringify({ op: 'list', table: 'Customer' }),
  });
  assert.equal(denied.status, 403);
  assert.equal((await denied.json()).code, 'CSRF');
});
