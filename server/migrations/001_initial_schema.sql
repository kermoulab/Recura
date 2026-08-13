-- =============================================================================
-- Recura — Migration 001: initial schema
-- Source of truth: scripts/recura_full_schema.sql + scripts/migrate_service_accounts.sql
-- (demo data intentionally excluded — the installer never seeds business records).
--
-- Requirements: PostgreSQL 13+ (gen_random_uuid() is core since PG 13, so no
-- extension/privilege is required). Every statement is idempotent so a retry
-- after a partial failure is safe.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- ENUM TYPES
-- -----------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE "Language" AS ENUM ('AR', 'FR', 'EN');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'EXPIRING_7D', 'EXPIRING_3D', 'EXPIRED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'AGENT');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- -----------------------------------------------------------------------------
-- "User" — authentication & profiles
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "User" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "username" VARCHAR(100) UNIQUE,
    "email" VARCHAR(255) UNIQUE NOT NULL,
    "passwordHash" TEXT,
    "role" "UserRole" DEFAULT 'AGENT',
    "mfaEnabled" BOOLEAN DEFAULT FALSE,
    "currency" VARCHAR(30) DEFAULT 'USD ($)',
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- "Customer" — customer CRM
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "Customer" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "whatsapp" VARCHAR(50) NOT NULL,
    "email" VARCHAR(255),
    "preferredLanguage" "Language" DEFAULT 'EN',
    "status" VARCHAR(20) DEFAULT 'ACTIVE',
    "notes" TEXT,
    "isDeleted" BOOLEAN DEFAULT FALSE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_customer_whatsapp" ON "Customer"("whatsapp");
CREATE INDEX IF NOT EXISTS "idx_customer_status" ON "Customer"("status");

-- -----------------------------------------------------------------------------
-- "Plan" — subscription catalog & stock
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "Plan" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "category" VARCHAR(100) NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "durationMonths" INT NOT NULL,
    "notes" TEXT,
    "availableStock" INT DEFAULT 0,
    "totalAccounts" INT DEFAULT 0,
    "activeOrders" INT DEFAULT 0,
    "isDeleted" BOOLEAN DEFAULT FALSE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- service_accounts — shared provider accounts (snake_case, as in the existing schema)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS service_accounts (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

CREATE INDEX IF NOT EXISTS "idx_service_accounts_status" ON service_accounts ("status");
CREATE INDEX IF NOT EXISTS "idx_service_accounts_end" ON service_accounts ("subscription_end");

-- -----------------------------------------------------------------------------
-- "Order" — subscription orders with credentials
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "Order" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "orderNumber" INTEGER,
    "customerId" UUID NOT NULL REFERENCES "Customer"("id") ON DELETE RESTRICT,
    "customerName" VARCHAR(255) NOT NULL,
    "customerWhatsApp" VARCHAR(50) NOT NULL,
    "planId" UUID NOT NULL REFERENCES "Plan"("id") ON DELETE RESTRICT,
    "planName" VARCHAR(255) NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "durationMonths" INT NOT NULL,
    "startDate" TIMESTAMP WITH TIME ZONE NOT NULL,
    "endDate" TIMESTAMP WITH TIME ZONE NOT NULL,
    "status" "SubscriptionStatus" DEFAULT 'ACTIVE',
    "accountEmail" VARCHAR(255) NOT NULL,
    "accountPasswordEncrypted" TEXT NOT NULL,
    "pinCodeEncrypted" TEXT,
    "screenProfileName" VARCHAR(100),
    "notes" TEXT,
    "contactedForRenewal" BOOLEAN DEFAULT FALSE,
    "contactedAt" TIMESTAMP WITH TIME ZONE,
    "service_account_id" UUID REFERENCES service_accounts("id"),
    "profile_number" INTEGER,
    "isDeleted" BOOLEAN DEFAULT FALSE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_order_customer_id" ON "Order"("customerId");
CREATE INDEX IF NOT EXISTS "idx_order_plan_id" ON "Order"("planId");
CREATE INDEX IF NOT EXISTS "idx_order_end_date" ON "Order"("endDate");
CREATE INDEX IF NOT EXISTS "idx_order_status" ON "Order"("status");
CREATE INDEX IF NOT EXISTS "idx_order_service_account_id" ON "Order"("service_account_id");

-- Profile numbers are unique per service account (legacy rows keep NULLs untouched)
CREATE UNIQUE INDEX IF NOT EXISTS "uq_order_account_profile"
    ON "Order"("service_account_id", "profile_number")
    WHERE "service_account_id" IS NOT NULL AND "profile_number" IS NOT NULL;

-- -----------------------------------------------------------------------------
-- "WhatsAppTemplate" — global notification templates (one row per language)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "WhatsAppTemplate" (
    "language" VARCHAR(2) PRIMARY KEY,
    "expiring3Days" TEXT NOT NULL DEFAULT '',
    "expired" TEXT NOT NULL DEFAULT '',
    "thanksClient" TEXT NOT NULL DEFAULT '',
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- "AuditLog" — immutable audit trail
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "AuditLog" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "timestamp" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "userEmail" VARCHAR(255) NOT NULL,
    "userName" VARCHAR(255) NOT NULL,
    "action" VARCHAR(100) NOT NULL,
    "details" TEXT NOT NULL,
    "ipAddress" VARCHAR(50) NOT NULL,
    "status" VARCHAR(20) DEFAULT 'SUCCESS',
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_auditlog_created_at" ON "AuditLog"("createdAt");
