import { test } from 'node:test';
import assert from 'node:assert/strict';

import { INSTALL_STATUS, getInstallStatus, readConfig } from '../config.js';
import * as install from '../install.js';
import { makeTestEnv, cleanupEnv, VALID_DB, asBody } from './helpers.js';

const ADMIN = { name: 'System Owner', username: 'admin', email: 'admin@recura.local', password: 'Sup3rStrong#2024' };

test('install: happy path completes and locks the installer', async () => {
  const { dir, mock } = makeTestEnv();
  try {
    const conn = await install.testConnection(asBody(VALID_DB));
    assert.equal(conn.ok, true);
    assert.equal(conn.versionSupported, true);
    assert.equal(conn.canCreateTables, true);
    assert.equal(conn.state, 'empty');
    assert.equal(conn.majorVersion, 16);

    const start = await install.startInstall({ ...asBody(VALID_DB), dbState: 'empty' });
    assert.equal(start.ok, true);
    const token = start.installToken;
    assert.ok(token);

    const migrate = await install.runInstall(token);
    assert.equal(migrate.ok, true);
    assert.equal(migrate.result.applied.length, 4);
    assert.equal(getInstallStatus(), INSTALL_STATUS.INSTALLING);

    const admin = await install.createAdmin(token, ADMIN);
    assert.equal(admin.ok, true);
    const userRows = mock.getTables().get('user') || [];
    assert.equal(userRows.length, 1);
    assert.equal(userRows[0].role, 'ADMIN');
    assert.match(userRows[0].passwordHash, /^\$argon2id\$v=19\$m=65536/);

    const verified = await install.verifyInstallation(token);
    assert.equal(verified.ok, true);
    assert.equal(verified.adminOk, true);
    assert.equal(verified.migrationsOk, true);
    assert.equal(verified.allTablesOk, true);

    const done = await install.completeInstall(token);
    assert.equal(done.ok, true);
    assert.equal(done.redirect, '/login');
    assert.equal(getInstallStatus(), INSTALL_STATUS.INSTALLED);

    const cfg = readConfig();
    assert.equal(cfg.host, VALID_DB.host);
    assert.equal(cfg.password, VALID_DB.password);

    // Installer is locked out after install.
    const blocked = await install.startInstall({ ...asBody(VALID_DB), dbState: 'empty' });
    assert.equal(blocked.ok, false);
    assert.equal(blocked.code, 'CONFLICT');
  } finally {
    cleanupEnv(dir);
  }
});

test('install: existing partial database requires explicit consent', async () => {
  const { dir, mock } = makeTestEnv();
  try {
    mock.seed('Customer', [{ id: 'c1', name: 'Existing' }]);
    const conn = await install.testConnection(asBody(VALID_DB));
    assert.equal(conn.state, 'partial');
    assert.deepEqual(conn.existingTables, ['Customer']);

    const refused = await install.startInstall({ ...asBody(VALID_DB), dbState: 'partial' });
    assert.equal(refused.ok, false);
    assert.equal(refused.code, 'CONSENT_REQUIRED');

    const accepted = await install.startInstall({ ...asBody(VALID_DB), dbState: 'partial', consent: true });
    assert.equal(accepted.ok, true);
  } finally {
    cleanupEnv(dir);
  }
});

