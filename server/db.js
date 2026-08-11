/**
 * Database connection helpers.
 *
 * The driver is injectable for tests (see server/test/*.test.js): by default it
 * is node-postgres, but setPgModule() can swap in a mock exposing the same
 * Client surface ({ connect, query, end }).
 */

import { logger } from './logger.js';
import { setPgModule, getPgModule } from './driver.js';

export { setPgModule, getPgModule };

const PASSWORD_FIELD = 'password';

/**
 * Validates and normalizes raw installer input into a pg connection config.
 * Rejects anything malformed. The password is kept in memory only.
 */
export function buildConnConfig(input) {
  if (!input || typeof input !== 'object') {
    throw validationError('Connection details are required.');
  }
  const host = typeof input.host === 'string' ? input.host.trim() : '';
  if (!host) throw validationError('Host is required.');
  if (host.length > 255) throw validationError('Host is too long.');

  let port = 5432;
  if (input.port !== undefined && input.port !== null && input.port !== '') {
    port = Number(input.port);
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      throw validationError('Port must be a number between 1 and 65535.');
    }
  }

  const database = typeof input.database === 'string' ? input.database.trim() : '';
  if (!database) throw validationError('Database name is required.');
  if (database.length > 255) throw validationError('Database name is too long.');

  const user = typeof input.user === 'string' ? input.user.trim() : '';
  if (!user) throw validationError('Username is required.');

  const password = typeof input.password === 'string' ? input.password : '';
  const ssl = Boolean(input.ssl);

  const config = {
    host,
    port,
    database,
    user,
    ssl: ssl ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: 15000,
    application_name: 'recura',
  };
  if (password.length > 0) config[PASSWORD_FIELD] = password;
  return config;
}

function validationError(message) {
  return Object.assign(new Error(message), { code: 'VALIDATION' });
}

/** Opens a dedicated connection (used for test-connection and the install run). */
export async function connectClient(config) {
  const Client = getPgModule().Client;
  const client = new Client(config);
  await client.connect();
  return client;
}

export async function disconnectClient(client) {
  try { await client.end(); } catch { /* already closed */ }
}

/** Executes a single query and returns rows. Values are ALWAYS bound params. */
export async function queryAll(client, sql, params = []) {
  const res = await client.query(sql, params);
  return res.rows ?? [];
}

export async function queryOne(client, sql, params = []) {
  const rows = await queryAll(client, sql, params);
  return rows[0] ?? null;
}

/** Interprets a driver error into a normalized { code, message } for the UI. */
export function normalizeError(err) {
  if (err && err.code === 'VALIDATION') {
    return { code: 'VALIDATION', message: err.message };
  }
  const code = err && err.code ? String(err.code) : '';
  const message = err && err.message ? String(err.message) : 'Unknown database error.';

  const KNOWN = ['NOT_CONFIGURED', 'NOT_FOUND', 'CONFLICT', 'PERMISSION_DENIED', 'NETWORK', 'TIMEOUT', 'CONSENT_REQUIRED', 'MIGRATION_FAILED'];
  if (KNOWN.includes(code)) return { code, message };

  if (code.startsWith('28')) return { code: 'PERMISSION_DENIED', message: 'Authentication failed. Check username and password.' };
  if (code === '28P01') return { code: 'PERMISSION_DENIED', message: 'Authentication failed. Check username and password.' };
  if (code === '3D000') return { code: 'VALIDATION', message: `Database "${extractIdent(message)}" does not exist.` };
  if (code === '42501') return { code: 'PERMISSION_DENIED', message: 'The database user lacks the required privileges to install Recura.' };
  if (code === 'ECONNREFUSED' || message.includes('ECONNREFUSED')) {
    return { code: 'NETWORK', message: 'Could not reach the database host. Check the host and port.' };
  }
  if (code === 'ETIMEDOUT' || message.toLowerCase().includes('timeout')) {
    return { code: 'TIMEOUT', message: 'The database connection timed out.' };
  }
  if (code === 'P0001') return { code: 'VALIDATION', message };
  return { code: 'UNKNOWN', message };
}

function extractIdent(message) {
  const m = /database "([^"]+)"/.exec(message);
  return m ? m[1] : '?';
}

/** Sanitized version of an error for returning to the browser (never leaks the password). */
export function sanitizeError(err) {
  const norm = normalizeError(err);
  if (norm.code === 'UNKNOWN') norm.message = 'An unexpected database error occurred. Please try again.';
  return norm;
}

export const dbLog = {
  connect(info) {
    logger.info('db', `Connected to ${info.host}:${info.port}/${info.database} as ${info.user}`);
  },
};
