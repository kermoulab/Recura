/**
 * End-to-end HTTP test: boots the real server (server/index.js) with the mock
 * driver and walks through the complete installer + data API flow exactly as
 * the browser would (CSRF cookie + headers, Bearer tokens, install states).
 */

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

import { makeTestEnv, cleanupEnv, VALID_DB, asBody } from './helpers.js';
import { startServer, stopServer } from '../index.js';
import { INSTALL_STATUS, getInstallStatus } from '../config.js';

let env;
let base;
let csrfToken;
let cookie;
let installToken;
let appToken;

async function json(method, url, body, extraHeaders = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...extraHeaders,
  };
  if (cookie) headers.Cookie = cookie;
  if (csrfToken && method !== 'GET') headers['X-CSRF-Token'] = csrfToken;
  const res = await fetch(`${base}${url}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let parsed = {};
  try { parsed = text ? JSON.parse(text) : {}; } catch { /* non-json */ }
  return { status: res.status, body: parsed };
}

async function csrf() {
  const res = await fetch(`${base}/api/csrf`);
  const body = await res.json();
  csrfToken = body.csrfToken;
  const setCookie = res.headers.get('set-cookie') || '';
  cookie = setCookie.split(';')[0];
}

before(async () => {
  env = makeTestEnv();
  const { port } = await startServer(0);
  base = `http://127.0.0.1:${port}`;
  await csrf();
});

after(async () => {
  await stopServer();
  cleanupEnv(env.dir);
});

test('GET /api/health reports state', async () => {
  const { status, body } = await json('GET', '/api/health');
  assert.equal(status, 200);
  assert.equal(body.ok, true);
});

test('installer rejects POSTs without a valid CSRF token', async () => {
  const res = await fetch(`${base}/api/install/test-connection`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(asBody(VALID_DB)),
  });
  assert.equal(res.status, 403);
  const body = await res.json();
  assert.equal(body.code, 'CSRF');
});

test('installer: test connection sees an empty database', async () => {
  const { status, body } = await json('POST', '/api/install/test-connection', asBody(VALID_DB));
  assert.equal(status, 200);
  assert.equal(body.ok, true);
  assert.equal(body.state, 'empty');
  assert.equal(body.versionSupported, true);
});

test('installer: full install flow over HTTP', async () => {
  const start = await json('POST', '/api/install/start', { ...asBody(VALID_DB), dbState: 'empty' });
  assert.equal(start.status, 200);
  assert.equal(start.body.ok, true);
  installToken = start.body.installToken;
  const auth = { Authorization: `Bearer ${installToken}` };

  const migrate = await json('POST', '/api/install/migrate', {}, auth);
  assert.equal(migrate.body.ok, true);
  assert.equal(migrate.body.result.applied.length, 3);

  const admin = await json('POST', '/api/install/admin', {
    name: 'System Owner', username: 'admin', email: 'admin@recura.local', password: 'Sup3rStrong#2024',
  }, auth);
  assert.equal(admin.body.ok, true);

  const verify = await json('POST', '/api/install/verify', {}, auth);
  assert.equal(verify.body.ok, true);
  assert.equal(verify.body.adminOk, true);

  const complete = await json('POST', '/api/install/complete', {}, auth);
  assert.equal(complete.body.ok, true);
  assert.equal(complete.body.redirect, '/login');
  assert.equal(getInstallStatus(), INSTALL_STATUS.INSTALLED);
});

test('installer is locked after INSTALLED (status excepted)', async () => {
  const status = await json('GET', '/api/install/status');
  assert.equal(status.body.status, INSTALL_STATUS.INSTALLED);

  const blocked = await json('POST', '/api/install/test-connection', asBody(VALID_DB));
  assert.equal(blocked.status, 403);
  assert.equal(blocked.body.code, 'LOCKED');
});

test('data API: reads work after install, writes need a session', async () => {
  const list = await json('POST', '/api/db', { op: 'list', table: 'Customer' });
  assert.equal(list.body.ok, true);

  const insertDenied = await json('POST', '/api/db', { op: 'insert', table: 'Customer', rows: [{ name: 'X' }] });
  assert.equal(insertDenied.status, 401);
  assert.equal(insertDenied.body.code, 'PERMISSION_DENIED');

  const session = await json('POST', '/api/auth/session', { email: 'admin@recura.local', userName: 'System Owner' });
  assert.equal(session.body.ok, true);
  appToken = session.body.token;

  const insert = await json('POST', '/api/db',
    { op: 'insert', table: 'Customer', rows: [{ name: 'Ada', whatsapp: '+1001' }] },
    { Authorization: `Bearer ${appToken}` });
  assert.equal(insert.body.ok, true);
  assert.ok(insert.body.data[0].id);

  const logout = await json('POST', '/api/auth/logout', {}, { Authorization: `Bearer ${appToken}` });
  assert.equal(logout.body.ok, true);

  const insertAfterLogout = await json('POST', '/api/db',
    { op: 'insert', table: 'Customer', rows: [{ name: 'Bob', whatsapp: '+1002' }] },
    { Authorization: `Bearer ${appToken}` });
  assert.equal(insertAfterLogout.status, 401);
});

test('data API: rejects SQL-injection table names', async () => {
  const bad = await json('POST', '/api/db', { op: 'list', table: 'Customer; DROP TABLE "User"' });
  assert.equal(bad.body.ok, false);
  assert.equal(bad.body.code, 'VALIDATION');
});
