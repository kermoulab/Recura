# Database Architecture

This document describes the physical database schema that the Recura Web App
reads and writes, the domain entities they map to, and the relationships
between them. It is the single source of truth for the current database shape.

## Source of truth

- **Frontend schema dump**: `src/data/dbExport.ts` (`DATABASE_SQL`)
- **Standalone SQL scripts**: `scripts/recura_full_schema.sql`,
  `scripts/seed_admin.sql`, plus incremental migrations under `scripts/`
- **Domain types**: `src/types/erp.ts`

The database is PostgreSQL 13+ (hosted via Supabase in production). Table
names and column names are **case-sensitive** (quoted identifiers), so the
mappers in `src/db/repositories/*` must match them exactly.

## Entities and tables

| Domain entity (`src/types/erp.ts`) | Table | Repo |
| --- | --- | --- |
| `Customer` | `Customer` | `src/db/repositories/customerRepository.ts` |
| `Plan` | `Plan` | `src/db/repositories/planRepository.ts` |
| `Order` | `Order` | `src/db/repositories/orderRepository.ts` |
| `ServiceAccount` | `service_accounts` | `src/db/repositories/serviceAccountRepository.ts` |
| `AuditLog` | `AuditLog` | `src/db/repositories/auditLogRepository.ts` |
| `UserProfile` | `User` | `src/db/repositories/userProfileRepository.ts` |
| `WhatsAppTemplate` | `WhatsAppTemplate` | `src/db/repositories/whatsAppTemplateRepository.ts` |

> **Mobile-app tables in the shared schema**: the production database also
> contains `push_events`, `push_log`, and `push_tokens`, used exclusively by
> the companion mobile app for push notifications. The web app never reads or
> writes them, and the installer creates them (migration
> `004_mobile_push_tables.sql`) so a fresh install supports the mobile app.

### Naming convention split

Two different conventions coexist and are preserved as-is:

- **CamelCase tables** (`Customer`, `Plan`, `Order`, `AuditLog`, `User`,
  `WhatsAppTemplate`) use **camelCase columns** (e.g. `customerName`,
  `availableStock`, `serviceAccountId`). The repositories read these
  preferentially and fall back to legacy snake_case variants.
- **`service_accounts`** uses **snake_case columns** (`service_type`,
  `subscription_start`, `created_at`, …).

The `Order` table mixes both: its own columns are camelCase
(`customerName`, `serviceAccountId`), but the FK to service accounts is
`service_account_id` and the profile slot is `profile_number`.

## Column reference

### Customer

| Column | Type | Notes |
| --- | --- | --- |
| `id` | UUID PK | client-generated `crypto.randomUUID()` |
| `name` | VARCHAR(255) | |
| `whatsapp` | VARCHAR(50) | unique |
| `email` | VARCHAR(255) | nullable |
| `preferredLanguage` | enum `Language` (`AR`/`FR`/`EN`) | |
| `status` | VARCHAR(20) | `ACTIVE`/`INACTIVE`/`BLOCKED`/`VIP` |
| `notes` | TEXT | nullable |
| `isDeleted` | BOOLEAN | soft-delete flag, always written `false` |
| `createdAt` / `updatedAt` | TIMESTAMPTZ | |

`ordersCount` and `totalSpent` are **computed client-side** and stored nowhere
in this schema — they are reconstructed from the `Order` rows.

### Plan

| Column | Type | Notes |
| --- | --- | --- |
| `id` | UUID PK | client-generated |
| `name` | VARCHAR(255) | |
| `category` | VARCHAR(100) | `Netflix`, `Disney+`, `Prime Video`, … |
| `price` | DECIMAL(10,2) | |
| `durationMonths` | INT | |
| `notes` | TEXT | nullable |
| `availableStock` | INT | decremented on order create |
| `totalAccounts` | INT | |
| `isDeleted` | BOOLEAN | |
| `createdAt` / `updatedAt` | TIMESTAMPTZ | |

`activeOrders` is a **derived counter** maintained by the app (incremented on
order create), not computed by the database.

### Order

| Column | Type | Notes |
| --- | --- | --- |
| `id` | UUID PK | client-generated |
| `orderNumber` | INTEGER | optional, max+1 computed client-side |
| `customerId` | UUID FK → `Customer.id` | `ON DELETE RESTRICT` |
| `customerName` | VARCHAR(255) | **denormalized snapshot** of customer name |
| `customerWhatsApp` | VARCHAR(50) | **denormalized snapshot** of customer WhatsApp |
| `planId` | UUID FK → `Plan.id` | `ON DELETE RESTRICT` |
| `planName` | VARCHAR(255) | **denormalized snapshot** of plan name |
| `price` | DECIMAL(10,2) | historical sale price (not the live plan price) |
| `durationMonths` | INT | historical sale duration |
| `startDate` / `endDate` | TIMESTAMPTZ | |
| `status` | enum `SubscriptionStatus` | `ACTIVE`/`EXPIRING_7D`/`EXPIRING_3D`/`EXPIRED` |
| `accountEmail` | VARCHAR(255) | |
| `accountPasswordEncrypted` | TEXT | argon2/encrypted credentials |
| `pinCodeEncrypted` | VARCHAR(20) | nullable |
| `screenProfileName` | VARCHAR(100) | nullable |
| `notes` | TEXT | nullable |
| `contactedForRenewal` | BOOLEAN | renewal follow-up flag |
| `contactedAt` | TIMESTAMPTZ | nullable |
| `service_account_id` | UUID FK → `service_accounts.id` | nullable |
| `profile_number` | INTEGER | nullable, unique per service account |
| `isDeleted` | BOOLEAN | |
| `createdAt` / `updatedAt` | TIMESTAMPTZ | |

