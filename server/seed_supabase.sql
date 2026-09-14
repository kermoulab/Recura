-- ============================================================================
-- Recura — Supabase Seed Script
-- Paste this entire file into Supabase SQL Editor and run it.
-- Safe to run multiple times (uses ON CONFLICT DO NOTHING / DO NOTHING).
-- ============================================================================

-- 1) Ensure migrations 008 & 009 exist (idempotent)
-- 008: pair_device RPC
CREATE OR REPLACE FUNCTION public.pair_device(
    p_code_hash text,
    p_device_name text,
    p_platform text,
    p_app_version text
) RETURNS json AS $$
DECLARE
    v_installation_id uuid;
    v_token_id uuid;
    v_device_id text;
    v_device_token text;
    v_result json;
BEGIN
    SELECT id INTO v_installation_id FROM public.installation LIMIT 1;
    IF v_installation_id IS NULL THEN
        RAISE EXCEPTION 'installation_not_found' USING ERRCODE = 'P0001';
    END IF;
    SELECT id INTO v_token_id
    FROM public.mobile_pairing_tokens
    WHERE token_hash = p_code_hash
      AND expires_at > now()
      AND used_at IS NULL
      AND installation_id = v_installation_id
    FOR UPDATE;
    IF v_token_id IS NULL THEN
        RAISE EXCEPTION 'invalid_or_expired_token' USING ERRCODE = 'P0002';
    END IF;
    UPDATE public.mobile_pairing_tokens SET used_at = now() WHERE id = v_token_id;
    v_device_id := gen_random_uuid()::text;
    v_device_token := v_device_id;
    INSERT INTO public.mobile_devices (installation_id, device_id, device_name, platform, app_version, status)
    VALUES (v_installation_id, v_device_id, p_device_name, p_platform, p_app_version, 'active');
    v_result := json_build_object('ok', true, 'installation_id', v_installation_id, 'device_id', v_device_id, 'device_token', v_device_token);
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 009: product engine types + tables
DO $$ BEGIN
    CREATE TYPE fulfillment_type AS ENUM ('SHARED_ACCOUNT','DEDICATED_ACCOUNT','PROFILE','SEAT','INVITATION','LICENSE_KEY','ACTIVATION_CODE','CREDENTIALS','MANUAL');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS product_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category_id UUID REFERENCES product_categories(id) ON DELETE SET NULL,
    provider_id VARCHAR(255),
    fulfillment_type fulfillment_type NOT NULL DEFAULT 'MANUAL',
    status VARCHAR(50) DEFAULT 'ACTIVE',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE "Plan" ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id) ON DELETE CASCADE;

CREATE TABLE IF NOT EXISTS digital_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    fulfillment_type fulfillment_type NOT NULL,
    identifier TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'AVAILABLE',
    capacity INTEGER DEFAULT 1,
    occupied_capacity INTEGER DEFAULT 0,
    expires_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id) ON DELETE SET NULL;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS digital_asset_id UUID REFERENCES digital_assets(id) ON DELETE SET NULL;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS fulfillment_type fulfillment_type;


-- ============================================================================
-- 2) Seed data — use fixed UUIDs so re-runs are idempotent
-- ============================================================================

-- ---- Admin user (only if none exists with this username/email) ----
INSERT INTO "User" ("id","name","username","email","passwordHash","role","mfaEnabled","currency","createdAt","updatedAt")
SELECT
  'a0000000-0000-0000-0000-000000000001',
  'Admin User',
  'admin',
  'admin@recura.test',
  '$argon2id$v=19$m=65536,t=3,p=4$bGF0ZWRJblJlY3VSYQ$9K3G8vDfJ5xL0nR2cQbH1kTmSvYfOeX8dCwZuJ6hA2k',
  'ADMIN',
  FALSE,
  'USD ($)',
  '2025-01-01T00:00:00Z',
  '2025-01-01T00:00:00Z'
WHERE NOT EXISTS (
  SELECT 1 FROM "User" WHERE "username" = 'admin' OR "email" = 'admin@recura.test'
);

