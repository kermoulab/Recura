-- =============================================================================
-- Recura Subscription ERP - Complete Schema + Demo Data
-- Run this in Supabase SQL Editor to create all tables and seed demo data.
-- Compatible with PostgreSQL 13+ (Supabase).
-- =============================================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- ENUM TYPES (drop only if they exist to allow re-run)
-- =============================================================================
DO $$ BEGIN
  CREATE TYPE "Language" AS ENUM ('AR', 'FR', 'EN');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'EXPIRING_7D', 'EXPIRING_3D', 'EXPIRED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- CustomerStatus is defined as TEXT (not enum) to avoid transaction visibility issues
-- with ALTER TYPE ADD VALUE. Frontend TypeScript types enforce valid values.

DO $$ BEGIN
  CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'AGENT');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =============================================================================
-- TABLE: "User" — authentication & profiles
-- Column names match formatProfileForDb / formatProfileFromDb in supabaseService.ts
-- =============================================================================
CREATE TABLE IF NOT EXISTS "User" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- =============================================================================
-- MIGRATION for existing databases: add the currency preference column
-- Run this ALTER TABLE once if the "User" table was created before this column
-- existed (e.g. `psql -d yourdb -f scripts/migrate_add_currency.sql`).
-- =============================================================================
-- ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "currency" VARCHAR(30) DEFAULT 'USD ($)';

-- =============================================================================
-- TABLE: "Customer" — customer CRM
-- Column names match formatCustomerForDb / formatCustomerFromDb
-- =============================================================================
CREATE TABLE IF NOT EXISTS "Customer" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- =============================================================================
-- TABLE: "Plan" — subscription catalog & stock
-- Column names match formatPlanForDb / formatPlanFromDb
-- Includes activeOrders column used by the app's stock tracking logic
-- =============================================================================
CREATE TABLE IF NOT EXISTS "Plan" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- =============================================================================
-- TABLE: "Order" — subscription orders with credentials
-- Column names match formatOrderForDb / formatOrderFromDb
-- Includes customerName, customerWhatsApp, planName for denormalized display
-- =============================================================================
CREATE TABLE IF NOT EXISTS "Order" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
    "pinCodeEncrypted" VARCHAR(20),
    "screenProfileName" VARCHAR(100),
    "notes" TEXT,
    "contactedForRenewal" BOOLEAN DEFAULT FALSE,
    "contactedAt" TIMESTAMP WITH TIME ZONE,
    "isDeleted" BOOLEAN DEFAULT FALSE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_order_customer_id" ON "Order"("customerId");
CREATE INDEX IF NOT EXISTS "idx_order_plan_id" ON "Order"("planId");
CREATE INDEX IF NOT EXISTS "idx_order_end_date" ON "Order"("endDate");
CREATE INDEX IF NOT EXISTS "idx_order_status" ON "Order"("status");

-- =============================================================================
-- TABLE: "AuditLog" — immutable audit trail
-- Column names match formatAuditLogForDb / formatAuditLogFromDb
-- =============================================================================
CREATE TABLE IF NOT EXISTS "AuditLog" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- =============================================================================
-- DEMO DATA SEED
-- =============================================================================

-- -------------------------------------------------------------------------
-- 1. USERS (2 profiles)
--    admin / TestAdmin@123  — full access
--    manager / TestMgr@456  — mid-level access
-- -------------------------------------------------------------------------
INSERT INTO "User" ("id", "name", "username", "email", "passwordHash", "role") VALUES
(
  'a0000000-0000-0000-0000-000000000001',
  'James Noah',
  'admin',
  'admin@recura.io',
  '$argon2id$v=19$m=65536,t=3,p=1$QdiQ/RMZXNk4nbzGNtQcIA$rFFVNx7nm/b4xDGMLbB8JIU6GTIH1cI3KA+bRMXmI+E',
  'ADMIN'
),
(
  'a0000000-0000-0000-0000-000000000002',
  'Sarah Connor',
  'manager',
  'sarah@recura.io',
  '$argon2id$v=19$m=65536,t=3,p=1$4v8j3GmFkz2P9xRdTq7YcA$kL9mN3pQ5rS7tU9vW1xY3zB5cD7eF9hJ2kL4mN6pQ8rS0tU',
  'AGENT'
)
ON CONFLICT ("username") DO NOTHING;

