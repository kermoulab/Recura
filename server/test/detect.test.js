/**
 * Provider / protocol detection for the installer input.
 *
 * Covers the required cases: Supabase/PostgREST, Nhost/GraphQL, direct
 * PostgreSQL, unknown provider, invalid URL, plus the security invariant that
 * credentials are never returned or logged.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { detect } from '../detect.js';
import { buildConnConfig } from '../db.js';
import * as install from '../install.js';
import { makeTestEnv, cleanupEnv, asBody } from './helpers.js';

test('detect: Supabase project URL → postgrest/supabase', () => {
  const r = detect('https://abcdefgh.supabase.co');
  assert.equal(r.ok, true);
  assert.equal(r.engine, 'postgres');
  assert.equal(r.protocol, 'postgrest');
  assert.equal(r.provider, 'supabase');
  assert.equal(r.mode, 'hosted');
});

test('detect: Supabase /rest/v1 URL → postgrest/supabase', () => {
  const r = detect('https://abcdefgh.supabase.co/rest/v1');
  assert.equal(r.protocol, 'postgrest');
  assert.equal(r.provider, 'supabase');
});

test('detect: Nhost GraphQL endpoint → graphql/nhost (never postgrest)', () => {
  const cases = [
    'https://abcdefgh.graphql.eu-central-1.nhost.run/v1',
    'https://abcdefgh.nhost.run/v1/graphql',
  ];
  for (const url of cases) {
    const r = detect(url);
    assert.equal(r.ok, true, url);
    assert.equal(r.protocol, 'graphql', url);
    assert.equal(r.provider, 'nhost', url);
    assert.equal(r.mode, 'needs-postgres', url);
    assert.notEqual(r.protocol, 'postgrest', url);
  }
});

test('detect: Nhost project URL → nhost provider, not mislabeled as PostgREST', () => {
  const r = detect('https://abcdefgh.nhost.run');
  assert.equal(r.ok, true);
  assert.equal(r.provider, 'nhost');
  assert.notEqual(r.protocol, 'postgrest');
});

test('detect: direct PostgreSQL connection string → postgres', () => {
  const r = detect('postgresql://recura_user:sup3r-secret@db.example.com:5432/recura');
  assert.equal(r.ok, true);
  assert.equal(r.protocol, 'postgres');
  assert.equal(r.provider, 'self-hosted');
  assert.equal(r.mode, 'server');
  assert.equal(r.host, 'db.example.com');
  assert.equal(r.port, 5432);
  assert.equal(r.database, 'recura');
  assert.equal(r.user, 'recura_user');
  assert.equal(r.ssl, false);
  // SECURITY: the password must never appear in the result.
  assert.ok(!JSON.stringify(r).includes('sup3r-secret'));
});

test('detect: Neon connection string → postgres/neon with SSL', () => {
  const r = detect('postgresql://user:pass@db-ep-123.us-east-1.aws.neon.tech/neondb?sslmode=require');
  assert.equal(r.protocol, 'postgres');
  assert.equal(r.provider, 'neon');
  assert.equal(r.ssl, true);
});

test('detect: Render connection string → postgres/render', () => {
  const r = detect('postgresql://user:pass@dpg-abc-123.onrender.com/recura');
  assert.equal(r.protocol, 'postgres');
  assert.equal(r.provider, 'render');
});

test('detect: Railway connection string → postgres/railway', () => {
  const r = detect('postgresql://user:pass@containers-us-west-12.railway.app:5432/recura');
  assert.equal(r.protocol, 'postgres');
  assert.equal(r.provider, 'railway');
});

test('detect: Supabase PostgreSQL connection string → postgres/supabase', () => {
  const r = detect('postgresql://postgres:pass@db.abcdefgh.supabase.co:5432/postgres');
  assert.equal(r.protocol, 'postgres');
  assert.equal(r.provider, 'supabase');
});

test('detect: unknown https endpoint → identified as unknown, not guessed', () => {
  const r = detect('https://data.example.org/api');
  assert.equal(r.ok, true);
  assert.equal(r.protocol, 'unknown');
  assert.equal(r.mode, 'unknown');
});

test('detect: invalid URL → ok false', () => {
  const r = detect('ht!tp://not a url');
  assert.equal(r.ok, false);
  assert.equal(r.code, 'UNKNOWN');
});

test('detect: malformed connection string → ok false with friendly message', () => {
  const r = detect('postgresql://user:pass@db.example.com/');
  assert.equal(r.ok, false);
  assert.match(r.message, /database/i);
});

test('detect: empty input → ok false', () => {
  const r = detect('   ');
  assert.equal(r.ok, false);
  assert.equal(r.code, 'EMPTY');
});

test('detect: manual object input (host/port/...) → postgres', () => {
  const r = detect({ host: 'db.example.com', port: 5432, database: 'recura', user: 'u', password: 'p' });
  assert.equal(r.ok, true);
  assert.equal(r.protocol, 'postgres');
  assert.equal(r.mode, 'server');
});

test('detect: object with url field → classified like a string', () => {
  const r = detect({ url: 'https://abcdefgh.supabase.co' });
  assert.equal(r.protocol, 'postgrest');
  assert.equal(r.provider, 'supabase');
});

test('buildConnConfig: accepts a single connection string', () => {
  const cfg = buildConnConfig({ url: 'postgresql://user:pw@db.example.com:5433/recura?sslmode=require' });
  assert.equal(cfg.host, 'db.example.com');
  assert.equal(cfg.port, 5433);
  assert.equal(cfg.database, 'recura');
  assert.equal(cfg.user, 'user');
  assert.equal(cfg.password, 'pw');
  assert.ok(cfg.ssl);

  const cfg2 = buildConnConfig({ connectionString: 'postgresql://u@h/db' });
  assert.equal(cfg2.host, 'h');
  assert.equal(cfg2.password, undefined);
});

test('buildConnConfig: rejects non-PostgreSQL connection strings', () => {
  assert.throws(() => buildConnConfig({ url: 'mysql://user:pw@h/db' }), /postgres/);
  assert.throws(() => buildConnConfig({ url: 'not-a-url' }), /postgres/);
});

test('install: connection-string input drives the full flow and never leaks the password', async () => {
  const { dir, mock } = makeTestEnv();
  try {
    const dbBody = { url: 'postgresql://recura_user:S3cret!pass@localhost:5432/recura?sslmode=require' };

    const conn = await install.testConnection(asBody(dbBody));
    assert.equal(conn.ok, true);
    assert.equal(conn.state, 'empty');
    assert.equal(conn.versionSupported, true);

    // Detection returns normalized non-secret fields only.
    const det = install.detectDatabaseInput(asBody(dbBody));
    assert.equal(det.ok, true);
    assert.equal(det.protocol, 'postgres');
    assert.equal(det.mode, 'server');
    assert.equal(det.user, 'recura_user');
    assert.ok(!JSON.stringify(det).includes('S3cret'));
    assert.ok(!JSON.stringify(det).includes('S3cret!pass'));

    const start = await install.startInstall({ database: dbBody, dbState: 'empty' });
    assert.equal(start.ok, true);
    const token = start.installToken;
    const migrate = await install.runInstall(token);
    assert.equal(migrate.ok, true);
    assert.equal(migrate.result.applied.length, 4);

    // A failed connection must also never surface the password.
    mock.setFailConnect(true);
    const failed = await install.testConnection(asBody(dbBody));
    mock.setFailConnect(false);
    assert.equal(failed.ok, false);
    assert.ok(!JSON.stringify(failed).includes('S3cret'));
  } finally {
    cleanupEnv(dir);
  }
});