-- ---- Product Categories ----
INSERT INTO product_categories (id, name, description, status) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'Streaming & Entertainment', 'Netflix, Disney+, Spotify, etc.', 'ACTIVE'),
  ('c0000000-0000-0000-0000-000000000002', 'Software & Tools',            'Microsoft 365, Canva, CapCut',  'ACTIVE'),
  ('c0000000-0000-0000-0000-000000000003', 'AI & Productivity',           'ChatGPT, Gemini, Claude',        'ACTIVE'),
  ('c0000000-0000-0000-0000-000000000004', 'VPN & Security',              'NordVPN, ExpressVPN',            'ACTIVE')
ON CONFLICT (id) DO NOTHING;

-- ---- Products ----
INSERT INTO products (id, name, description, category_id, provider_id, fulfillment_type, status) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'Netflix Premium 4K',   '4K Ultra HD, 4 screens simultaneous', 'c0000000-0000-0000-0000-000000000001', 'netflix',   'SHARED_ACCOUNT', 'ACTIVE'),
  ('b0000000-0000-0000-0000-000000000002', 'Spotify Family',       '6 accounts, ad-free music',           'c0000000-0000-0000-0000-000000000001', 'spotify',   'PROFILE',        'ACTIVE'),
  ('b0000000-0000-0000-0000-000000000003', 'Microsoft 365',       'Office suite, 1TB OneDrive',          'c0000000-0000-0000-0000-000000000002', 'microsoft', 'LICENSE_KEY',    'ACTIVE'),
  ('b0000000-0000-0000-0000-000000000004', 'ChatGPT Plus',         'GPT-4, priority access',              'c0000000-0000-0000-0000-000000000003', 'openai',    'SHARED_ACCOUNT', 'ACTIVE'),
  ('b0000000-0000-0000-0000-000000000005', 'NordVPN',              'Unlimited devices, all regions',      'c0000000-0000-0000-0000-000000000004', 'nordvpn',   'CREDENTIALS',    'ACTIVE')
ON CONFLICT (id) DO NOTHING;