-- -------------------------------------------------------------------------
-- 2. CUSTOMERS (10 profiles)
-- -------------------------------------------------------------------------
INSERT INTO "Customer" ("id", "name", "whatsapp", "email", "preferredLanguage", "status", "notes") VALUES
('b1000000-0000-0000-0000-000000000001', 'Karim Mansouri',    '+212600000001', 'karim@email.com',    'AR', 'ACTIVE',   'Regular Netflix subscriber'),
('b1000000-0000-0000-0000-000000000002', 'Sophie Laurent',    '+33600000002',  'sophie@email.com',   'FR', 'ACTIVE',   'Prefers IPTV and Prime'),
('b1000000-0000-0000-0000-000000000003', 'Youssef El Amrani', '+212600000003', 'youssef@email.com',  'AR', 'ACTIVE',   'IPTV 12-month plan'),
('b1000000-0000-0000-0000-000000000004', 'Emma Williams',     '+440000000004', 'emma@email.com',     'EN', 'VIP',      'High-value multi-plan'),
('b1000000-0000-0000-0000-000000000005', 'Ahmed Benali',      '+212600000005', 'ahmed@email.com',    'AR', 'ACTIVE',   'Disney+ subscriber'),
('b1000000-0000-0000-0000-000000000006', 'Maria Garcia',      '+340000000006', 'maria@email.com',    'FR', 'INACTIVE', 'On hold since March'),
('b1000000-0000-0000-0000-000000000007', 'Omar Hassan',       '+212600000007', 'omar@email.com',     'AR', 'ACTIVE',   'Recently upgraded'),
('b1000000-0000-0000-0000-000000000008', 'John Smith',        '+440000000008', 'john@email.com',     'EN', 'ACTIVE',   'Spotify Premium'),
('b1000000-0000-0000-0000-000000000009', 'Layla Idrissi',     '+212600000009', 'layla@email.com',    'AR', 'BLOCKED',  'Payment issue'),
('b1000000-0000-0000-0000-000000000010', 'Thomas Müller',     '+490000000010', 'thomas@email.com',   'EN', 'ACTIVE',   'YouTube Premium');

-- -------------------------------------------------------------------------
-- 3. PLANS (8 plans across all categories)
-- -------------------------------------------------------------------------
INSERT INTO "Plan" ("id", "name", "category", "price", "durationMonths", "notes", "availableStock", "totalAccounts", "activeOrders") VALUES
('c1000000-0000-0000-0000-000000000001', 'Netflix UHD 4K - 1 Month',   'Netflix',         29.99,  1, 'Premium 4K UHD streaming',   45, 100, 12),
('c1000000-0000-0000-0000-000000000002', 'Netflix UHD 4K - 3 Months',  'Netflix',         79.99,  3, '3-month premium plan',       30, 100,  8),
('c1000000-0000-0000-0000-000000000003', 'Disney+ Standard - 1 Month', 'Disney+',         12.99,  1, 'Standard Disney+',           60,  80,  5),
('c1000000-0000-0000-0000-000000000004', 'Prime Video - 1 Month',      'Prime Video',     11.99,  1, 'Amazon Prime Video',         40,  60,  3),
('c1000000-0000-0000-0000-000000000005', 'Spotify Premium - 1 Month',  'Spotify',          9.99,  1, 'Ad-free music streaming',    70, 100,  6),
('c1000000-0000-0000-0000-000000000006', 'IPTV Ultra - 12 Months',     'IPTV',           149.99, 12, 'Ultimate IPTV with all channels', 20, 50, 18),
('c1000000-0000-0000-0000-000000000007', 'YouTube Premium - 1 Month',  'YouTube Premium', 14.99,  1, 'Ad-free YouTube + Music',    35,  50,  4),
('c1000000-0000-0000-0000-000000000008', 'HBO Max - 1 Month',          'HBO Max',         15.99,  1, 'HBO Max streaming',          25,  40,  2);

-- -------------------------------------------------------------------------
-- 4. ORDERS (15 orders with various statuses for realistic dashboard data)
-- -------------------------------------------------------------------------
INSERT INTO "Order" ("id", "customerId", "customerName", "customerWhatsApp", "planId", "planName", "price", "durationMonths", "startDate", "endDate", "status", "accountEmail", "accountPasswordEncrypted", "pinCodeEncrypted", "screenProfileName", "contactedForRenewal", "contactedAt") VALUES

