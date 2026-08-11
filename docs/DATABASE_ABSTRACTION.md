# Database Abstraction Layer

The Recura Web App does **not** talk to a database provider directly. All
persistence goes through a three-layer abstraction:

```
UI (App.tsx, components)
        │  domain objects only (src/types/erp)
        ▼
Repositories  (src/db/repositories/*)
        │  entity ↔ row mapping, friendly errors
        ▼
DatabaseAdapter  (src/db/types.ts — contract)
        │  provider mechanics (raw rows)
        ▼
SupabaseAdapter  (src/db/SupabaseAdapter.ts)  ← the only Supabase-aware file
        │
        ▼
Supabase / PostgreSQL
```

## Layering rules (must be enforced in reviews)

1. **UI never imports a provider SDK.** `@supabase/supabase-js` is imported in
   exactly two files: `src/lib/supabase.ts` (client creation) and
   `src/db/SupabaseAdapter.ts` (adapter). Nothing else may import either.
2. **UI never imports `src/lib/supabase`.** App.tsx uses
   `db.isConnected()` / `db.getStatus()` instead of `isSupabaseConfigured`.
3. **UI communicates with repositories**, obtained once from
   `getDatabase()` in `src/db/index.ts`.
4. **Repositories communicate only with the `DatabaseAdapter` contract**,
   never with Supabase types.
5. **No provider schema in the UI.** Table/column names live in the
   repositories and adapter only.
6. **No fake success.** Reads may be best-effort (return `[]`/`null`), but
   writes must throw. A mutation never reports success unless the database
   actually applied it.

## Entry point

```ts
import { getDatabase } from './db';

const db = getDatabase(); // singleton — safe to call on every render

await db.customers.fetchAll();          // read  → Customer[]
await db.customers.insert(customer);    // write → Customer (throws on failure)
await db.customers.update(customer);    // write → Customer (throws on failure)
await db.customers.delete(id);          // write → void (throws on failure)

db.isConnected();                       // boolean
db.getStatus();                         // { connected, provider, configured }
```

## The DatabaseAdapter contract (`src/db/types.ts`)

```ts
interface DatabaseAdapter {
  readonly provider: string;
  isConnected(): boolean;
  getStatus(): DbStatus;

  list<T>(table, options?): Promise<T[]>;                       // reads
  insert<T>(table, rows): Promise<T[]>;                         // writes
  update<T>(table, id, patch): Promise<T>;                      // writes
  updateWhere(table, match, patch): Promise<void>;              // bulk write
  delete(table, id): Promise<void>;                             // write
  upsert(table, rows, conflictKey): Promise<void>;              // write
}
```

- The contract is **provider-agnostic** and **schema-agnostic**: it works with
  table names and plain rows.
- Reads return `[]` when the database is not configured (the UI treats this as
  "empty state", not an error).
- Writes throw `DatabaseError` when not configured or when the provider fails.

## Error model

Every provider error is normalized into `DatabaseError` with a stable `code`:

| Code | Meaning |
| --- | --- |
| `NOT_CONFIGURED` | No `.env` credentials — write refused |
| `NETWORK` | Provider unreachable |
| `TIMEOUT` | Request timed out |
| `NOT_FOUND` | Update/delete matched no row |
| `CONFLICT` | Unique/FK violation, etc. |
| `PERMISSION_DENIED` | RLS / role denied the operation |
| `VALIDATION` | Provider rejected the payload |
| `UNKNOWN` | Anything else |

Repositories wrap adapter errors with a domain-friendly prefix via
`contextualizeError` (e.g. `Failed to save customer to database: …`), except
`NOT_CONFIGURED`, whose message already tells the user how to fix it.

## Repositories

Each repository is an interface + a `createXRepository(adapter)` factory:

| Repository | Entity | Notable methods |
| --- | --- | --- |
| `customerRepository` | `Customer` | `fetchAll/insert/update/delete` |
| `planRepository` | `Plan` | `fetchAll/insert/update/delete` |
| `orderRepository` | `Order` | `fetchAll/insert/update/delete`, `syncCustomerSnapshot`, `syncPlanSnapshot` |
| `serviceAccountRepository` | `ServiceAccount` | `fetchAll/insert/update/delete` |
| `auditLogRepository` | `AuditLog` | `fetchAll/insert` |
| `userProfileRepository` | `UserProfile` | `fetchAll/insert/update/delete` |
| `whatsAppTemplateRepository` | `WhatsAppTemplate` | `fetchAll`, `save` |

Repositories own the **row mapping** (domain object ↔ DB row), including the
camelCase/snake_case fallbacks and the `toDateOnly` normalizer
(`src/db/mappers.ts`).

## Adding a new database provider

1. Create `src/db/<Provider>Adapter.ts` implementing `DatabaseAdapter` and
   returning `DatabaseError` for all failures. It must not import domain types
   or repositories.
2. Create the physical schema on the target using
   `scripts/recura_full_schema.sql` adapted to the target SQL dialect (see
   `DATABASE_COMPATIBILITY.md`).
3. Point repositories at the new adapter in `src/db/index.ts`
   (e.g. `new PostgresAdapter(/* connection */)` chosen by env flag).
4. Update `DATABASE_ARCHITECTURE.md` and `DATABASE_COMPATIBILITY.md` if
   column conventions differ.

No UI, component, or repository changes are required — that is the whole point
of the layer.

## History / cleanup

The previous `src/services/supabaseService.ts` was removed. Its functions are
superseded by the repositories above:

| Old export | New home |
| --- | --- |
| `fetchCustomersFromSupabase` | `db.customers.fetchAll()` |
| `insertCustomerToSupabase` | `db.customers.insert()` |
| `updateCustomerInSupabase` | `db.customers.update()` |
| `deleteCustomerFromSupabase` | `db.customers.delete()` |
| `fetchPlansFromSupabase` … | `db.plans.*` |
| `fetchOrdersFromSupabase` … | `db.orders.*` |
| `syncOrderCustomerSnapshot` | `db.orders.syncCustomerSnapshot()` |
| `syncOrderPlanSnapshot` | `db.orders.syncPlanSnapshot()` |
| `fetchServiceAccountsFromSupabase` … | `db.serviceAccounts.*` |
| `fetchAuditLogsFromSupabase` / `insertAuditLogToSupabase` | `db.auditLogs.*` |
| `fetchUserProfilesFromSupabase` … | `db.userProfiles.*` |
| `fetchWhatsAppTemplatesFromSupabase` / `saveWhatsAppTemplatesToSupabase` | `db.whatsAppTemplates.*` |
| `isSupabaseConfigured` (lib) | `db.isConnected()` |
