/**
 * Migration runner.
 *
 * Guarantees:
 *   * schema_migrations table tracks every applied/attempted migration.
 *   * Each migration runs inside its own transaction; Postgres DDL is
 *     transactional, so a failure rolls back completely.
 *   * Idempotent (IF NOT EXISTS / ON CONFLICT everywhere) so re-running the
 *     same file after a partial failure is always safe.
 *   * A previously FAILED migration is re-attempted, then marked SUCCESS.
 *
 * SQL files are loaded from server/migrations in lexicographic order.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { logger } from './logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

const MIGRATIONS_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS schema_migrations (
  version     TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'SUCCESS',
  error       TEXT,
  executedAt  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);`;

export function listMigrationFiles(dir = MIGRATIONS_DIR) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.sql'))
    .sort();
}

function loadMigration(dir, file) {
  const version = /^(\d+)/.exec(file)?.[1];
  if (!version) throw new Error(`Migration file lacks a numeric prefix: ${file}`);
  return {
    version,
    file,
    name: file,
    sql: fs.readFileSync(path.join(dir, file), 'utf8'),
  };
}

export async function ensureMigrationTable(client) {
  await client.query(MIGRATIONS_TABLE_SQL);
}

export async function getAppliedMigrations(client) {
  await ensureMigrationTable(client);
  const res = await client.query('SELECT version, name, status, error FROM schema_migrations');
  return res.rows ?? [];
}

/**
 * Runs every pending migration.
 * Returns { applied: [{version, name}], alreadyApplied: [{version, name}] }.
 * Throws on first failure AFTER recording status='FAILED' in schema_migrations.
 */
export async function runMigrations(client, { onProgress } = {}) {
  await ensureMigrationTable(client);
  const applied = new Set();
  for (const row of await getAppliedMigrations(client)) {
    if (row.status === 'SUCCESS') applied.add(row.version);
  }

  const files = listMigrationFiles();
  const appliedList = [];
  const alreadyApplied = [];

  for (const file of files) {
    const m = loadMigration(MIGRATIONS_DIR, file);
    if (applied.has(m.version)) {
      alreadyApplied.push({ version: m.version, name: m.name });
      continue;
    }

    logger.info('migrate', `Applying ${m.file}`);
    try {
      await client.query('BEGIN');
      await client.query(m.sql);
      await client.query(
        `INSERT INTO schema_migrations (version, name, status, executedAt)
         VALUES ($1, $2, 'SUCCESS', CURRENT_TIMESTAMP)
         ON CONFLICT (version) DO UPDATE SET name = EXCLUDED.name, status = 'SUCCESS', error = NULL, executedAt = CURRENT_TIMESTAMP`,
        [m.version, m.name]
      );
      await client.query('COMMIT');
      appliedList.push({ version: m.version, name: m.name });
      onProgress?.({ version: m.version, name: m.name, index: appliedList.length + alreadyApplied.length, total: files.length });
    } catch (err) {
      try { await client.query('ROLLBACK'); } catch { /* no active txn */ }
      try {
        await client.query(
          `INSERT INTO schema_migrations (version, name, status, error, executedAt)
           VALUES ($1, $2, 'FAILED', $3, CURRENT_TIMESTAMP)
           ON CONFLICT (version) DO UPDATE SET name = EXCLUDED.name, status = 'FAILED', error = EXCLUDED.error, executedAt = CURRENT_TIMESTAMP`,
          [m.version, m.name, String(err?.message ?? err).slice(0, 2000)]
        );
      } catch (recordErr) {
        logger.error('migrate', `Failed to record failure for ${m.file}: ${recordErr?.message ?? recordErr}`);
      }
      const wrapped = Object.assign(new Error(`Migration ${m.name} failed: ${err?.message ?? err}`), { code: 'MIGRATION_FAILED', cause: err });
      logger.error('migrate', `Migration ${m.name} failed`);
      throw wrapped;
    }
  }

  return { applied: appliedList, alreadyApplied };
}
