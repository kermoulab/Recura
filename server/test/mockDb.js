/**
 * In-memory mock of the node-postgres driver surface used by the server.
 *
 * It understands the exact SQL shapes the server generates (identifiers from
 * the allow-list, values always bound), so tests can assert:
 *   - correct identifier handling and parameter binding
 *   - installation state transitions and migration tracking
 *   - error paths (permission probe, migration failure, duplicates)
 *
 * It deliberately does NOT parse arbitrary SQL.
 */

import crypto from 'node:crypto';

function generateId() {
  return crypto.randomUUID();
}

export function createMockDb(overrides = {}) {
  const tables = new Map(); // lowercased name -> array of row objects
  const names = new Set(); // case-preserved table names (for information_schema)
  const migrations = new Map(); // version -> { version, name, status, error }
  const queries = []; // { sql, params }
  let lockBusy = false;
  let failNext = null; // fn(sql, params) -> throw, once
  let failOnList = []; // { match, error }
  let failPermission = false;
  let failConnect = false;

  function ensureTable(name) {
    names.add(name);
    const key = name.toLowerCase();
    if (!tables.has(key)) tables.set(key, []);
    return key;
  }

  function countRows(sql) {
    // `SELECT count(*)::int AS n FROM "X"`
    const m = /FROM\s+"([^"]+)"/.exec(sql);
    if (!m) return { rows: [{ n: 0 }] };
    return { rows: [{ n: (tables.get(m[1].toLowerCase()) || []).length }] };
  }

  function listRows(sql, params) {
    const m = /FROM\s+"([^"]+)"/.exec(sql);
    if (!m) return { rows: [] };
    const key = m[1].toLowerCase();
    let rows = tables.get(key) || [];
    const order = /ORDER BY "([^"]+)" (ASC|DESC)/.exec(sql);
    if (order) {
      const col = order[1];
      const dir = order[2] === 'DESC' ? -1 : 1;
      rows = [...rows].sort((a, b) => {
        const av = a[col];
        const bv = b[col];
        if (av == null) return 1;
        if (bv == null) return -1;
        return String(av) < String(bv) ? -dir : String(av) > String(bv) ? dir : 0;
      });
    }
    const limit = /LIMIT \$(\d+)/.exec(sql);
    if (limit) rows = rows.slice(0, Number(params[Number(limit[1]) - 1]));
    return { rows };
  }

  function insertRows(sql, params) {
    const tableMatch = /INSERT INTO\s+"([^"]+)"/.exec(sql);
    if (!tableMatch) return { rows: [], rowCount: 0 };
    const table = tableMatch[1];
    const key = ensureTable(table);

    const colsMatch = /\(([^)]+)\)\s+VALUES/.exec(sql);
    if (!colsMatch) return { rows: [], rowCount: 0 };
    const cols = colsMatch[1].split(',').map((c) => c.trim().replace(/^"|"$/g, ''));

    const tupleRe = /\((\$\d+(?:\s*,\s*\$\d+)*)\)/g;
    const conflictMatch = /ON CONFLICT \("([^"]+)"\)/.exec(sql);
    const inserted = [];
    let m;
    while ((m = tupleRe.exec(sql)) !== null) {
      const indexes = m[1].match(/\$\d+/g).map((p) => Number(p.slice(1)) - 1);
      const row = {};
      cols.forEach((col, i) => { row[col] = params[indexes[i]]; });
      if (!('id' in row) && table !== 'WhatsAppTemplate') row.id = generateId();
      const rows = tables.get(key);
      if (conflictMatch) {
        const ck = conflictMatch[1];
        const idx = rows.findIndex((r) => r[ck] === row[ck]);
        if (idx >= 0) rows[idx] = { ...rows[idx], ...row };
        else rows.push(row);
      } else {
        rows.push(row);
      }
      inserted.push(row);
    }
    return { rows: inserted, rowCount: inserted.length };
  }

  function updateRows(sql, params) {
    const tableMatch = /UPDATE\s+"([^"]+)"/.exec(sql);
    if (!tableMatch) return { rows: [], rowCount: 0 };
    const key = tableMatch[1].toLowerCase();
    const rows = tables.get(key) || [];

    const setMatches = [...sql.matchAll(/"([^"]+)"\s*=\s*\$(\d+)/g)];
    const idMatch = /WHERE "id" = \$(\d+)/.exec(sql);
    const returning = /RETURNING \*/.test(sql);
    let updated = 0;
    for (const row of rows) {
      if (idMatch && row.id !== params[Number(idMatch[1]) - 1]) continue;
      if (!idMatch) {
        const whereMatch = [...sql.matchAll(/WHERE\s+"([^"]+)"\s*=\s*\$(\d+)/g)];
        if (whereMatch.length === 0) continue;
        const ok = whereMatch.every((wm) => row[wm[1]] === params[Number(wm[2]) - 1]);
        if (!ok) continue;
      }
      for (const sm of setMatches) row[sm[1]] = params[Number(sm[2]) - 1];
      updated += 1;
      if (idMatch) return { rows: [row], rowCount: 1 };
    }
    return { rows: [], rowCount: updated };
  }

  function deleteRows(sql, params) {
    const tableMatch = /DELETE FROM\s+"([^"]+)"/.exec(sql);
    if (!tableMatch) return { rowCount: 0 };
    const key = tableMatch[1].toLowerCase();
    const rows = tables.get(key) || [];
    const idMatch = /WHERE "id" = \$(\d+)/.exec(sql);
    const before = rows.length;
    if (idMatch) {
      const id = params[Number(idMatch[1]) - 1];
      for (let i = rows.length - 1; i >= 0; i--) {
        if (rows[i].id === id) rows.splice(i, 1);
      }
    }
    return { rows: [], rowCount: before - rows.length };
  }

  /** Parses migration-file SQL (our own generated statements) into mock tables. */
  function handleMigrationSql(sql) {
    if (/DO \$\$/.test(sql)) {
      // enum creation — ignore
    }
    const createRe = /CREATE TABLE IF NOT EXISTS "([^"]+)"\s*\(([\s\S]*?)\)\s*;?/g;
    let m;
    while ((m = createRe.exec(sql)) !== null) {
      const name = m[1];
      const key = ensureTable(name);
      const cols = [...m[2].matchAll(/"([^"]+)"/g)].map((c) => c[1]);
      if (!tables.get(key).length && cols.length) {
        tables.set(key, []);
      }
    }
    if (/CREATE TABLE IF NOT EXISTS service_accounts/.test(sql)) ensureTable('service_accounts');
    if (/INSERT INTO "WhatsAppTemplate"/.test(sql)) {
      const key = ensureTable('WhatsAppTemplate');
      const langs = [...sql.matchAll(/^\s*\('([A-Z]{2})',/gm)].map((l) => l[1]);
      if (langs.length && tables.get(key).length === 0) {
        tables.set(key, langs.map((lang) => ({ language: lang, expiring3Days: '', expired: '', thanksClient: '' })));
      }
    }
  }

  class Client {
    constructor(config) {
      this.config = config;
      this.connected = false;
    }
    async connect() {
      if (failConnect) throw new Error('connect ECONNREFUSED');
      this.connected = true;
    }
    async end() {
      this.connected = false;
    }
    async query(sql, params = []) {
      queries.push({ sql, params: [...params] });
      if (failNext) {
        const fn = failNext;
        failNext = null;
        fn(sql, params);
      }
      for (const entry of failOnList) {
        if (sql.includes(entry.match)) throw entry.error;
      }
      if (sql.startsWith('BEGIN')) return { rows: [] };
      if (sql.startsWith('COMMIT')) return { rows: [] };
      if (sql.startsWith('ROLLBACK')) return { rows: [] };
      if (sql.includes('pg_try_advisory_lock')) {
        if (lockBusy) return { rows: [{ locked: false }] };
        lockBusy = true;
        return { rows: [{ locked: true }] };
      }
      if (sql.includes('pg_advisory_unlock')) {
        lockBusy = false;
        return { rows: [] };
      }
      if (sql.includes('SELECT version() AS version')) {
        return { rows: [{ version: overrides.serverVersion || 'PostgreSQL 16.3 on x86_64-pc-linux-gnu', database: 'testdb' }] };
      }
      if (sql.includes('information_schema.tables')) {
        const out = [...names].filter((n) => n !== 'schema_migrations');
        return { rows: out.map((n) => ({ table_name: n })) };
      }
      if (sql.includes('CREATE TABLE IF NOT EXISTS schema_migrations')) {
        ensureTable('schema_migrations');
        return { rows: [] };
      }
      if (sql.includes('CREATE TABLE "recura_permission_probe"')) {
        if (failPermission) throw Object.assign(new Error('permission denied'), { code: '42501' });
        ensureTable('recura_permission_probe');
        return { rows: [] };
      }
      if (/CREATE TABLE IF NOT EXISTS "|CREATE TABLE IF NOT EXISTS service_accounts/.test(sql)) {
        handleMigrationSql(sql);
        return { rows: [] };
      }
      if (sql.includes('INSERT INTO "WhatsAppTemplate"') && !sql.includes('ON CONFLICT')) {
        handleMigrationSql(sql);
        return { rows: [] };
      }
      if (sql.includes('schema_migrations') && sql.includes('INSERT INTO')) {
        const version = params[0];
        migrations.set(version, { version, name: params[1], status: params[2] || 'SUCCESS', error: params[3] || null });
        return { rows: [], rowCount: 1 };
      }
      if (sql.includes('schema_migrations') && sql.includes('SELECT version, name, status, error')) {
        return { rows: [...migrations.values()] };
      }
      if (sql.includes('UPDATE "Order" SET "orderNumber"')) {
        return { rows: [], rowCount: 0 };
      }
      if (/count\(\*\)::int AS n FROM/.test(sql)) return countRows(sql);
      if (/INSERT INTO\s+"[^"]+"/.test(sql)) return insertRows(sql, params);
      if (/UPDATE\s+"[^"]+"/.test(sql)) return updateRows(sql, params);
      if (/DELETE FROM\s+"[^"]+"/.test(sql)) return deleteRows(sql, params);
      if (/SELECT \* FROM\s+"[^"]+"/.test(sql)) return listRows(sql, params);
      if (/SELECT "email", "username" FROM "User"/.test(sql)) {
        const rows = tables.get('user') || [];
        const email = params[0];
        const username = params[1];
        return { rows: rows.filter((r) => r.email === email || r.username === username) };
      }
      if (/SELECT \* FROM "User"/.test(sql)) {
        const rows = tables.get('user') || [];
        const id = params[0];
        return { rows: rows.filter((r) => r.email === id || r.username === id || r.email.toLowerCase() === String(id).toLowerCase() || String(r.username || '').toLowerCase() === String(id).toLowerCase()) };
      }
      if (/SELECT "email" FROM "User"/.test(sql)) {
        const rows = tables.get('user') || [];
        const roleMatch = /"role" = '([^']+)'/.exec(sql);
        const match = rows.find((r) => (roleMatch ? r.role === roleMatch[1] : true));
        return { rows: match ? [match] : [] };
      }
      return { rows: [], rowCount: 0 };
    }
  }

  return {
    Client,
    getQueries: () => queries,
    getTables: () => tables,
    getMigrations: () => migrations,
    setLockBusy: (v) => { lockBusy = v; },
    failNext: (fn) => { failNext = fn; },
    failOn: (match, error) => { failOnList.push({ match, error }); },
    clearFails: () => { failOnList = []; },
    setFailPermission: (v) => { failPermission = v; },
    setFailConnect: (v) => { failConnect = v; },
    seed(table, rows) {
      const key = ensureTable(table);
      tables.set(key, rows);
    },
  };
}
