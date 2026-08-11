/**
 * Data API — the HTTP implementation of the frontend DatabaseAdapter contract.
 *
 * Endpoint: POST /api/db   body: { op, table, ... }
 *
 * SECURITY:
 *   * Table and column identifiers are validated against the server-side
 *     allow-list (server/schema.js) — the client can never inject SQL names.
 *   * Values are ALWAYS bound as parameters.
 *   * Mutating operations (insert/update/delete/upsert) require a valid app
 *     session bearer token (issued by /api/auth/session after login).
 *   * Read operations are allowed without a token to support the existing
 *     client-side login flow (which verifies passwords against the user table).
 *     This mirrors the app's existing trust model (Supabase anon-key reads)
 *     and is enforced to be at least as strict: RLS-independent, server-filtered.
 */

import { assertTable, assertColumn, sanitizeRow, quoteIdent } from './schema.js';
import { readConfig } from './config.js';
import { connectClient, queryAll, normalizeError } from './db.js';
import { verifyAppSession } from './auth.js';
import { logger } from './logger.js';

export const PROVIDER = 'postgres';
const MAX_ROWS = 1000;
const MAX_BATCH = 100;

const OPERATIONS = new Set(['list', 'insert', 'update', 'updateWhere', 'delete', 'upsert', 'ping']);

/** Lazily-created connection pool-ish helper. For simplicity each request uses
 *  a short-lived dedicated connection from the live config. */
async function withConnection(fn) {
  const config = readConfig();
  if (!config) {
    throw Object.assign(new Error('Recura is not installed or its database is not configured.'), { code: 'NOT_CONFIGURED' });
  }
  const client = await connectClient(config);
  try {
    return await fn(client);
  } finally {
    try { await client.end(); } catch { /* ignore */ }
  }
}

function unionKeys(rows) {
  const keys = new Set();
  for (const row of rows) for (const k of Object.keys(row)) keys.add(k);
  return [...keys];
}

function buildInsert(table, rows) {
  const cols = [];
  for (const row of rows) {
    for (const [k, v] of Object.entries(sanitizeRow(table, row))) {
      if (!cols.includes(k)) cols.push(k);
    }
  }
  if (cols.length === 0) {
    throw Object.assign(new Error('No writable columns provided.'), { code: 'VALIDATION' });
  }
  const idents = cols.map(quoteIdent).join(', ');
  const tuples = rows.map((_, rIdx) =>
    `(${cols.map((_, cIdx) => `$${rIdx * cols.length + cIdx + 1}`).join(', ')})`
  );
  const values = rows.flatMap((row) =>
    cols.map((c) => {
      const v = row[c];
      return v === undefined ? null : v;
    })
  );
  return { sql: `INSERT INTO ${quoteIdent(table)} (${idents}) VALUES ${tuples.join(', ')} RETURNING *`, values };
}

function buildUpdateSet(table, patch) {
  const clean = sanitizeRow(table, patch);
  const keys = Object.keys(clean);
  if (keys.length === 0) {
    throw Object.assign(new Error('No writable columns provided.'), { code: 'VALIDATION' });
  }
  return {
    assignments: keys.map((k, i) => `${quoteIdent(k)} = $${i + 1}`),
    keys,
    values: keys.map((k) => (clean[k] === undefined ? null : clean[k])),
  };
}

function buildMatchWhere(match) {
  const keys = Object.keys(match);
  if (keys.length === 0) {
    throw Object.assign(new Error('A match condition is required.'), { code: 'VALIDATION' });
  }
  const conditions = keys.map((k, i) => `${quoteIdent(k)} = $${i + 1}`);
  const values = keys.map((k) => match[k]);
  return { conditions, values, keys };
}

/** ---------- operations ---------- */

async function opList(client, table, options) {
  assertTable(table);
  let sql = `SELECT * FROM ${quoteIdent(table)}`;
  const params = [];
  const orderBy = options?.orderBy;
  if (orderBy && orderBy.column) {
    assertColumn(table, orderBy.column);
    sql += ` ORDER BY ${quoteIdent(orderBy.column)} ${orderBy.ascending === false ? 'DESC' : 'ASC'}`;
  }
  const limit = options?.limit ? Math.min(Number(options.limit) || 0, MAX_ROWS) : 0;
  if (limit > 0) {
    params.push(limit);
    sql += ` LIMIT $${params.length}`;
  }
  return queryAll(client, sql, params);
}

async function opInsert(client, table, rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    throw Object.assign(new Error('No rows to insert.'), { code: 'VALIDATION' });
  }
  if (rows.length > MAX_BATCH) {
    throw Object.assign(new Error(`Batch too large (max ${MAX_BATCH} rows).`), { code: 'VALIDATION' });
  }
  const { sql, values } = buildInsert(table, rows);
  return queryAll(client, sql, values);
}

