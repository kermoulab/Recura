/**
 * Shared test setup: temp data dir + mock driver wiring.
 */

import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';

import { setPgModule } from '../driver.js';
import { createMockDb } from './mockDb.js';

export function makeTestEnv() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'recura-test-'));
  process.env.RECURA_DATA_DIR = dir;
  const mock = createMockDb();
  setPgModule(mock);
  return { dir, mock };
}

export function cleanupEnv(dir) {
  try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /* ignore */ }
}

export const VALID_DB = {
  host: 'localhost',
  port: 5432,
  database: 'recura',
  user: 'recura_user',
  password: 'S3cret!pass',
  ssl: false,
};

export function asBody(db) {
  return { database: db };
}
