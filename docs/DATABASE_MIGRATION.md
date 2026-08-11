# Database Migration Guide

This document outlines how to move the Recura Web App from the current
Supabase (PostgreSQL) backend to another provider using the abstraction layer,
and how to evolve the schema safely in the future.

## Why migration is now low-risk

Because of `src/db` (see `DATABASE_ABSTRACTION.md`):

- The UI only depends on repositories (`getDatabase()`).
- The only Supabase-specific code is `src/lib/supabase.ts` +
  `src/db/SupabaseAdapter.ts`.
- A new backend = one new `DatabaseAdapter` implementation + a schema port.
- Zero changes in `App.tsx`, components, or repositories.

## Option A — Supabase → Neon / another PostgreSQL host (recommended)

Same SQL dialect, so this is the smallest possible move.

1. **Export data**
   ```bash
   # Via the Supabase dashboard: Database → Backups → database export, or:
   pg_dump "postgresql://postgres.<ref>@<host>:5432/postgres?sslmode=require" \
     -f recura_dump.sql
   ```
   Or use the app's built-in JSON backup (Settings → Export) for entity-level
   data.

2. **Create the schema on the target** (run `scripts/recura_full_schema.sql`).

3. **Write a `PostgresAdapter`** implementing `DatabaseAdapter` in
   `src/db/`. Use a server-side pooling client (`pg`) — do not ship a DB
   connection string to the browser. If you keep PostgREST (Postgres +
   PostgREST), a `PostgrestAdapter` mirrors `SupabaseAdapter` with different
   credentials.

4. **Switch the factory** in `src/db/index.ts`:
   ```ts
   const adapter = usePostgres ? new PostgresAdapter() : new SupabaseAdapter();
   ```

5. **Update env**: replace `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`
   with the new provider's config, and update the not-configured message in
   `src/db/SupabaseAdapter.ts` (or move it into a shared constant).

## Option B — Supabase → MySQL / PlanetScale

1. Port the schema per `DATABASE_COMPATIBILITY.md` (quoting of `Order`/`User`,
   upsert syntax, UUID as `CHAR(36)`).
2. Export and import data (row by row or via a tool like
   `pg_dump --column-inserts` piped through a transformer, or
   [pgloader](https://pgloader.io)).
3. Write a `MysqlAdapter` implementing the contract.
4. Switch the factory and env as above.

## Option C — Supabase → SQLite (Turso / libSQL)

Best for a small, single-region deployment.

1. Port schema: enums → `TEXT` + CHECK, `TIMESTAMPTZ` → `TEXT` ISO-8601,
   partial unique index for profile slots supported.
2. Write a `SqliteAdapter`.
3. Ship the database file or use Turso's edge replication.

## Data mapping invariants (preserve these during any export/import)

- `Customer.whatsapp` unique; `User.email` and `User.username` unique.
- `Order.customerName` / `Order.customerWhatsApp` / `Order.planName` must
  equal the current `Customer` / `Plan` values (or run the app once — the
  snapshot-sync methods will reconcile on next customer/plan edit; a one-time
  sync can be added to `OrderRepository` if needed).
- `service_accounts` uses snake_case; `Order` keeps camelCase columns plus the
  `service_account_id` / `profile_number` snake_case columns.
- `Order.service_account_id` → `profile_number` must stay unique per account
  (partial unique index).
- `AuditLog` and `WhatsAppTemplate` have no FKs and migrate trivially.

## Verifying a migration

1. `npm run lint` (tsc) and `npm run build` pass with the new adapter.
2. Cold start: log in with the seeded admin, confirm all entities load.
3. CRUD smoke test per entity: create, edit, delete customer/plan/order/
   service account/profile; save WhatsApp templates (exercises upsert).
4. Relationship smoke tests:
   - Rename a customer → open a linked order and confirm the snapshot updated.
   - Rename a plan → linked order `planName` updated.
   - Renew a service account → linked orders' dates/status cascade.
   - Delete a service account → linked orders unlinked, slots freed.
5. Error-path test: stop the database, attempt a write → the UI must show an
   error toast and must NOT report success (no fake success).

## Schema evolution process

- All schema changes start with a numbered script in `scripts/`
  (`migrate_*.sql`) and a matching change in the repositories' mappers if
  columns are renamed.
- `src/data/dbExport.ts` (`DATABASE_SQL`) is the reference dump and must be
  kept in sync with the live schema.
- Column renames keep the old name readable in mappers (fallback pattern) for
  one release, then drop it.
