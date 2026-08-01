-- =============================================================================
-- MIGRATION: Shared Service Accounts (Provider -> Service Account -> Profiles/Orders -> Customers)
-- Run this in Supabase SQL Editor (or psql) against your existing database.
-- Safe to re-run.
--
-- Creates:
--   1) service_accounts table (snake_case fields)
--   2) Order linkage columns: service_account_id + profile_number (unique per account)
--   3) Supporting indexes (unique partial index so legacy orders stay untouched)
--
-- NOTE: Includes "uuid-ossp" (required by uuid_generate_v4()) and disables RLS
-- to match how the existing "Customer"/"Order"/"Plan" tables work with the anon key.
-- =============================================================================

-- Ensure the UUID generator extension exists (CREATE TABLE below uses uuid_generate_v4())
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1) Service accounts table
CREATE TABLE IF NOT EXISTS service_accounts (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "service_type" VARCHAR(100) NOT NULL DEFAULT 'Other',
    "provider_id" VARCHAR(100),
    "email" VARCHAR(255) NOT NULL,
    "password" TEXT,
    "subscription_start" TIMESTAMP WITH TIME ZONE,
    "subscription_end" TIMESTAMP WITH TIME ZONE,
    "purchase_cost" DECIMAL(10,2) DEFAULT 0,
    "capacity" INTEGER NOT NULL DEFAULT 1,
    "status" VARCHAR(20) DEFAULT 'Active',
    "notes" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Match the existing tables' access model (RLS disabled, anon/authenticated/service_role all allowed)
ALTER TABLE service_accounts DISABLE ROW LEVEL SECURITY;
GRANT ALL PRIVILEGES ON TABLE service_accounts TO anon, authenticated, service_role;

CREATE INDEX IF NOT EXISTS "idx_service_accounts_status" ON service_accounts ("status");
CREATE INDEX IF NOT EXISTS "idx_service_accounts_end" ON service_accounts ("subscription_end");

-- 2) Order linkage columns
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "service_account_id" UUID REFERENCES service_accounts("id");
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "profile_number" INTEGER;

CREATE INDEX IF NOT EXISTS "idx_order_service_account_id" ON "Order"("service_account_id");

-- Profile numbers are unique per service account (legacy rows keep NULLs untouched)
CREATE UNIQUE INDEX IF NOT EXISTS "uq_order_account_profile"
    ON "Order"("service_account_id", "profile_number")
    WHERE "service_account_id" IS NOT NULL AND "profile_number" IS NOT NULL;

-- =============================================================================
-- ROLLBACK (run in reverse):
--   DROP INDEX IF EXISTS "uq_order_account_profile";
--   DROP INDEX IF EXISTS "idx_order_service_account_id";
--   ALTER TABLE "Order" DROP COLUMN IF EXISTS "profile_number";
--   ALTER TABLE "Order" DROP COLUMN IF EXISTS "service_account_id";
--   DROP TABLE IF EXISTS service_accounts;
-- =============================================================================
