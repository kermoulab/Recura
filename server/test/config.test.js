import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  INSTALL_STATUS, getInstallStatus, readState, writeState,
  writeConfig, readConfig, hasConfig,
} from '../config.js';
import { makeTestEnv, cleanupEnv } from './helpers.js';

test('config: state transitions persist across module reads', () => {
  const { dir } = makeTestEnv();
  try {
    assert.equal(getInstallStatus(), INSTALL_STATUS.NOT_INSTALLED);
    writeState({ status: INSTALL_STATUS.INSTALLING, step: 'started' });
    assert.equal(getInstallStatus(), INSTALL_STATUS.INSTALLING);
    writeState({ status: INSTALL_STATUS.INSTALLED, installedAt: new Date().toISOString() });
    assert.equal(getInstallStatus(), INSTALL_STATUS.INSTALLED);
    const state = readState();
    assert.equal(state.status, INSTALL_STATUS.INSTALLED);
    assert.ok(state.updatedAt);
  } finally {
    cleanupEnv(dir);
  }
});

test('config: writes DB credentials including password', () => {
  const { dir } = makeTestEnv();
  try {
    writeConfig({ host: 'db.example.com', port: 5433, database: 'app', user: 'u', password: 'pw!', ssl: true });
    assert.ok(hasConfig());
    const cfg = readConfig();
    assert.equal(cfg.host, 'db.example.com');
    assert.equal(cfg.password, 'pw!');
    assert.equal(cfg.ssl, true);
  } finally {
    cleanupEnv(dir);
  }
});

test('config: absent state file reads as NOT_INSTALLED and no config', () => {
  const { dir } = makeTestEnv();
  try {
    assert.equal(getInstallStatus(), INSTALL_STATUS.NOT_INSTALLED);
    assert.equal(readConfig(), null);
    assert.equal(hasConfig(), false);
  } finally {
    cleanupEnv(dir);
  }
});
