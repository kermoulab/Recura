/**
 * Server-side identifier allow-list.
 *
 * This is the security boundary that prevents arbitrary SQL: the ONLY names
 * ever interpolated into SQL strings are the tables and columns listed here.
 * Everything the client sends is validated against it; values are always bound
 * as parameters.
 */

export const TABLES = Object.freeze({
  User: Object.freeze([
    'id', 'name', 'username', 'email', 'passwordHash', 'role', 'mfaEnabled',
    'currency', 'createdAt', 'updatedAt',
  ]),
  Customer: Object.freeze([
    'id', 'name', 'whatsapp', 'email', 'preferredLanguage', 'status', 'notes',
    'isDeleted', 'createdAt', 'updatedAt',
  ]),
  Plan: Object.freeze([
    'id', 'name', 'category', 'price', 'durationMonths', 'notes',
    'availableStock', 'totalAccounts', 'activeOrders', 'isDeleted',
    'createdAt', 'updatedAt',
  ]),
  Order: Object.freeze([
    'id', 'orderNumber', 'customerId', 'customerName', 'customerWhatsApp',
    'planId', 'planName', 'price', 'durationMonths', 'startDate', 'endDate',
    'status', 'accountEmail', 'accountPasswordEncrypted', 'pinCodeEncrypted',
    'screenProfileName', 'notes', 'contactedForRenewal', 'contactedAt',
    'service_account_id', 'profile_number', 'isDeleted', 'createdAt', 'updatedAt',
  ]),
  service_accounts: Object.freeze([
    'id', 'service_type', 'provider_id', 'email', 'password',
    'subscription_start', 'subscription_end', 'purchase_cost', 'capacity',
    'status', 'notes', 'created_at', 'updated_at',
  ]),
  WhatsAppTemplate: Object.freeze([
    'language', 'expiring3Days', 'expired', 'thanksClient', 'updatedAt',
  ]),
  AuditLog: Object.freeze([
    'id', 'timestamp', 'userEmail', 'userName', 'action', 'details',
    'ipAddress', 'status', 'createdAt',
  ]),
});

/** Quote a Postgres identifier. Names come from the allow-list, never the client. */
export function quoteIdent(name) {
  return '"' + String(name).replace(/"/g, '""') + '"';
}

export function assertTable(table) {
  if (!Object.prototype.hasOwnProperty.call(TABLES, table)) {
    throw Object.assign(new Error(`Table not allowed: ${table}`), { code: 'VALIDATION' });
  }
  return table;
}

export function assertColumn(table, column) {
  const cols = TABLES[table];
  if (!cols || !cols.includes(column)) {
    throw Object.assign(new Error(`Column not allowed: ${table}.${column}`), { code: 'VALIDATION' });
  }
  return column;
}

/** Filter a row object down to allowed columns (drops unknown keys silently). */
export function sanitizeRow(table, row) {
  const cols = TABLES[table];
  if (!cols) throw Object.assign(new Error(`Table not allowed: ${table}`), { code: 'VALIDATION' });
  const out = {};
  for (const key of Object.keys(row)) {
    if (cols.includes(key)) out[key] = row[key];
  }
  return out;
}

/** Returns every allow-listed column for a table. */
export function columnsFor(table) {
  const cols = TABLES[table];
  if (!cols) throw Object.assign(new Error(`Table not allowed: ${table}`), { code: 'VALIDATION' });
  return cols;
}
