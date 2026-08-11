/**
 * Installer orchestration.
 *
 * State machine (authoritative source: server/config.js state file):
 *   NOT_INSTALLED -> INSTALLING -> INSTALLED
 *   INSTALLING / INSTALLED -> INSTALLATION_FAILED (on migration failure)
 *   INSTALLATION_FAILED -> INSTALLING (retry resumes via schema_migrations)
 *
 * SECURITY:
 *   * The DB password is sent to the server exactly ONCE (in /api/install/start),
 *     kept in memory keyed by the install token, never written to disk until
 *     INSTALLED, never logged.
 *   * A dedicated connection holds a Postgres advisory lock during every
 *     mutating step so two concurrent installs cannot corrupt each other.
 *   * Every SQL identifier is drawn from the allow-list (server/schema.js).
 */

import { INSTALL_STATUS, getInstallStatus, readState, writeState, writeConfig } from './config.js';
import { buildConnConfig, connectClient, disconnectClient, sanitizeError, queryOne, queryAll } from './db.js';
import { runMigrations, getAppliedMigrations } from './migrate.js';
import { createInstallSession, verifyInstallSession, destroyInstallSession } from './auth.js';
import { hashPassword, validatePasswordPolicy } from './hash.js';
import { TABLES, quoteIdent } from './schema.js';
import { logger } from './logger.js';

const INSTALL_LOCK_KEY = 1380861781; // fixed, server-wide lock for "recura install"
const REQUIRED_TABLES = Object.keys(TABLES);

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
const USERNAME_REGEX = /^[a-zA-Z0-9_\-\.]+$/;

/** In-memory pending install configs (password lives here until completion). */
const pendingConfigs = new Map(); // installToken -> { config, createdAt }

const PENDING_TTL_MS = 30 * 60 * 1000;

function prunePendingConfigs() {
  const now = Date.now();
  for (const [token, entry] of pendingConfigs) {
    if (now - entry.createdAt > PENDING_TTL_MS) pendingConfigs.delete(token);
  }
}

function pendingConfigFor(token) {
  prunePendingConfigs();
  const entry = pendingConfigs.get(token);
  if (!entry) throw Object.assign(new Error('Installation session expired. Please restart the installation.'), { code: 'SESSION' });
  return entry.config;
}

/** ---------- helpers ---------- */

function stripControlCharacters(value) {
  return String(value || '').replace(/[\u0000-\u001f\u007f]/g, '').trim();
}

function validateAdminInput(body) {
  const name = stripControlCharacters(body?.name);
  if (!name) return { error: 'Full name is required.' };
  if (name.length > 100) return { error: 'Full name is too long.' };

  const username = stripControlCharacters(body?.username);
  if (!username) return { error: 'Username is required.' };
  if (username.length < 3) return { error: 'Username must be at least 3 characters long.' };
  if (username.length > 40) return { error: 'Username cannot exceed 40 characters.' };
  if (/\s/.test(username)) return { error: 'Username cannot contain spaces.' };
  if (!USERNAME_REGEX.test(username)) return { error: 'Username contains invalid characters. Only letters, numbers, _, -, and . are allowed.' };

  const email = stripControlCharacters(body?.email);
  if (!email) return { error: 'Email address is required.' };
  if (!EMAIL_REGEX.test(email)) return { error: 'Please enter a valid email address (e.g. user@domain.com).' };

  const passwordError = validatePasswordPolicy(body?.password);
  if (passwordError) return { error: passwordError };

  return { name, username, email, password: body.password };
}

/**
 * Runs `fn(client)` on a fresh connection holding the install advisory lock.
 * Returns false if the lock could not be acquired (another install is running).
 */
async function withInstallLock(config, fn) {
  const client = await connectClient(config);
  let held = false;
  try {
    const locked = await queryOne(client, 'SELECT pg_try_advisory_lock($1) AS locked', [INSTALL_LOCK_KEY]);
    held = Boolean(locked?.locked);
    if (!held) return { locked: false };
    const result = await fn(client);
    return { locked: true, result };
  } finally {
    if (held) {
      try { await client.query('SELECT pg_advisory_unlock($1)', [INSTALL_LOCK_KEY]); } catch { /* ignore */ }
    }
    await disconnectClient(client);
  }
}

function parseMajorVersion(versionString) {
  const m = /PostgreSQL\s+(\d+)/.exec(versionString || '');
  return m ? Number(m[1]) : 0;
}

