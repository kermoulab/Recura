/**
 * Seed test: inserts a varied, realistic business dataset — customers, product
 * catalog (categories/products/digital assets), plans, service accounts, and
 * orders — through the live data API, then proves every entity persisted to
 * the database (list-reads + cross-entity referential consistency).
 */

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

import { makeTestEnv, cleanupEnv, VALID_DB, asBody } from './helpers.js';
import { startServer, stopServer } from '../index.js';
import { INSTALL_STATUS, getInstallStatus } from '../config.js';

let env;
let base;
let csrfToken;
let cookie;
let appToken;

// Captured ids returned by inserts (used to link records across tables).
const ids = {
  customers: [],
  categories: [],
  products: [],
  assets: [],
  plans: [],
  serviceAccounts: [],
  orders: [],
};

async function json(method, url, body, extraHeaders = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...extraHeaders,
  };
  if (cookie) headers.Cookie = cookie;
  if (csrfToken && method !== 'GET') headers['X-CSRF-Token'] = csrfToken;
  const res = await fetch(`${base}${url}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let parsed = {};
  try { parsed = text ? JSON.parse(text) : {}; } catch { /* non-json */ }
  return { status: res.status, body: parsed };
}

async function csrf() {
  const res = await fetch(`${base}/api/csrf`);
  const body = await res.json();
  csrfToken = body.csrfToken;
  const setCookie = res.headers.get('set-cookie') || '';
  cookie = setCookie.split(';')[0];
}

/** POST /api/db with the admin session attached. */
async function db(op, payload) {
  const { status, body } = await json(
    'POST',
    '/api/db',
    { op, ...payload },
    { Authorization: `Bearer ${appToken}` },
  );
  assert.equal(status, 200, `op ${op} on ${payload.table} failed: ${body.message}`);
  assert.equal(body.ok, true, `op ${op} on ${payload.table} failed: ${body.message}`);
  return body.data;
}

async function insert(table, rows) {
  const data = await db('insert', { table, rows });
  return data;
}

async function listAll(table) {
  return db('list', { table });
}

before(async () => {
  env = makeTestEnv();
  const { port } = await startServer(0);
  base = `http://127.0.0.1:${port}`;
  await csrf();

  // ---- installer: empty DB -> INSTALLED (same flow as the browser) ----
  const start = await json('POST', '/api/install/start', { ...asBody(VALID_DB), dbState: 'empty' });
  assert.equal(start.body.ok, true);
  const auth = { Authorization: `Bearer ${start.body.installToken}` };

  const migrate = await json('POST', '/api/install/migrate', {}, auth);
  assert.equal(migrate.body.ok, true);
  assert.equal(migrate.body.result.applied.length, 9);

  const admin = await json('POST', '/api/install/admin', {
    name: 'System Owner', username: 'admin', email: 'admin@recura.local', password: 'Sup3rStrong#2024',
  }, auth);
  assert.equal(admin.body.ok, true);

  const complete = await json('POST', '/api/install/complete', {}, auth);
  assert.equal(complete.body.ok, true);
  assert.equal(getInstallStatus(), INSTALL_STATUS.INSTALLED);

  const login = await json('POST', '/api/auth/login', { identifier: 'admin@recura.local', password: 'Sup3rStrong#2024' });
  assert.equal(login.body.ok, true);
  appToken = login.body.token;
});

after(async () => {
  await stopServer();
  cleanupEnv(env.dir);
});

test('seed: inserts a varied set of customers', async () => {
  const rows = await insert('Customer', [
    { name: 'Amine Benali', whatsapp: '+212600000001', email: 'amine.benali@example.com', preferredLanguage: 'AR', status: 'ACTIVE', notes: 'Prefers renewal pushed on WhatsApp' },
    { name: 'Sarah Connor', whatsapp: '+100100000002', email: 'sarah@example.com', preferredLanguage: 'EN', status: 'ACTIVE', notes: '' },
    { name: 'Jean Lambert', whatsapp: '+330600000003', email: 'jean.lambert@example.com', preferredLanguage: 'FR', status: 'INACTIVE', notes: 'On hold' },
  ]);
  ids.customers = rows.map((r) => r.id);
  assert.equal(ids.customers.length, 3);
  assert.ok(ids.customers.every(Boolean));

  const all = await listAll('Customer');
  assert.equal(all.length, 3);
  const names = all.map((r) => r.name);
  assert.ok(names.includes('Amine Benali'));
  assert.ok(names.includes('Sarah Connor'));
  assert.ok(names.includes('Jean Lambert'));
  assert.ok(all.every((r) => r.whatsapp && r.preferredLanguage));
});

