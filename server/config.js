/**
 * Server-side installation state and database credential storage.
 *
 * STATE   (recura.state.json)  — non-secret machine-readable state. This is the
 *          authoritative source for /api/install/status and first-run detection.
 * CONFIG  (recura.config.json) — live database credentials for the running app.
 *
 * SECURITY RULES (spec §27, §39):
 *   * Never stored in the browser, localStorage, sessionStorage or cookies.
 *   * The password is the ONLY secret; it is written with mode 0600 and the
 *     whole directory is git-ignored.
 *   * Never written to logs or returned by any API endpoint.
 */

import fs from 'node:fs';
import path from 'node:path';

export const INSTALL_STATUS = Object.freeze({
  NOT_INSTALLED: 'NOT_INSTALLED',
  INSTALLING: 'INSTALLING',
  INSTALLED: 'INSTALLED',
  INSTALLATION_FAILED: 'INSTALLATION_FAILED',
  RECOVERY_REQUIRED: 'RECOVERY_REQUIRED',
});

export const DEFAULT_DATA_DIR = path.resolve(process.cwd(), 'recura-data');
export const STATE_FILE = 'recura.state.json';
export const CONFIG_FILE = 'recura.config.json';

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function getDataDir() {
  return ensureDir(process.env.RECURA_DATA_DIR || DEFAULT_DATA_DIR);
}

function statePath(dir = getDataDir()) {
  return path.join(dir, STATE_FILE);
}

function configPath(dir = getDataDir()) {
  return path.join(dir, CONFIG_FILE);
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (err) {
    if (err && err.code === 'ENOENT') return null;
    if (err instanceof SyntaxError) {
      // Corrupt state file: do not silently treat as installed.
      throw new Error(`Corrupt state file: ${file}`);
    }
    throw err;
  }
}

function writeJsonAtomic(file, data, mode) {
  const tmp = `${file}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  if (mode) fs.chmodSync(tmp, mode);
  fs.renameSync(tmp, file);
}

/** ---------- STATE (non-secret) ---------- */

export function readState() {
  return readJson(statePath());
}

export function getInstallStatus() {
  const state = readState();
  return state && state.status ? state.status : INSTALL_STATUS.NOT_INSTALLED;
}

export function writeState(patch) {
  const dir = getDataDir();
  ensureDir(dir);
  const current = readJson(statePath(dir)) || {};
  const next = { ...current, ...patch };
  next.updatedAt = new Date().toISOString();
  writeJsonAtomic(statePath(dir), next);
  return next;
}

export function clearState() {
  const dir = getDataDir();
  ensureDir(dir);
  try { fs.unlinkSync(statePath(dir)); } catch { /* already absent */ }
}

/** ---------- CONFIG (secret) ---------- */

export function writeConfig(databaseConfig) {
  const dir = getDataDir();
  ensureDir(dir);
  const payload = { database: databaseConfig };
  writeJsonAtomic(configPath(dir), payload, 0o600);
}

export function readConfig() {
  const cfg = readJson(configPath());
  return cfg && cfg.database ? cfg.database : null;
}

export function hasConfig() {
  return Boolean(readConfig());
}