async function detectDatabaseState(client) {
  const res = await queryAll(client,
    `SELECT table_name FROM information_schema.tables
     WHERE table_schema = 'public' AND table_type = 'BASE TABLE'`
  );
  const present = new Set(res.map((r) => r.table_name));
  present.delete('schema_migrations');

  const ours = REQUIRED_TABLES.filter((t) => present.has(t));
  const unrelated = [...present].filter((t) => !REQUIRED_TABLES.includes(t)).slice(0, 20);

  let state;
  if (ours.length === REQUIRED_TABLES.length) state = 'complete';
  else if (ours.length > 0) state = 'partial';
  else if (unrelated.length > 0) state = 'unrelated';
  else state = 'empty';

  let migrated = null;
  if (state === 'complete') {
    const rows = await getAppliedMigrations(client);
    const failed = rows.filter((r) => r.status === 'FAILED');
    migrated = failed.length === 0 && rows.length > 0;
  }
  return { state, existingTables: ours, unrelatedTables: unrelated, migrated };
}

async function canCreateTables(client) {
  try {
    await client.query('BEGIN');
    await client.query('CREATE TABLE "recura_permission_probe" (id int)');
    await client.query('ROLLBACK');
    return true;
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch { /* ignore */ }
    logger.warn('install', `Permission probe failed: ${err?.code ?? err?.message}`);
    return false;
  }
}

async function queryVersionInfo(client) {
  const row = await queryOne(client, 'SELECT version() AS version, current_database() AS database');
  return {
    serverVersion: row?.version ?? 'unknown',
    majorVersion: parseMajorVersion(row?.version),
  };
}

/** ---------- public handlers ---------- */

export function getStatus() {
  return { status: getInstallStatus() };
}

export async function testConnection(body) {
  let config;
  let client;
  try {
    config = buildConnConfig(body?.database);
    client = await connectClient(config);
  } catch (err) {
    if (client) await disconnectClient(client);
    return { ok: false, connected: false, ...sanitizeError(err) };
  }

  try {
    const version = await queryVersionInfo(client);
    const supported = version.majorVersion >= 13;
    const dbState = await detectDatabaseState(client);
    const permissionOk = supported ? await canCreateTables(client) : false;
    return {
      ok: true,
      connected: true,
      serverVersion: version.serverVersion,
      majorVersion: version.majorVersion,
      versionSupported: supported,
      canCreateTables: permissionOk,
      ...dbState,
    };
  } catch (err) {
    return { ok: false, connected: false, ...sanitizeError(err) };
  } finally {
    await disconnectClient(client);
  }
}

export async function startInstall(body) {
  const current = getInstallStatus();
  if (current === INSTALL_STATUS.INSTALLING && !body?.force) {
    return { ok: false, code: 'CONFLICT', message: 'An installation is already in progress on this server.' };
  }
  if (current === INSTALL_STATUS.INSTALLED) {
    return { ok: false, code: 'CONFLICT', message: 'Recura is already installed.' };
  }

  let config;
  try {
    config = buildConnConfig(body?.database);
  } catch (err) {
    return { ok: false, ...sanitizeError(err) };
  }

  const dbState = body?.dbState;
  const needsConsent = dbState === 'partial' || dbState === 'unrelated' || (dbState === 'complete' && !body?.resume);
  if (needsConsent && !body?.consent) {
    return {
      ok: false,
      code: 'CONSENT_REQUIRED',
      message: 'The selected database already contains tables. Confirm that you want to install into it before continuing.',
    };
  }

  // Verify the connection + lock availability BEFORE mutating anything.
  const probe = await withInstallLock(config, async (client) => {
    const version = await queryVersionInfo(client);
    if (version.majorVersion < 13) {
      return { ok: false, code: 'VERSION_UNSUPPORTED', message: `PostgreSQL ${version.majorVersion} is not supported. Recura requires PostgreSQL 13 or newer.` };
    }
    return { ok: true };
  });

  if (!probe.locked) {
    return { ok: false, code: 'CONFLICT', message: 'Another installation is currently in progress on this database.' };
  }
  if (!probe.result.ok) return probe.result;

  const token = createInstallSession();
  prunePendingConfigs();
  pendingConfigs.set(token, { config, createdAt: Date.now() });
  writeState({ status: INSTALL_STATUS.INSTALLING, step: 'started' });
  logger.info('install', `Install started (${config.host}:${config.port}/${config.database})`);
  return { ok: true, installToken: token };
}

export async function runInstall(token) {
  if (!verifyInstallSession(token)) {
    return { ok: false, code: 'SESSION', message: 'Installation session expired. Please restart the installation.' };
  }
  const config = pendingConfigFor(token);
  if (getInstallStatus() !== INSTALL_STATUS.INSTALLING) {
    return { ok: false, code: 'CONFLICT', message: 'Installation is not in progress.' };
  }

  const run = await withInstallLock(config, async (client) => {
    try {
      const result = await runMigrations(client, {
        onProgress: ({ version, name, index, total }) => writeState({ step: 'migrate', migrationIndex: index, migrationTotal: total, currentMigration: name }),
      });
      return { ok: true, result };
    } catch (err) {
      writeState({ status: INSTALL_STATUS.INSTALLATION_FAILED, step: 'migrate', failedAt: new Date().toISOString() });
      return { ok: false, error: sanitizeError(err) };
    }
  });

  if (!run.locked) {
    return { ok: false, code: 'CONFLICT', message: 'Another installation is currently in progress on this database.' };
  }
  return run.result;
}