-- ---- Digital Assets ----
INSERT INTO digital_assets (id, product_id, fulfillment_type, identifier, status, capacity, occupied_capacity) VALUES
  ('d0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'SHARED_ACCOUNT', 'netflix-main@gmail.com', 'AVAILABLE', 5, 0),
  ('d0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', 'PROFILE',        'Spotify Family Plan',     'AVAILABLE', 6, 0),
  ('d0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000003', 'LICENSE_KEY',    'O365-KEY-BATCH-001',      'AVAILABLE', 50, 0),
  ('d0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000004', 'SHARED_ACCOUNT', 'chatgpt-team@outlook.com','AVAILABLE', 3, 0),
  ('d0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000005', 'CREDENTIALS',    'nordvpn-reseller@gmail.com','AVAILABLE', 10, 0)
ON CONFLICT (id) DO NOTHING;

-- ---- Customers ----
INSERT INTO "Customer" ("id","name","whatsapp","email","preferredLanguage","status","notes","isDeleted","createdAt","updatedAt") VALUES
  ('e0000000-0000-0000-0000-000000000001', 'Ahmed Benali',   '+212600112233', 'ahmed@example.com',   'FR', 'ACTIVE', 'VIP customer — prefers annual plans', FALSE, '2025-06-15T10:00:00Z', '2025-06-15T10:00:00Z'),
  ('e0000000-0000-0000-0000-000000000002', 'Sara El Fassi',  '+212611223344', 'sara@example.com',    'AR', 'ACTIVE', 'Family plan subscriber',              FALSE, '2025-07-01T14:30:00Z', '2025-07-01T14:30:00Z'),
  ('e0000000-0000-0000-0000-000000000003', 'Omar Tazi',      '+212622334455', 'omar@example.com',    'EN', 'ACTIVE', 'Corporate account',                   FALSE, '2025-07-20T09:00:00Z', '2025-07-20T09:00:00Z'),
  ('e0000000-0000-0000-0000-000000000004', 'Fatima Zahra',   '+212633445566', 'fatima@example.com',  'FR', 'ACTIVE', NULL,                                  FALSE, '2025-08-05T11:00:00Z', '2025-08-05T11:00:00Z'),
  ('e0000000-0000-0000-0000-000000000005', 'Youssef Amrani', '+212644556677', 'youssef@example.com', 'AR', 'ACTIVE', 'Refers friends',                      FALSE, '2025-08-18T16:45:00Z', '2025-08-18T16:45:00Z')
ON CONFLICT ("id") DO NOTHING;

-- ---- Service Accounts ----
INSERT INTO service_accounts ("id","service_type","provider_id","email","password","subscription_start","subscription_end","purchase_cost","capacity","status","notes","created_at","updated_at") VALUES
  ('f0000000-0000-0000-0000-000000000001', 'Netflix',   'NFLX-001', 'netflix-reseller@gmail.com',   'Encrypted:netflix123',  '2025-01-01T00:00:00Z', '2026-01-01T00:00:00Z', 89.99,  5,  'Active',   'Main Netflix reseller account',       '2025-01-01T00:00:00Z', '2025-01-01T00:00:00Z'),
  ('f0000000-0000-0000-0000-000000000002', 'Spotify',   'SPT-001',  'spotify-admin@outlook.com',    'Encrypted:spotify456',  '2025-03-01T00:00:00Z', '2026-03-01T00:00:00Z', 49.99,  6,  'Active',   'Family plan master account',           '2025-03-01T00:00:00Z', '2025-03-01T00:00:00Z'),
  ('f0000000-0000-0000-0000-000000000003', 'Microsoft', 'MS-001',   'office-licenses@gmail.com',    'Encrypted:ms365xyz',    '2025-06-01T00:00:00Z', '2026-06-01T00:00:00Z', 129.99, 50, 'Active',   'Microsoft 365 bulk license pool',      '2025-06-01T00:00:00Z', '2025-06-01T00:00:00Z')
ON CONFLICT ("id") DO NOTHING;

-- ---- Plans (linked to products) ----
INSERT INTO "Plan" ("id","name","category","price","durationMonths","notes","availableStock","totalAccounts","activeOrders","isDeleted","product_id","createdAt","updatedAt") VALUES
  ('a1000000-0000-0000-0000-000000000001', 'Netflix 4K — 1 Month',   'Streaming', 15.00, 1, 'Single month 4K plan',  5, 5, 0, FALSE, 'b0000000-0000-0000-0000-000000000001', '2025-01-01T00:00:00Z', '2025-01-01T00:00:00Z'),
  ('a1000000-0000-0000-0000-000000000002', 'Netflix 4K — 3 Months',  'Streaming', 40.00, 3, 'Quarterly 4K plan',     5, 5, 0, FALSE, 'b0000000-0000-0000-0000-000000000001', '2025-01-01T00:00:00Z', '2025-01-01T00:00:00Z'),
  ('a1000000-0000-0000-0000-000000000003', 'Spotify Family — 1 Month','Music',   10.00, 1, 'Family group plan',     6, 6, 0, FALSE, 'b0000000-0000-0000-0000-000000000002', '2025-01-01T00:00:00Z', '2025-01-01T00:00:00Z'),
  ('a1000000-0000-0000-0000-000000000004', 'Microsoft 365 — 1 Year', 'Software', 89.99, 12,'Annual Office 365',    50, 50, 0, FALSE, 'b0000000-0000-0000-0000-000000000003', '2025-01-01T00:00:00Z', '2025-01-01T00:00:00Z'),
  ('a1000000-0000-0000-0000-000000000005', 'ChatGPT Plus — 1 Month',  'AI',      20.00, 1, 'GPT-4 priority access', 3, 3, 0, FALSE, 'b0000000-0000-0000-0000-000000000004', '2025-01-01T00:00:00Z', '2025-01-01T00:00:00Z'),
  ('a1000000-0000-0000-0000-000000000006', 'NordVPN — 1 Year',        'VPN',     59.99, 12,'Unlimited devices',     10, 10, 0, FALSE, 'b0000000-0000-0000-0000-000000000005', '2025-01-01T00:00:00Z', '2025-01-01T00:00:00Z')
ON CONFLICT ("id") DO NOTHING;

-- ---- Orders ----
-- All orders start within the last 60 days so they appear in dashboard charts
INSERT INTO "Order" ("id","orderNumber","customerId","customerName","customerWhatsApp","planId","planName","price","durationMonths","startDate","endDate","status","accountEmail","accountPasswordEncrypted","pinCodeEncrypted","screenProfileName","notes","contactedForRenewal","service_account_id","profile_number","isDeleted","createdAt","updatedAt") VALUES
  -- Ahmed: Netflix 4K 3 months (active)
  ('aa000000-0000-0000-0000-000000000001', 1001,
   'e0000000-0000-0000-0000-000000000001', 'Ahmed Benali',   '+212600112233',
   'a1000000-0000-0000-0000-000000000002', 'Netflix 4K — 3 Months', 40.00, 3,
   '2025-07-15T10:00:00Z', '2025-10-15T10:00:00Z', 'ACTIVE',
   'netflix-main@gmail.com', 'Encrypted:NfPass1!', '1234', 'Profile 1',
   'First order', FALSE,
   'f0000000-0000-0000-0000-000000000001', 1, FALSE,
   '2025-07-15T10:00:00Z', '2025-07-15T10:00:00Z'),

  -- Sara: Spotify Family (active)
  ('aa000000-0000-0000-0000-000000000002', 1002,
   'e0000000-0000-0000-0000-000000000002', 'Sara El Fassi',  '+212611223344',
   'a1000000-0000-0000-0000-000000000003', 'Spotify Family — 1 Month', 10.00, 1,
   '2025-08-01T14:30:00Z', '2025-09-01T14:30:00Z', 'ACTIVE',
   'spotify-admin@outlook.com', 'Encrypted:SpPass2!', NULL, 'Profile 2',
   NULL, FALSE,
   'f0000000-0000-0000-0000-000000000002', 2, FALSE,
   '2025-08-01T14:30:00Z', '2025-08-01T14:30:00Z'),

  -- Omar: Microsoft 365 1 year (active)
  ('aa000000-0000-0000-0000-000000000003', 1003,
   'e0000000-0000-0000-0000-000000000003', 'Omar Tazi',      '+212622334455',
   'a1000000-0000-0000-0000-000000000004', 'Microsoft 365 — 1 Year', 89.99, 12,
   '2025-07-20T09:00:00Z', '2026-07-20T09:00:00Z', 'ACTIVE',
   'office-licenses@gmail.com', 'Encrypted:MsPass3!', NULL, NULL,
   'Corporate license', FALSE,
   'f0000000-0000-0000-0000-000000000003', NULL, FALSE,
   '2025-07-20T09:00:00Z', '2025-07-20T09:00:00Z'),

  -- Fatima: ChatGPT Plus (expiring in 3 days)
  ('aa000000-0000-0000-0000-000000000004', 1004,
   'e0000000-0000-0000-0000-000000000004', 'Fatima Zahra',   '+212633445566',
   'a1000000-0000-0000-0000-000000000005', 'ChatGPT Plus — 1 Month', 20.00, 1,
   '2025-08-15T11:00:00Z', CURRENT_DATE + INTERVAL '3 days', 'ACTIVE',
   'chatgpt-team@outlook.com', 'Encrypted:GptPass4!', NULL, NULL,
   NULL, FALSE,
   'f0000000-0000-0000-0000-000000000001', NULL, FALSE,
   '2025-08-15T11:00:00Z', '2025-08-15T11:00:00Z'),

  -- Youssef: NordVPN 1 year (expiring in 7 days)
  ('aa000000-0000-0000-0000-000000000005', 1005,
   'e0000000-0000-0000-0000-000000000005', 'Youssef Amrani', '+212644556677',
   'a1000000-0000-0000-0000-000000000006', 'NordVPN — 1 Year', 59.99, 12,
   '2025-01-18T16:45:00Z', CURRENT_DATE + INTERVAL '7 days', 'ACTIVE',
   'nordvpn-reseller@gmail.com', 'Encrypted:NordPass5!', NULL, NULL,
   'Renewal reminder needed', FALSE,
   NULL, NULL, FALSE,
   '2025-01-18T16:45:00Z', '2025-01-18T16:45:00Z'),

  -- Ahmed: Netflix 1 month (expired — old order)
  ('aa000000-0000-0000-0000-000000000006', 1006,
   'e0000000-0000-0000-0000-000000000001', 'Ahmed Benali',   '+212600112233',
   'a1000000-0000-0000-0000-000000000001', 'Netflix 4K — 1 Month', 15.00, 1,
   '2025-05-01T10:00:00Z', '2025-06-01T10:00:00Z', 'ACTIVE',
   'netflix-main@gmail.com', 'Encrypted:NfPass1!', '5678', 'Profile 1',
   'Previous order — expired', TRUE,
   'f0000000-0000-0000-0000-000000000001', NULL, FALSE,
   '2025-05-01T10:00:00Z', '2025-05-01T10:00:00Z')
ON CONFLICT ("id") DO NOTHING;

-- ---- WhatsApp Templates ----
INSERT INTO "WhatsAppTemplate" ("language","expiring3Days","expired","thanksClient") VALUES
  ('AR',
   'مرحباً {{name}}، نود تذكيركم بأن اشتراككم {{plan}} سينتهي بتاريخ {{date}}.',
   'مرحباً {{name}}، لقد انتهت صلاحية اشتراككم {{plan}} بتاريخ {{date}}.',
   '🎉 مرحباً بك! تم تفعيل اشتراكك بنجاح.'),
  ('FR',
   'Bonjour {{name}}, votre abonnement {{plan}} expirera le {{date}}.',
   'Bonjour {{name}}, votre abonnement {{plan}} a expiré le {{date}}.',
   '🎉 Bienvenue! Votre abonnement a été activé avec succès.'),
  ('EN',
   'Hello {{name}}, your {{plan}} subscription will expire on {{date}}.',
   'Hello {{name}}, your {{plan}} subscription expired on {{date}}.',
   '🎉 Welcome! Your subscription has been activated successfully.')
ON CONFLICT ("language") DO NOTHING;

-- ---- Audit Logs (recent activity) ----
INSERT INTO "AuditLog" ("id","timestamp","userEmail","userName","action","details","ipAddress","status","createdAt") VALUES
  ('ab000000-0000-0000-0000-000000000001', '2025-09-10T08:00:00Z', 'admin@recura.test', 'Admin User', 'CREATE', 'Created order #1001 for Ahmed Benali — Netflix 4K 3 Months', '192.168.1.10', 'SUCCESS', '2025-09-10T08:00:00Z'),
  ('ab000000-0000-0000-0000-000000000002', '2025-09-10T08:15:00Z', 'admin@recura.test', 'Admin User', 'CREATE', 'Created order #1002 for Sara El Fassi — Spotify Family 1 Month', '192.168.1.10', 'SUCCESS', '2025-09-10T08:15:00Z'),
  ('ab000000-0000-0000-0000-000000000003', '2025-09-11T09:00:00Z', 'admin@recura.test', 'Admin User', 'CREATE', 'Created order #1003 for Omar Tazi — Microsoft 365 1 Year', '192.168.1.10', 'SUCCESS', '2025-09-11T09:00:00Z'),
  ('ab000000-0000-0000-0000-000000000004', '2025-09-12T14:00:00Z', 'admin@recura.test', 'Admin User', 'LOGIN', 'Admin logged in', '192.168.1.10', 'SUCCESS', '2025-09-12T14:00:00Z'),
  ('ab000000-0000-0000-0000-000000000005', '2025-09-13T10:00:00Z', 'admin@recura.test', 'Admin User', 'UPDATE', 'Updated service account Netflix subscription end date', '192.168.1.10', 'SUCCESS', '2025-09-13T10:00:00Z')
ON CONFLICT ("id") DO NOTHING;

-- Force PostgREST to reload its schema cache
NOTIFY pgrst, 'reload schema';
