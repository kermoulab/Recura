# Database Compatibility

The app's persistence layer is provider-agnostic (see
`DATABASE_ABSTRACTION.md`). This document maps the current PostgreSQL/Supabase
schema to alternative hosted database stacks the app can run against, and the
steps each requires.

## Current assumptions (the price of compatibility)

The current implementation has a few non-portable properties. Any target must
either support them or we must relax them:

1. **Denormalized `Order` columns** (`customerName`, `customerWhatsApp`,
   `planName`) with `ON DELETE RESTRICT` FKs — kept for shared-schema
   consumers (mobile app) and enforced in-app via snapshot sync.
2. **Client-generated UUID primary keys** — works on every relational DB;
   MySQL 5.7 and below lack a native UUID type (use `CHAR(36)`).
3. **Case-sensitive quoted identifiers** (`"Customer"`, `"Order"`) — native to
   PostgreSQL; MySQL/PlanetScale are case-insensitive by default and `Order`/
   `User` are reserved words, so quoted names or renames are required.
4. **`ON CONFLICT` upsert** (`WhatsAppTemplate` on `language`) — PostgreSQL
   native. MySQL uses `INSERT … ON DUPLICATE KEY UPDATE`; SQLite uses
   `INSERT … ON CONFLICT (key) DO UPDATE SET …`. This is handled by the
   adapter's `upsert()` only, so a new adapter implements its dialect.
5. **`DECIMAL`/`TIMESTAMPTZ`** — port to `DECIMAL`/`DATETIME` on MySQL,
   `REAL`/`TEXT(ISO-8601)` on SQLite.
6. **No RLS reliance.** The schema disables row-level security and grants
   `anon`/`authenticated`/`service_role` full access. See the "RLS" section.

## Target stack compatibility matrix

| Stack | Adapter work | Schema port | Notes |
| --- | --- | --- | --- |
| **PostgREST (Supabase / any PostgreSQL)** | done (`RestAdapter`) | none | Production today |
| **Neon (PostgreSQL)** | new `PostgresAdapter` (use `pg` + SQL) | none — same SQL | Smallest migration; same schema + SQL scripts |
| **Vercel Postgres / Railway (PostgreSQL)** | new `PostgresAdapter` | none | Same as Neon |
| **PlanetScale / MySQL** | new `MysqlAdapter` | medium: quoting, reserved words, upsert, UUID-as-char, no RLS | `Order`/`User` need quotes or renames; remove `CREATE EXTENSION` |
| **Turso / libSQL (SQLite)** | new `SqliteAdapter` | medium: no enums, no `TIMESTAMPTZ`, upsert syntax, column types | Suitable for single-region/small deployments; enums → `TEXT` + CHECK |
| **Firebase Firestore** | new `FirestoreAdapter` | large: collections not tables, no joins | Denormalization pattern already fits; FK-style integrity must be app-enforced |

### RLS note

The shared database currently runs **with RLS disabled** and permissive grants
because the app uses the Supabase anon key directly for CRUD. This is a
security consideration for production. Options:

- **Keep it simple**: continue with RLS disabled behind network-level
  protection (Supabase project keys are public by design, so this is not
  ideal for hostile clients).
- **Move logic server-side**: keep RLS enabled and add Postgres functions or a
  backend API. The abstraction layer already centralizes every query, so this
  is a contained change (adapter routes reads/writes through `rpc` calls).
- With an alternative provider, prefer a **server-side connection string**
  that is never shipped to the browser.

## SQL script port guidance

`scripts/recura_full_schema.sql` is PostgreSQL-specific. When porting:

- Drop `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";` and use
  `uuid_generate_v4()` → provider native default, or (better) let the app
  supply ids (it already does).
- `CREATE TYPE "X" AS ENUM (...)` → `TEXT` columns with CHECK constraints on
  MySQL/SQLite.
- `TIMESTAMP WITH TIME ZONE` → `DATETIME` (MySQL) / `TEXT` ISO-8601 (SQLite).
- Unique partial index `uq_order_account_profile`:
  - Postgres: `CREATE UNIQUE INDEX … WHERE a IS NOT NULL AND b IS NOT NULL;`
  - MySQL: no partial indexes — use a generated column or accept NULLs being
    distinct (which MySQL already treats as non-equal).
  - SQLite: supported since 3.8.0 via `WHERE`.
- Upsert on `WhatsAppTemplate.language`:
  - Postgres: `INSERT … ON CONFLICT (language) DO UPDATE SET …`
  - MySQL: `INSERT … ON DUPLICATE KEY UPDATE …`
  - SQLite: `INSERT … ON CONFLICT(language) DO UPDATE SET …`
- `ON DELETE RESTRICT` / `ON DELETE SET NULL`: supported on all three.

## Behavior preserved across providers

The abstraction guarantees these behaviors regardless of backend:

- Reads are best-effort: missing config or provider errors surface as `[]` /
  `null` with a console warning — the UI shows an empty state.
- Writes are strict: they throw `DatabaseError` (normalized codes in
  `src/db/types.ts`) and the UI never reports success unless the write
  applied.
- `orderNumber` auto-increment is app-side (`max + 1`); no provider sequence
  is required.
- `Plan.availableStock` / `Plan.activeOrders` and `Customer.ordersCount` /
  `Customer.totalSpent` are app-maintained counters, not DB triggers.

## Recommended target (if leaving Supabase)

**Neon (serverless PostgreSQL)** is the lowest-friction alternative: identical
SQL, no schema port, RLS semantics available if desired, and the only code
change is a new `PostgresAdapter`. Migration steps in
`DATABASE_MIGRATION.md`.
