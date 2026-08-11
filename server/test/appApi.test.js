import { test } from 'node:test';
import assert from 'node:assert/strict';

import { writeConfig } from '../config.js';
import { handleDataApi } from '../appApi.js';
import { createAppSession, destroyAppSession } from '../auth.js';
import { makeTestEnv, cleanupEnv, VALID_DB } from './helpers.js';

function bearer(token) {
  return { authorization: `Bearer ${token}` };
}

test('api: list works without a session (login bootstrap)', async () => {
  const { dir, mock } = makeTestEnv();
  try {
    writeConfig(VALID_DB);
    mock.seed('Customer', [
      { id: 'c1', name: 'Ada', whatsapp: '+1001' },
      { id: 'c2', name: 'Bob', whatsapp: '+1002' },
    ]);
    const res = await handleDataApi({ op: 'list', table: 'Customer', options: { orderBy: { column: 'name', ascending: true } } });
    assert.equal(res.ok, true);
    assert.deepEqual(res.data.map((r) => r.name), ['Ada', 'Bob']);
  } finally {
    cleanupEnv(dir);
  }
});

test('api: mutating ops require an app session', async () => {
  const { dir, mock } = makeTestEnv();
  try {
    writeConfig(VALID_DB);
    mock.seed('Customer', []);
    const denied = await handleDataApi({ op: 'insert', table: 'Customer', rows: [{ name: 'X' }] });
    assert.equal(denied.ok, false);
    assert.equal(denied.code, 'PERMISSION_DENIED');
    assert.equal(denied.status, 401);
  } finally {
    cleanupEnv(dir);
  }
});

test('api: full CRUD round-trip with parameterized SQL', async () => {
  const { dir, mock } = makeTestEnv();
  try {
    writeConfig(VALID_DB);
    mock.seed('Customer', []);
    const token = createAppSession({ email: 'a@b.c', userName: 'A' });
    try {
      const ins = await handleDataApi({ op: 'insert', table: 'Customer', rows: [{ name: "Bob'; DROP TABLE Customer;--", whatsapp: '+33 6 12 34 56 78' }] }, bearer(token));
      assert.equal(ins.ok, true);
      const row = ins.data[0];
      assert.ok(row.id);

      const insertSql = mock.getQueries().find((q) => q.sql.startsWith('INSERT INTO "Customer"'));
      assert.ok(insertSql, 'insert recorded');
      assert.match(insertSql.sql, /\$1,\s*\$2/);
      assert.equal(insertSql.params[0], "Bob'; DROP TABLE Customer;--");

      const upd = await handleDataApi({ op: 'update', table: 'Customer', id: row.id, patch: { name: 'Bob Clean' } }, bearer(token));
      assert.equal(upd.ok, true);
      assert.equal(upd.data.name, 'Bob Clean');

      const upWhere = await handleDataApi({ op: 'updateWhere', table: 'Customer', match: { whatsapp: '+33 6 12 34 56 78' }, patch: { notes: 'updated' } }, bearer(token));
      assert.equal(upWhere.ok, true);

      const list = await handleDataApi({ op: 'list', table: 'Customer' });
      assert.equal(list.data.length, 1);
      assert.equal(list.data[0].notes, 'updated');

      const del = await handleDataApi({ op: 'delete', table: 'Customer', id: row.id }, bearer(token));
      assert.equal(del.ok, true);
      const after = await handleDataApi({ op: 'delete', table: 'Customer', id: row.id }, bearer(token));
      assert.equal(after.ok, false);
      assert.equal(after.code, 'NOT_FOUND');
    } finally {
      destroyAppSession(token);
    }
  } finally {
    cleanupEnv(dir);
  }
});

test('api: upsert respects the conflict key', async () => {
  const { dir, mock } = makeTestEnv();
  try {
    writeConfig(VALID_DB);
    mock.seed('WhatsAppTemplate', []);
    const token = createAppSession({ email: 'a@b.c', userName: 'A' });
    try {
      const r1 = await handleDataApi({ op: 'upsert', table: 'WhatsAppTemplate', rows: [{ language: 'EN', expiring3Days: 'v1' }], conflictKey: 'language' }, bearer(token));
      assert.equal(r1.ok, true);
      const r2 = await handleDataApi({ op: 'upsert', table: 'WhatsAppTemplate', rows: [{ language: 'EN', expiring3Days: 'v2' }], conflictKey: 'language' }, bearer(token));
      assert.equal(r2.ok, true);
      const rows = mock.getTables().get('whatsapptemplate') || [];
      assert.equal(rows.length, 1);
      assert.equal(rows[0].expiring3Days, 'v2');
    } finally {
      destroyAppSession(token);
    }
  } finally {
    cleanupEnv(dir);
  }
});

test('api: whitelist rejects unknown tables and columns', async () => {
  const { dir, mock } = makeTestEnv();
  try {
    writeConfig(VALID_DB);
    mock.seed('Customer', []);
    const token = createAppSession({ email: 'a@b.c', userName: 'A' });
    try {
      const badTable = await handleDataApi({ op: 'list', table: 'Users; DROP TABLE "User"' });
      assert.equal(badTable.ok, false);
      assert.equal(badTable.code, 'VALIDATION');

      const badColumn = await handleDataApi({ op: 'list', table: 'Customer', options: { orderBy: { column: 'id; SELECT 1' } } });
      assert.equal(badColumn.ok, false);
      assert.equal(badColumn.code, 'VALIDATION');

      const badConflictKey = await handleDataApi({ op: 'upsert', table: 'Customer', rows: [{ name: 'x' }], conflictKey: 'password; DROP' }, bearer(token));
      assert.equal(badConflictKey.ok, false);
      assert.equal(badConflictKey.code, 'VALIDATION');

      const strayColumn = await handleDataApi({ op: 'insert', table: 'Customer', rows: [{ name: 'x', adminSecret: 'leak' }] }, bearer(token));
      assert.equal(strayColumn.ok, true);
      const inserted = strayColumn.data[0];
      assert.equal('adminSecret' in inserted, false);
    } finally {
      destroyAppSession(token);
    }
  } finally {
    cleanupEnv(dir);
  }
});

test('api: not configured returns NOT_CONFIGURED', async () => {
  const { dir } = makeTestEnv();
  try {
    const res = await handleDataApi({ op: 'list', table: 'Customer' });
    assert.equal(res.ok, false);
    assert.equal(res.code, 'NOT_CONFIGURED');
  } finally {
    cleanupEnv(dir);
  }
});