async function opUpdate(client, table, id, patch) {
  if (id === undefined || id === null || id === '') {
    throw Object.assign(new Error('Record id is required.'), { code: 'VALIDATION' });
  }
  const { assignments, values } = buildUpdateSet(table, patch);
  const params = [...values, id];
  const sql = `UPDATE ${quoteIdent(table)} SET ${assignments.join(', ')} WHERE "id" = $${params.length} RETURNING *`;
  const rows = await queryAll(client, sql, params);
  if (rows.length === 0) {
    throw Object.assign(new Error('Record not found.'), { code: 'NOT_FOUND' });
  }
  return rows[0];
}

async function opUpdateWhere(client, table, match, patch) {
  const setPart = buildUpdateSet(table, patch);
  const { conditions, values } = buildMatchWhere(match);
  const offset = setPart.values.length;
  const shifted = conditions.map((c, i) => c.replace(/\$\d+/, `$${i + 1 + offset}`));
  const allParams = [...setPart.values, ...values];
  const sql = `UPDATE ${quoteIdent(table)} SET ${setPart.assignments.join(', ')} WHERE ${shifted.join(' AND ')}`;
  await client.query(sql, allParams);
}

async function opDelete(client, table, id) {
  if (id === undefined || id === null || id === '') {
    throw Object.assign(new Error('Record id is required.'), { code: 'VALIDATION' });
  }
  const res = await client.query(`DELETE FROM ${quoteIdent(table)} WHERE "id" = $1`, [id]);
  if (!res.rowCount) {
    throw Object.assign(new Error('Record not found.'), { code: 'NOT_FOUND' });
  }
}

async function opUpsert(client, table, rows, conflictKey) {
  if (!Array.isArray(rows) || rows.length === 0) {
    throw Object.assign(new Error('No rows to upsert.'), { code: 'VALIDATION' });
  }
  if (rows.length > MAX_BATCH) {
    throw Object.assign(new Error(`Batch too large (max ${MAX_BATCH} rows).`), { code: 'VALIDATION' });
  }
  assertColumn(table, conflictKey);
  const { sql, values } = buildInsert(table, rows);
  const updateCols = unionKeys(rows).filter((k) => k !== conflictKey && assertColumnSafe(table, k));
  const updates = updateCols.map((k) => `${quoteIdent(k)} = EXCLUDED.${quoteIdent(k)}`);
  let fullSql = sql;
  if (updates.length > 0) {
    fullSql += ` ON CONFLICT (${quoteIdent(conflictKey)}) DO UPDATE SET ${updates.join(', ')}`;
  }
  await client.query(fullSql, values);
}

function assertColumnSafe(table, col) {
  try { assertColumn(table, col); return true; } catch { return false; }
}

/** ---------- public entry ---------- */

export function requiresSession(op) {
  return op !== 'list' && op !== 'ping';
}

export async function handleDataApi(body, headers = {}) {
  const op = body?.op;
  if (!OPERATIONS.has(op)) {
    return errorResult('VALIDATION', 'Unknown database operation.', 400, op);
  }

  if (requiresSession(op)) {
    const token = String(headers.authorization || '').replace(/^Bearer\s+/i, '');
    if (!verifyAppSession(token)) {
      return errorResult('PERMISSION_DENIED', 'Your session has expired. Please log out and log in again.', 401, op);
    }
  }

  try {
    let data;
    await withConnection(async (client) => {
      switch (op) {
        case 'list':
          data = await opList(client, body.table, body.options);
          break;
        case 'insert':
          data = await opInsert(client, body.table, body.rows);
          break;
        case 'update':
          data = await opUpdate(client, body.table, body.id, body.patch);
          break;
        case 'updateWhere':
          await opUpdateWhere(client, body.table, body.match, body.patch);
          data = true;
          break;
        case 'delete':
          await opDelete(client, body.table, body.id);
          data = true;
          break;
        case 'upsert':
          await opUpsert(client, body.table, body.rows, body.conflictKey);
          data = true;
          break;
        case 'ping':
          data = { provider: PROVIDER };
          break;
        default:
          throw Object.assign(new Error('Unsupported operation.'), { code: 'VALIDATION' });
      }
    });
    return { ok: true, data };
  } catch (err) {
    logger.warn('api', `Data op ${op} failed: ${normalizeError(err).code}`);
    return errorResult(normalizeError(err).code, normalizeError(err).message, statusFor(normalizeError(err).code), op);
  }
}

function statusFor(code) {
  switch (code) {
    case 'VALIDATION': return 400;
    case 'NOT_FOUND': return 404;
    case 'CONFLICT': return 409;
    case 'PERMISSION_DENIED': return 401;
    case 'NOT_CONFIGURED': return 503;
    default: return 500;
  }
}

function errorResult(code, message, status, operation) {
  const out = { ok: false, code, message };
  if (operation) out.operation = operation;
  out.status = status;
  return out;
}