export async function createAdmin(token, body) {
  if (!verifyInstallSession(token)) {
    return { ok: false, code: 'SESSION', message: 'Installation session expired. Please restart the installation.' };
  }
  const config = pendingConfigFor(token);
  if (getInstallStatus() !== INSTALL_STATUS.INSTALLING) {
    return { ok: false, code: 'CONFLICT', message: 'Installation is not in progress.' };
  }

  const input = validateAdminInput(body);
  if (input.error) return { ok: false, code: 'VALIDATION', message: input.error };

  const passwordHash = await hashPassword(input.password);

  const run = await withInstallLock(config, async (client) => {
    const existing = await queryOne(client,
      `SELECT "email", "username" FROM "User" WHERE "email" = $1 OR "username" = $2 LIMIT 1`,
      [input.email, input.username]
    );
    if (existing) {
      return {
        ok: false,
        code: 'CONFLICT',
        message: existing.email === input.email
          ? 'An account with this email already exists.'
          : 'An account with this username already exists.',
      };
    }
    await client.query(
      `INSERT INTO "User" ("name", "username", "email", "passwordHash", "role")
       VALUES ($1, $2, $3, $4, $5)`,
      [input.name, input.username, input.email, passwordHash, 'ADMIN']
    );
    return { ok: true };
  });

  if (!run.locked) {
    return { ok: false, code: 'CONFLICT', message: 'Another installation is currently in progress on this database.' };
  }
  return run.result;
}

export async function verifyInstallation(token) {
  if (!verifyInstallSession(token)) {
    return { ok: false, code: 'SESSION', message: 'Installation session expired. Please restart the installation.' };
  }
  const config = pendingConfigFor(token);
  if (getInstallStatus() !== INSTALL_STATUS.INSTALLING) {
    return { ok: false, code: 'CONFLICT', message: 'Installation is not in progress.' };
  }

  const run = await withInstallLock(config, async (client) => {
    const checks = [];
    for (const table of REQUIRED_TABLES) {
      try {
        const row = await queryOne(client, `SELECT count(*)::int AS n FROM ${quoteIdent(table)}`);
        checks.push({ table, ok: true, rows: row?.n ?? 0 });
      } catch {
        checks.push({ table, ok: false, rows: -1 });
      }
    }

    const failedMigrations = (await getAppliedMigrations(client)).filter((r) => r.status === 'FAILED');
    const admin = await queryOne(client,
      `SELECT "email" FROM "User" WHERE "role" = 'ADMIN' ORDER BY "createdAt" ASC LIMIT 1`
    );

    const allTablesOk = checks.every((c) => c.ok);
    const migrationsOk = failedMigrations.length === 0;
    const adminOk = Boolean(admin);

    return { checks, allTablesOk, migrationsOk, adminOk, adminEmail: admin?.email ?? null };
  });

  if (!run.locked) {
    return { ok: false, code: 'CONFLICT', message: 'Another installation is currently in progress on this database.' };
  }
  const result = run.result;
  result.ok = Boolean(result.allTablesOk && result.migrationsOk && result.adminOk);
  return result;
}

export async function completeInstall(token) {
  if (!verifyInstallSession(token)) {
    return { ok: false, code: 'SESSION', message: 'Installation session expired. Please restart the installation.' };
  }
  const config = pendingConfigFor(token);
  if (getInstallStatus() !== INSTALL_STATUS.INSTALLING) {
    return { ok: false, code: 'CONFLICT', message: 'Installation is not in progress.' };
  }

  const verified = await verifyInstallation(token);
  if (!verified.ok) {
    return { ok: false, code: 'VERIFICATION_FAILED', message: 'Post-install verification failed. Review the check results before completing.' };
  }

  writeConfig(config);
  writeState({
    status: INSTALL_STATUS.INSTALLED,
    step: 'complete',
    installedAt: new Date().toISOString(),
    adminEmail: verified.adminEmail,
  });
  pendingConfigs.delete(token);
  destroyInstallSession(token);
  logger.info('install', 'Installation completed successfully.');
  return { ok: true, redirect: '/login' };
}

export async function cancelInstall(token) {
  if (!verifyInstallSession(token)) {
    return { ok: false, code: 'SESSION', message: 'Installation session expired.' };
  }
  pendingConfigs.delete(token);
  destroyInstallSession(token);
  if (getInstallStatus() === INSTALL_STATUS.INSTALLING) {
    writeState({ status: INSTALL_STATUS.NOT_INSTALLED, step: 'cancelled' });
  }
  return { ok: true };
}

export function isInstallLockedOut() {
  return getInstallStatus() === INSTALL_STATUS.INSTALLED;
}

export { readState };