test('seed: inserts product catalog (categories, products, assets)', async () => {
  const cats = await insert('product_categories', [
    { name: 'Cloud Storage', description: 'Dropbox, Google Drive subscriptions', status: 'ACTIVE' },
    { name: 'Music Streaming', description: 'Spotify, Deezer subscriptions', status: 'ACTIVE' },
    { name: 'AI & Productivity', description: 'ChatGPT, Gemini, Claude', status: 'ACTIVE' },
  ]);
  ids.categories = cats.map((r) => r.id);

  const prods = await insert('products', [
    { name: 'Netflix Premium UHD', description: '4K screens, shared account', category_id: ids.categories[1], provider_id: 'netflix', fulfillment_type: 'SHARED_ACCOUNT', status: 'ACTIVE' },
    { name: 'Microsoft 365 Family', description: '6 seats, 1TB each', category_id: ids.categories[0], provider_id: 'microsoft', fulfillment_type: 'SEAT', status: 'ACTIVE' },
    { name: 'ChatGPT Plus', description: 'Individual credentials', category_id: ids.categories[2], provider_id: 'openai', fulfillment_type: 'CREDENTIALS', status: 'ACTIVE' },
  ]);
  ids.products = prods.map((r) => r.id);
  assert.equal(ids.products.length, 3);
  assert.ok(ids.products.every(Boolean));

  const assets = await insert('digital_assets', [
    { product_id: ids.products[0], fulfillment_type: 'SHARED_ACCOUNT', identifier: 'nf-uhd-core@example.com', status: 'AVAILABLE', capacity: 4, occupied_capacity: 3 },
    { product_id: ids.products[0], fulfillment_type: 'SHARED_ACCOUNT', identifier: 'nf-uhd-seat1@example.com', status: 'SOLD_OUT', capacity: 1, occupied_capacity: 1 },
    { product_id: ids.products[1], fulfillment_type: 'SEAT', identifier: 'm365-family@example.com', status: 'AVAILABLE', capacity: 6, occupied_capacity: 2 },
    { product_id: ids.products[2], fulfillment_type: 'CREDENTIALS', identifier: 'gptplus-licence@example.com', status: 'AVAILABLE', capacity: 1, occupied_capacity: 0 },
  ]);
  ids.assets = assets.map((r) => r.id);
  assert.equal(ids.assets.length, 4);

  const all = await listAll('products');
  assert.equal(all.length, 3);
  assert.ok(all.every((r) => r.fulfillment_type && r.status === 'ACTIVE'));
});

test('seed: inserts plans linked to products', async () => {
  const rows = await insert('Plan', [
    { product_id: ids.products[0], name: 'Netflix UHD — 1 Month', category: 'Streaming & Entertainment', price: 4.99, durationMonths: 1, availableStock: 8, totalAccounts: 3, activeOrders: 3 },
    { product_id: ids.products[0], name: 'Netflix UHD — 1 Year', category: 'Streaming & Entertainment', price: 49.99, durationMonths: 12, availableStock: 8, totalAccounts: 3, activeOrders: 0 },
    { product_id: ids.products[1], name: 'Microsoft 365 Family — 1 Year', category: 'Software & Tools', price: 59.99, durationMonths: 12, availableStock: 4, totalAccounts: 1, activeOrders: 1 },
    { product_id: ids.products[2], name: 'ChatGPT Plus — 1 Month', category: 'AI & Productivity', price: 19.99, durationMonths: 1, availableStock: 10, totalAccounts: 1, activeOrders: 0 },
  ]);
  ids.plans = rows.map((r) => r.id);
  assert.equal(ids.plans.length, 4);
  assert.ok(ids.plans.every(Boolean));

  const all = await listAll('Plan');
  assert.equal(all.length, 4);
  assert.ok(all.every((r) => r.product_id && r.price > 0 && r.durationMonths > 0));
});

test('seed: inserts service accounts (password redacted on read)', async () => {
  const rows = await insert('service_accounts', [
    { service_type: 'Netflix', provider_id: 'netflix', email: 'acc.netflix.shared@example.com', password: 'Nf!s3cret', subscription_start: '2026-07-01T00:00:00.000Z', subscription_end: '2026-09-20T00:00:00.000Z', purchase_cost: 3.0, capacity: 4, status: 'Active' },
    { service_type: 'Microsoft 365', provider_id: 'microsoft', email: 'fambox.m365@example.com', password: 'Ms!fams3cret', subscription_start: '2026-01-01T00:00:00.000Z', subscription_end: '2027-01-01T00:00:00.000Z', purchase_cost: 49.0, capacity: 6, status: 'Active' },
    { service_type: 'ChatGPT', provider_id: 'openai', email: 'team.gpt@example.com', password: 'Gpt!s3cret', subscription_start: '2025-06-01T00:00:00.000Z', subscription_end: '2026-06-01T00:00:00.000Z', purchase_cost: 19.0, capacity: 1, status: 'Active' },
  ]);
  ids.serviceAccounts = rows.map((r) => r.id);
  assert.equal(ids.serviceAccounts.length, 3);

  const all = await listAll('service_accounts');
  assert.equal(all.length, 3);
  const types = all.map((r) => r.service_type).sort();
  assert.deepEqual(types, ['ChatGPT', 'Microsoft 365', 'Netflix']);
  assert.ok(all.every((r) => !('password' in r)), 'service account passwords must never be returned');
  assert.ok(all.every((r) => r.email && r.capacity >= 1));
});

