import { test } from 'node:test';
import assert from 'node:assert/strict';

import { buildConnConfig } from '../db.js';

test('db: normalizes a valid connection config', () => {
  const cfg = buildConnConfig({ host: '  localhost ', port: '5433', database: ' app ', user: ' u ', password: 'pw', ssl: true });
  assert.equal(cfg.host, 'localhost');
  assert.equal(cfg.port, 5433);
  assert.equal(cfg.database, 'app');
  assert.equal(cfg.user, 'u');
  assert.equal(cfg.password, 'pw');
  assert.deepEqual(cfg.ssl, { rejectUnauthorized: true });
  assert.equal(cfg.connectionTimeoutMillis, 15000);
});

test('db: ssl defaults to strict certificate validation', () => {
  const cfg = buildConnConfig({ host: 'localhost', database: 'x', user: 'u', ssl: true });
  assert.deepEqual(cfg.ssl, { rejectUnauthorized: true });
});

test('db: ssl certificate validation can be relaxed via env for dev certs', () => {
  const prev = process.env.RECURA_DB_SSL_REJECT_UNAUTHORIZED;
  process.env.RECURA_DB_SSL_REJECT_UNAUTHORIZED = 'false';
  try {
    const cfg = buildConnConfig({ host: 'localhost', database: 'x', user: 'u', ssl: true });
    assert.deepEqual(cfg.ssl, { rejectUnauthorized: false });
  } finally {
    if (prev === undefined) delete process.env.RECURA_DB_SSL_REJECT_UNAUTHORIZED;
    else process.env.RECURA_DB_SSL_REJECT_UNAUTHORIZED = prev;
  }
});

test('db: defaults port to 5432 and ssl to false', () => {
  const cfg = buildConnConfig({ host: 'localhost', database: 'x', user: 'u' });
  assert.equal(cfg.port, 5432);
  assert.equal(cfg.ssl, false);
});

test('db: rejects missing fields', () => {
  assert.throws(() => buildConnConfig({}), /Host is required/);
  assert.throws(() => buildConnConfig({ host: 'h' }), /Database name is required/);
  assert.throws(() => buildConnConfig({ host: 'h', database: 'd' }), /Username is required/);
});

test('db: rejects invalid port', () => {
  assert.throws(() => buildConnConfig({ host: 'h', database: 'd', user: 'u', port: 99999 }), /Port must be/);
  assert.throws(() => buildConnConfig({ host: 'h', database: 'd', user: 'u', port: 'abc' }), /Port must be/);
});