Unique index `uq_order_account_profile` on
`(service_account_id, profile_number)` where both are non-null.

### service_accounts

| Column | Type | Notes |
| --- | --- | --- |
| `id` | UUID PK | client-generated |
| `service_type` | VARCHAR(100) | |
| `provider_id` | VARCHAR(100) | nullable |
| `email` | VARCHAR(255) | the shared login |
| `password` | TEXT | encrypted shared password |
| `subscription_start` / `subscription_end` | TIMESTAMPTZ | |
| `purchase_cost` | DECIMAL(10,2) | |
| `capacity` | INT | number of profile slots |
| `status` | VARCHAR(20) | `Active`/`Expired`/`Suspended` |
| `notes` | TEXT | nullable |
| `created_at` / `updated_at` | TIMESTAMPTZ | |

### AuditLog

| Column | Type | Notes |
| --- | --- | --- |
| `id` | UUID PK | client-generated |
| `userId` | UUID FK → `User.id` | `ON DELETE SET NULL` |
| `timestamp` | TIMESTAMPTZ | |
| `userEmail` / `userName` | VARCHAR | |
| `action` | VARCHAR(100) | e.g. `LOGIN`, `ORDER_CREATE` |
| `details` | TEXT | |
| `ipAddress` | VARCHAR(50) | |
| `status` | VARCHAR(20) | `SUCCESS`/`WARNING`/`FAILED` |
| `createdAt` | TIMESTAMPTZ | |

### User

| Column | Type | Notes |
| --- | --- | --- |
| `id` | UUID PK | client-generated |
| `name` | VARCHAR(255) | maps to `UserProfile.fullName` |
| `username` | VARCHAR(100) | unique |
| `email` | VARCHAR(255) | unique |
| `passwordHash` | TEXT | Argon2id |
| `role` | enum `UserRole` | `ADMIN`/`MANAGER`/`AGENT` |
| `mfaEnabled` | BOOLEAN | |
| `currency` | VARCHAR | nullable, default `USD ($)` |
| `createdAt` / `updatedAt` | TIMESTAMPTZ | |

### WhatsAppTemplate

| Column | Type | Notes |
| --- | --- | --- |
| `language` | enum `Language` | primary key, one row per language |
| `expiring3Days` | TEXT | |
| `expired` | TEXT | |
| `thanksClient` | TEXT | |
| `createdAt` / `updatedAt` | TIMESTAMPTZ | |

## Relationships

```
Customer 1 ── n Order  n ── 1 Plan
                │
                │ service_account_id
                ▼
         service_accounts (1 ── n Order by profile slots)
User 1 ── n AuditLog
WhatsAppTemplate: one row per Language, no FKs
```

### Denormalization (intentional, shared-schema constraint)

`Order.customerName`, `Order.customerWhatsApp`, and `Order.planName` are
**caches** of the current `Customer` / `Plan` values. This was added so that
every consumer of the shared database (including the mobile app) reflects
renames without a join. The app keeps them in sync:

- Editing a customer → `OrderRepository.syncCustomerSnapshot(customerId, name, whatsapp)`
- Renaming a plan → `OrderRepository.syncPlanSnapshot(planId, name)`

These snapshot syncs are **best-effort** in the UI (warn toast on failure); the
order's own sale price/duration/credentials are never overwritten.

### Service-account cascade rules enforced by the app

- **Delete account**: linked orders are unlinked first
  (`serviceAccountId = undefined, profileNumber = undefined`), then the
  account row is deleted.
- **Renew account**: the account's dates are updated and every linked order is
  re-provisioned with the new `startDate`/`endDate` and a recomputed status.
- **Suspend/reactivate**: only the account `status` column changes; order
  statuses are untouched.

## Concurrency notes

- IDs are always generated client-side (`crypto.randomUUID()`), so the app is
  the id authority; the database never assigns primary keys.
- `orderNumber` is computed as `max(existing) + 1` client-side. Two concurrent
  creates can collide; there is no unique constraint on `orderNumber`.
- `Plan.availableStock` and `Plan.activeOrders` are read-modify-write
  client-side and are **not** atomic.