test('seed: inserts orders linking customers, plans, products, assets, accounts', async () => {
  const rows = await insert('Order', [
    // 1. Shared-account Netflix renewal born active
    {
      orderNumber: 1001, customerId: ids.customers[0], customerName: 'Amine Benali', customerWhatsApp: '+212600000001',
      planId: ids.plans[1], planName: 'Netflix UHD — 1 Year', price: 49.99, durationMonths: 12,
      startDate: '2026-09-14T00:00:00.000Z', endDate: '2027-09-14T00:00:00.000Z', status: 'ACTIVE',
      accountEmail: 'acc.netflix.shared@example.com', accountPasswordEncrypted: 'ENC:nf', screenProfileName: 'AMINE',
      service_account_id: ids.serviceAccounts[0],
    },
    // 2. Same shared account, second customer, expiring soon
    {
      orderNumber: 1002, customerId: ids.customers[1], customerName: 'Sarah Connor', customerWhatsApp: '+100100000002',
      planId: ids.plans[0], planName: 'Netflix UHD — 1 Month', price: 4.99, durationMonths: 1,
      startDate: '2026-08-14T00:00:00.000Z', endDate: '2026-09-16T00:00:00.000Z', status: 'EXPIRING_7D',
      accountEmail: 'acc.netflix.shared@example.com', accountPasswordEncrypted: 'ENC:nf', screenProfileName: 'SARAH',
      service_account_id: ids.serviceAccounts[0],
    },
    // 3. Seat-based Microsoft 365 order, already expired
    {
      orderNumber: 1003, customerId: ids.customers[2], customerName: 'Jean Lambert', customerWhatsApp: '+330600000003',
      planId: ids.plans[2], planName: 'Microsoft 365 Family — 1 Year', price: 59.99, durationMonths: 12,
      startDate: '2025-09-01T00:00:00.000Z', endDate: '2026-07-01T00:00:00.000Z', status: 'EXPIRED',
      accountEmail: 'jean.m365@example.com', accountPasswordEncrypted: 'ENC:m365', screenProfileName: 'JEAN',
      product_id: ids.products[1], digital_asset_id: ids.assets[2], fulfillment_type: 'SEAT',
    },
    // 4. Credentials-based digital order (no shared service account)
    {
      orderNumber: 1004, customerId: ids.customers[1], customerName: 'Sarah Connor', customerWhatsApp: '+100100000002',
      planId: ids.plans[3], planName: 'ChatGPT Plus — 1 Month', price: 19.99, durationMonths: 1,
      startDate: '2026-09-01T00:00:00.000Z', endDate: '2026-10-01T00:00:00.000Z', status: 'ACTIVE',
      accountEmail: 'sarah.gpt-plus@example.com', accountPasswordEncrypted: 'ENC:gpt', screenProfileName: 'SARAH',
      product_id: ids.products[2], digital_asset_id: ids.assets[3], fulfillment_type: 'CREDENTIALS',
    },
  ]);
  ids.orders = rows.map((r) => r.id);
  assert.equal(ids.orders.length, 4);

  const all = await listAll('Order');
  assert.equal(all.length, 4);
  assert.deepEqual(
    [...new Set(all.map((r) => r.status))].sort(),
    ['ACTIVE', 'EXPIRED', 'EXPIRING_7D'],
  );
  assert.equal(all.filter((r) => r.fulfillment_type === 'SEAT').length, 1);
  assert.equal(all.filter((r) => r.fulfillment_type === 'CREDENTIALS').length, 1);
  assert.equal(all.filter((r) => r.service_account_id).length, 2);
});

test('seed: cross-entity referential consistency', async () => {
  const customers = await listAll('Customer');
  const products = await listAll('products');
  const assets = await listAll('digital_assets');
  const plans = await listAll('Plan');
  const accounts = await listAll('service_accounts');
  const orders = await listAll('Order');

  const idSet = (rows) => new Set(rows.map((r) => r.id));
  const c = idSet(customers), p = idSet(products), a = idSet(assets), pl = idSet(plans), s = idSet(accounts);

  for (const o of orders) {
    assert.ok(c.has(o.customerId), `order ${o.orderNumber} references missing customer ${o.customerId}`);
    assert.ok(pl.has(o.planId), `order ${o.orderNumber} references missing plan ${o.planId}`);
    if (o.product_id !== null) assert.ok(p.has(o.product_id), `order ${o.orderNumber} references missing product ${o.product_id}`);
    if (o.digital_asset_id !== null) assert.ok(a.has(o.digital_asset_id), `order ${o.orderNumber} references missing asset ${o.digital_asset_id}`);
    if (o.service_account_id !== null) assert.ok(s.has(o.service_account_id), `order ${o.orderNumber} references missing service account ${o.service_account_id}`);
    assert.ok(o.customerWhatsApp, `order ${o.orderNumber} missing whatsapp`);
    assert.ok(o.accountEmail && o.accountPasswordEncrypted, `order ${o.orderNumber} missing credentials`);
  }
});