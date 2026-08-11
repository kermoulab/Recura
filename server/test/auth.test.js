import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  createInstallSession, verifyInstallSession, destroyInstallSession,
  createAppSession, verifyAppSession, destroyAppSession,
  checkCsrf, allowRequest,
} from '../auth.js';

test('auth: install session create/verify/destroy', () => {
  const token = createInstallSession();
  assert.ok(token.length >= 32);
  assert.equal(verifyInstallSession(token), true);
  destroyInstallSession(token);
  assert.equal(verifyInstallSession(token), false);
  assert.equal(verifyInstallSession('bogus'), false);
});

test('auth: app session create/verify/destroy', () => {
  const token = createAppSession({ email: 'a@b.c', userName: 'Alice' });
  const info = verifyAppSession(token);
  assert.equal(info.email, 'a@b.c');
  assert.equal(info.userName, 'Alice');
  destroyAppSession(token);
  assert.equal(verifyAppSession(token), null);
});

test('auth: CSRF double-submit requires a matching header', () => {
  const cookie = 'abc123-xyz'.repeat(3);
  assert.equal(checkCsrf({ recura_csrf: cookie }, cookie), true);
  assert.equal(checkCsrf({ recura_csrf: cookie }, 'attacker-token'), false);
  assert.equal(checkCsrf({}, cookie), false);
  assert.equal(checkCsrf({ recura_csrf: 'short' }, 'short'), false, 'short cookie rejected');
});

test('auth: per-IP rate limiting', () => {
  const ip = '203.0.113.7';
  assert.equal(allowRequest('test', ip, 3), true);
  assert.equal(allowRequest('test', ip, 3), true);
  assert.equal(allowRequest('test', ip, 3), true);
  assert.equal(allowRequest('test', ip, 3), false, '4th request within the window is blocked');
  assert.equal(allowRequest('other', ip, 3), true, 'different bucket unaffected');
  assert.equal(allowRequest('test', '203.0.113.8', 3), true, 'different IP unaffected');
});