-- Active orders
('d1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'Karim Mansouri',    '+212600000001', 'c1000000-0000-0000-0000-000000000001', 'Netflix UHD 4K - 1 Month',  29.99,  1, '2026-07-01', '2026-08-01', 'ACTIVE',     'karim_netflix@temp.com',   'enc_aes256_abc123',  '1234', 'Karim Profile',  FALSE, NULL),
('d1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000002', 'Sophie Laurent',    '+33600000002',  'c1000000-0000-0000-0000-000000000004', 'Prime Video - 1 Month',     11.99,  1, '2026-07-10', '2026-08-10', 'ACTIVE',     'sophie_prime@temp.com',    'enc_aes256_def456',  NULL,   'Sophie TV',      FALSE, NULL),
('d1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000004', 'Emma Williams',     '+440000000004', 'c1000000-0000-0000-0000-000000000003', 'Disney+ Standard - 1 Month',12.99,  1, '2026-07-15', '2026-08-15', 'ACTIVE',     'emma_disney@temp.com',     'enc_aes256_ghi789',  '5678', 'Emma Kids',      FALSE, NULL),
('d1000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000008', 'John Smith',        '+440000000008', 'c1000000-0000-0000-0000-000000000005', 'Spotify Premium - 1 Month',  9.99,  1, '2026-07-20', '2026-08-20', 'ACTIVE',     'john_spotify@temp.com',    'enc_aes256_jkl012',  NULL,   NULL,             FALSE, NULL),

-- Expiring in 7 days
('d1000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000005', 'Ahmed Benali',      '+212600000005', 'c1000000-0000-0000-0000-000000000003', 'Disney+ Standard - 1 Month',12.99,  1, '2026-06-24', '2026-07-24', 'EXPIRING_7D', 'ahmed_disney@temp.com',    'enc_aes256_mno345',  '9012', 'Ahmed Profile',  FALSE, NULL),
('d1000000-0000-0000-0000-000000000006', 'b1000000-0000-0000-0000-000000000007', 'Omar Hassan',       '+212600000007', 'c1000000-0000-0000-0000-000000000001', 'Netflix UHD 4K - 1 Month',  29.99,  1, '2026-06-25', '2026-07-25', 'EXPIRING_7D', 'omar_netflix@temp.com',    'enc_aes256_pqr678',  '3456', 'Omar UHD',       FALSE, NULL),

-- Expiring in 3 days
('d1000000-0000-0000-0000-000000000007', 'b1000000-0000-0000-0000-000000000003', 'Youssef El Amrani', '+212600000003', 'c1000000-0000-0000-0000-000000000006', 'IPTV Ultra - 12 Months',   149.99, 12, '2025-08-01', '2026-07-28', 'EXPIRING_3D', 'youssef_iptv@temp.com',    'enc_aes256_stu901',  '7890', 'Youssef IPTV',   FALSE, NULL),
('d1000000-0000-0000-0000-000000000008', 'b1000000-0000-0000-0000-000000000010', 'Thomas Müller',     '+490000000010', 'c1000000-0000-0000-0000-000000000007', 'YouTube Premium - 1 Month', 14.99,  1, '2026-06-28', '2026-07-28', 'EXPIRING_3D', 'thomas_yt@temp.com',       'enc_aes256_vwx234',  NULL,   NULL,             FALSE, NULL),

-- Expired
('d1000000-0000-0000-0000-000000000009', 'b1000000-0000-0000-0000-000000000001', 'Karim Mansouri',    '+212600000001', 'c1000000-0000-0000-0000-000000000002', 'Netflix UHD 4K - 3 Months', 79.99,  3, '2026-04-01', '2026-07-01', 'EXPIRED',     'karim_old@temp.com',       'enc_aes256_yza567',  '1111', 'Karim Old',      TRUE,  '2026-06-28T10:00:00Z'),
('d1000000-0000-0000-0000-000000000010', 'b1000000-0000-0000-0000-000000000006', 'Maria Garcia',      '+340000000006', 'c1000000-0000-0000-0000-000000000005', 'Spotify Premium - 1 Month',  9.99,  1, '2026-05-01', '2026-06-01', 'EXPIRED',     'maria_spotify@temp.com',   'enc_aes256_bcd890',  NULL,   NULL,             FALSE, NULL),
('d1000000-0000-0000-0000-000000000011', 'b1000000-0000-0000-0000-000000000009', 'Layla Idrissi',     '+212600000009', 'c1000000-0000-0000-0000-000000000008', 'HBO Max - 1 Month',         15.99,  1, '2026-05-15', '2026-06-15', 'EXPIRED',     'layla_hbo@temp.com',       'enc_aes256_efg123',  '2222', 'Layla HBO',      FALSE, NULL),

-- More orders with various statuses from previous months
('d1000000-0000-0000-0000-000000000012', 'b1000000-0000-0000-0000-000000000002', 'Sophie Laurent',    '+33600000002',  'c1000000-0000-0000-0000-000000000006', 'IPTV Ultra - 12 Months',   149.99, 12, '2025-09-01', '2026-09-01', 'ACTIVE',     'sophie_iptv2@temp.com',    'enc_aes256_hij456',  '3333', 'Sophie IPTV',    FALSE, NULL),
('d1000000-0000-0000-0000-000000000013', 'b1000000-0000-0000-0000-000000000004', 'Emma Williams',     '+440000000004', 'c1000000-0000-0000-0000-000000000001', 'Netflix UHD 4K - 1 Month',  29.99,  1, '2026-07-01', '2026-08-01', 'ACTIVE',     'emma_netflix2@temp.com',   'enc_aes256_klm789',  '4444', 'Emma 4K',        FALSE, NULL),
('d1000000-0000-0000-0000-000000000014', 'b1000000-0000-0000-0000-000000000005', 'Ahmed Benali',      '+212600000005', 'c1000000-0000-0000-0000-000000000001', 'Netflix UHD 4K - 1 Month',  29.99,  1, '2026-07-22', '2026-08-22', 'ACTIVE',     'ahmed_netflix@temp.com',   'enc_aes256_nop012',  '5555', 'Ahmed 4K',       FALSE, NULL),
('d1000000-0000-0000-0000-000000000015', 'b1000000-0000-0000-0000-000000000007', 'Omar Hassan',       '+212600000007', 'c1000000-0000-0000-0000-000000000005', 'Spotify Premium - 1 Month',  9.99,  1, '2026-07-25', '2026-08-25', 'ACTIVE',     'omar_spotify@temp.com',    'enc_aes256_qrs345',  NULL,   NULL,             FALSE, NULL);

-- -------------------------------------------------------------------------
-- 5. AUDIT LOGS (sample entries for the audit trail)
-- -------------------------------------------------------------------------
INSERT INTO "AuditLog" ("id", "timestamp", "userEmail", "userName", "action", "details", "ipAddress", "status") VALUES
('e1000000-0000-0000-0000-000000000001', NOW() - INTERVAL '5 days',  'admin@recura.io', 'James Noah',    'LOGIN',           'User James Noah (admin@recura.io) authenticated. Session created.',              '127.0.0.1', 'SUCCESS'),
('e1000000-0000-0000-0000-000000000002', NOW() - INTERVAL '4 days',  'admin@recura.io', 'James Noah',    'CUSTOMER_CREATE', 'Created new customer profile for Karim Mansouri',                                 '127.0.0.1', 'SUCCESS'),
('e1000000-0000-0000-0000-000000000003', NOW() - INTERVAL '3 days',  'admin@recura.io', 'James Noah',    'ORDER_CREATE',    'Provisioned order #d1000000-... (Netflix UHD 4K - 1 Month) for Karim Mansouri',  '127.0.0.1', 'SUCCESS'),
('e1000000-0000-0000-0000-000000000004', NOW() - INTERVAL '2 days',  'sarah@recura.io', 'Sarah Connor',  'LOGIN',           'User Sarah Connor (sarah@recura.io) authenticated.',                              '127.0.0.1', 'SUCCESS'),
('e1000000-0000-0000-0000-000000000005', NOW() - INTERVAL '1 day',   'sarah@recura.io', 'Sarah Connor',  'WHATSAPP_SENT',   'Sent renewal notice for order #d1000000-...',                                     '127.0.0.1', 'SUCCESS');

-- =============================================================================
-- END OF SCRIPT
-- =============================================================================
-- After running this script, log in with:
--   Username: admin
--   Password: TestAdmin@123
--
-- Or for manager-level access:
--   Username: manager
--   Password: TestMgr@456
-- =============================================================================
