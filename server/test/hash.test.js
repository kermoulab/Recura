import { test } from 'node:test';
import assert from 'node:assert/strict';

import { hashPassword, verifyPassword, validatePasswordPolicy } from '../hash.js';

// Exact hash from scripts/seed_admin.sql / src/data/dbExport.ts.
const SEED_HASH = '$argon2id$v=19$m=65536,t=3,p=1$QdiQ/RMZXNk4nbzGNtQcIA$rFFVNx7nm/b4xDGMLbB8JIU6GTIH1cI3KA+bRMXmI+E';

test('hash: produces the exact Argon2id encoding the client verifies', async () => {
  const encoded = await hashPassword('testpass123');
  assert.match(encoded, /^\$argon2id\$v=19\$m=65536,t=3,p=1\$[A-Za-z0-9+/=]+\$[A-Za-z0-9+/=]+$/);
  assert.ok(await verifyPassword('testpass123', encoded), 'roundtrip must verify');
  assert.equal(await verifyPassword('wrongpass', encoded), false);
});

test('hash: verifies the legacy seed admin hash (TestAdmin@123)', async () => {
  assert.equal(await verifyPassword('TestAdmin@123', SEED_HASH), true);
  assert.equal(await verifyPassword('not-the-password', SEED_HASH), false);
});

test('hash: refuses non-argon2id hashes and empty inputs', async () => {
  assert.equal(await verifyPassword('x', 'plaintext'), false);
  assert.equal(await verifyPassword('', SEED_HASH), false);
  assert.equal(await verifyPassword('x', null), false);
});

test('hash: password policy', () => {
  assert.equal(validatePasswordPolicy('secret1'), null);
  assert.equal(validatePasswordPolicy(''), 'Password is required.');
  assert.equal(validatePasswordPolicy('123'), 'Password must be at least 6 characters.');
  assert.equal(validatePasswordPolicy('a'.repeat(200)), 'Password must be at most 128 characters.');
});
