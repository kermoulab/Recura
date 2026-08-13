import { test } from 'node:test';
import assert from 'node:assert/strict';

import { parseOrigins, corsHeadersFor, preflightHeaders } from '../cors.js';

test('cors: parseOrigins normalizes the env value', () => {
  assert.deepEqual(parseOrigins(''), []);
  assert.deepEqual(parseOrigins(undefined), []);
  assert.deepEqual(parseOrigins(' https://a.com/, https://b.com/ '), ['https://a.com', 'https://b.com']);
});

test('cors: same-origin and unconfigured requests get no headers', () => {
  assert.equal(corsHeadersFor([], 'https://spa.example'), null);
  assert.equal(corsHeadersFor(['https://spa.example'], undefined), null);
});

test('cors: allowed origin gets credential headers; others are rejected', () => {
  const allowed = corsHeadersFor(['https://spa.example'], 'https://spa.example');
  assert.deepEqual(allowed, {
    'Access-Control-Allow-Origin': 'https://spa.example',
    'Access-Control-Allow-Credentials': 'true',
    'Vary': 'Origin',
  });
  assert.equal(corsHeadersFor(['https://spa.example'], 'https://evil.example'), null);
});

test('cors: preflight includes methods and the CSRF header allow-list', () => {
  const cors = corsHeadersFor(['https://spa.example'], 'https://spa.example');
  const pre = preflightHeaders(cors);
  assert.equal(pre['Access-Control-Allow-Methods'], 'GET, POST, OPTIONS');
  assert.match(pre['Access-Control-Allow-Headers'], /X-CSRF-Token/);
  assert.equal(pre['Access-Control-Allow-Credentials'], 'true');
});
