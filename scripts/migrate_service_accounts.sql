-- =============================================================================
-- MIGRATION: Shared Service Accounts (Provider -> Service Account -> Profiles/Orders -> Customers)
-- Run this in Supabase SQL Editor (or psql) against your existing database.
-- Safe to re-run.
--
-- Creates:
--   1) service_accounts table (snake_case fields)
--   2) Order linkage columns: service_account_id + profile_number (unique per account)
--   3) Missing "Order" columns used by the app's insert/update payloads
--   4) WhatsAppTemplate table (one row per language)
--   5) Supporting indexes (unique partial index so legacy orders stay untouched)
--
-- NOTE: Includes "uuid-ossp" (required by uuid_generate_v4()) and disables RLS
-- to match how the existing "Customer"/"Order"/"Plan" tables work with the anon key.
-- =============================================================================

-- Ensure the UUID generator extension exists (CREATE TABLE below uses uuid_generate_v4())
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Ensure the Language enum exists (used by WhatsAppTemplate and Customer.preferredLanguage)
DO $$
BEGIN
  CREATE TYPE "Language" AS ENUM ('AR', 'FR', 'EN');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

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

-- 3) Missing "Order" columns used by the app's insert/update payloads
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "orderNumber" INTEGER;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "customerName" VARCHAR(255);
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "customerWhatsApp" VARCHAR(50);
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "planName" VARCHAR(255);
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "accountEmail" VARCHAR(255);
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "accountPasswordEncrypted" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "pinCodeEncrypted" VARCHAR(20);
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "screenProfileName" VARCHAR(100);
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "contactedForRenewal" BOOLEAN DEFAULT FALSE;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "contactedAt" TIMESTAMP WITH TIME ZONE;

-- 4) WhatsApp templates (one row per language, upserted on language conflict)
CREATE TABLE IF NOT EXISTS "WhatsAppTemplate" (
    "language" "Language" PRIMARY KEY,
    "expiring3Days" TEXT NOT NULL DEFAULT '',
    "expired" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE "WhatsAppTemplate" DISABLE ROW LEVEL SECURITY;
GRANT ALL PRIVILEGES ON TABLE "WhatsAppTemplate" TO anon, authenticated, service_role;

-- =============================================================================
-- ROLLBACK (run in reverse):
--   DROP TABLE IF EXISTS "WhatsAppTemplate";
--   ALTER TABLE "Order" DROP COLUMN IF EXISTS "contactedAt";
--   ALTER TABLE "Order" DROP COLUMN IF EXISTS "contactedForRenewal";
--   ALTER TABLE "Order" DROP COLUMN IF EXISTS "screenProfileName";
--   ALTER TABLE "Order" DROP COLUMN IF EXISTS "pinCodeEncrypted";
--   ALTER TABLE "Order" DROP COLUMN IF EXISTS "accountPasswordEncrypted";
--   ALTER TABLE "Order" DROP COLUMN IF EXISTS "accountEmail";
--   ALTER TABLE "Order" DROP COLUMN IF EXISTS "planName";
--   ALTER TABLE "Order" DROP COLUMN IF EXISTS "customerWhatsApp";
--   ALTER TABLE "Order" DROP COLUMN IF EXISTS "customerName";
--   ALTER TABLE "Order" DROP COLUMN IF EXISTS "orderNumber";
--   DROP INDEX IF EXISTS "uq_order_account_profile";
--   DROP INDEX IF EXISTS "idx_order_service_account_id";
--   ALTER TABLE "Order" DROP COLUMN IF EXISTS "profile_number";
--   ALTER TABLE "Order" DROP COLUMN IF EXISTS "service_account_id";
--   DROP TABLE IF EXISTS service_accounts;
-- =============================================================================