test('install: migration failure marks INSTALLATION_FAILED and retry resumes', async () => {
  const { dir, mock } = makeTestEnv();
  try {
    const start = await install.startInstall({ ...asBody(VALID_DB), dbState: 'empty' });
    const token = start.installToken;

    mock.failOn('BEGIN', new Error('simulated migration failure'));
    const failed = await install.runInstall(token);
    assert.equal(failed.ok, false);
    assert.equal(getInstallStatus(), INSTALL_STATUS.INSTALLATION_FAILED);

    // Retry re-opens the installer (state INSTALLATION_FAILED -> INSTALLING)
    // and resumes from schema_migrations tracking.
    mock.clearFails();
    const restart = await install.startInstall({ ...asBody(VALID_DB), dbState: 'empty' });
    assert.equal(restart.ok, true);
    const retried = await install.runInstall(restart.installToken);
    assert.equal(retried.ok, true);
    assert.equal(retried.result.applied.length, 4);
    assert.equal(getInstallStatus(), INSTALL_STATUS.INSTALLING);

    const admin = await install.createAdmin(restart.installToken, ADMIN);
    assert.equal(admin.ok, true);
    const verified = await install.verifyInstallation(restart.installToken);
    assert.equal(verified.ok, true);
    assert.equal((await install.completeInstall(restart.installToken)).ok, true);
  } finally {
    cleanupEnv(dir);
  }
});

test('install: admin validation rejects bad input', async () => {
  const { dir } = makeTestEnv();
  try {
    const start = await install.startInstall({ ...asBody(VALID_DB), dbState: 'empty' });
    const token = start.installToken;

    const weak = await install.createAdmin(token, { name: 'X', username: 'goodname', email: 'a@b.com', password: '123' });
    assert.equal(weak.ok, false);
    assert.equal(weak.code, 'VALIDATION');
    assert.match(weak.message, /Password/);

    const badEmail = await install.createAdmin(token, { name: 'X', username: 'goodname', email: 'not-an-email', password: 'LongPass1!' });
    assert.equal(badEmail.ok, false);
    assert.match(badEmail.message, /email/i);

    const badUsername = await install.createAdmin(token, { name: 'X', username: 'has space', email: 'a@b.com', password: 'LongPass1!' });
    assert.equal(badUsername.ok, false);
    assert.match(badUsername.message, /Username/);
  } finally {
    cleanupEnv(dir);
  }
});

test('install: duplicate admin email/username conflicts', async () => {
  const { dir, mock } = makeTestEnv();
  try {
    const start = await install.startInstall({ ...asBody(VALID_DB), dbState: 'empty' });
    const token = start.installToken;
    await install.runInstall(token);
    mock.seed('User', [{ email: 'admin@recura.local', username: 'admin', name: 'Taken', role: 'ADMIN' }]);

    const dup = await install.createAdmin(token, ADMIN);
    assert.equal(dup.ok, false);
    assert.equal(dup.code, 'CONFLICT');
  } finally {
    cleanupEnv(dir);
  }
});

test('install: test-connection reports network failure cleanly', async () => {
  const { dir, mock } = makeTestEnv();
  try {
    mock.setFailConnect(true);
    const conn = await install.testConnection(asBody(VALID_DB));
    assert.equal(conn.ok, false);
    assert.equal(conn.connected, false);
    assert.equal(conn.code, 'NETWORK');
  } finally {
    cleanupEnv(dir);
  }
});

test('install: session-expired operations are rejected', async () => {
  const { dir } = makeTestEnv();
  try {
    const migrate = await install.runInstall('bogus-token');
    assert.equal(migrate.ok, false);
    assert.equal(migrate.code, 'SESSION');
    const admin = await install.createAdmin('bogus-token', ADMIN);
    assert.equal(admin.ok, false);
    assert.equal(admin.code, 'SESSION');
  } finally {
    cleanupEnv(dir);
  }
});

test('install: db presets expose the hosting database and never leak secrets', async () => {
  const prev = process.env.DATABASE_URL;
  try {
    delete process.env.DATABASE_URL;
    let res = install.getDbPresets();
    assert.equal(res.ok, true);
    assert.deepEqual(res.presets, []);

    process.env.DATABASE_URL = 'postgres://user:secret@host:5432/db';
    res = install.getDbPresets();
    assert.equal(res.presets.length, 1);
    assert.equal(res.presets[0].id, 'env');
    const json = JSON.stringify(res);
    assert.ok(!json.includes('secret'));
  } finally {
    if (prev === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = prev;
  }
});
