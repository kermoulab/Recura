import{c as H,b as o,j as e,f as U,T as g,C as Ne,B as Fe,D as Nt,E as xt,z as At,F as Me,u as bt,w as It,i as ne,S as Ce,a as he,l as ye,h as Pe,k as ke,K as tt,L as ft,A as _t}from"./index-Dp8xJtfK.js";/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const gt=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3",key:"1u773s"}],["path",{d:"M12 17h.01",key:"p32p05"}]],st=H("circle-question-mark",gt);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Lt=[["rect",{width:"8",height:"4",x:"8",y:"2",rx:"1",ry:"1",key:"tgr4d6"}],["path",{d:"M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2",key:"116196"}],["path",{d:"m9 14 2 2 4-4",key:"df797q"}]],He=H("clipboard-check",Lt);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Rt=[["path",{d:"M11 14h10",key:"1w8e9d"}],["path",{d:"M16 4h2a2 2 0 0 1 2 2v1.344",key:"1e62lh"}],["path",{d:"m17 18 4-4-4-4",key:"z2g111"}],["path",{d:"M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 1.793-1.113",key:"bjbb7m"}],["rect",{x:"8",y:"2",width:"8",height:"4",rx:"1",key:"ublpy"}]],Xe=H("clipboard-paste",Rt);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const St=[["path",{d:"M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z",key:"p7xjir"}]],We=H("cloud",St);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const vt=[["ellipse",{cx:"12",cy:"5",rx:"9",ry:"3",key:"msslwz"}],["path",{d:"M3 5V19A9 3 0 0 0 21 19V5",key:"1wlel7"}],["path",{d:"M3 12A9 3 0 0 0 21 12",key:"mv7ke4"}]],Ge=H("database",vt);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ct=[["path",{d:"M9 17H7A5 5 0 0 1 7 7h2",key:"8i5ue5"}],["path",{d:"M15 7h2a5 5 0 1 1 0 10h-2",key:"1b9ql8"}],["line",{x1:"8",x2:"16",y1:"12",y2:"12",key:"1jonct"}]],Ve=H("link-2",Ct);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ot=[["path",{d:"M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z",key:"1s2grr"}],["path",{d:"M20 2v4",key:"1rf3ol"}],["path",{d:"M22 4h-4",key:"gwowj6"}],["circle",{cx:"4",cy:"20",r:"2",key:"6kqj1y"}]],Ut=H("sparkles",Ot),yt=`-- =============================================================================\r
-- Recura — Migration 001: initial schema\r
-- Source of truth: scripts/recura_full_schema.sql + scripts/migrate_service_accounts.sql\r
-- (demo data intentionally excluded — the installer never seeds business records).\r
--\r
-- Requirements: PostgreSQL 13+ (gen_random_uuid() is core since PG 13, so no\r
-- extension/privilege is required). Every statement is idempotent so a retry\r
-- after a partial failure is safe.\r
-- =============================================================================\r
\r
-- -----------------------------------------------------------------------------\r
-- ENUM TYPES\r
-- -----------------------------------------------------------------------------\r
DO $$ BEGIN\r
  CREATE TYPE "Language" AS ENUM ('AR', 'FR', 'EN');\r
EXCEPTION WHEN duplicate_object THEN NULL;\r
END $$;\r
\r
DO $$ BEGIN\r
  CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'EXPIRING_7D', 'EXPIRING_3D', 'EXPIRED');\r
EXCEPTION WHEN duplicate_object THEN NULL;\r
END $$;\r
\r
DO $$ BEGIN\r
  CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'AGENT');\r
EXCEPTION WHEN duplicate_object THEN NULL;\r
END $$;\r
\r
-- -----------------------------------------------------------------------------\r
-- "User" — authentication & profiles\r
-- -----------------------------------------------------------------------------\r
CREATE TABLE IF NOT EXISTS "User" (\r
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),\r
    "name" VARCHAR(255) NOT NULL,\r
    "username" VARCHAR(100) UNIQUE,\r
    "email" VARCHAR(255) UNIQUE NOT NULL,\r
    "passwordHash" TEXT,\r
    "role" "UserRole" DEFAULT 'AGENT',\r
    "mfaEnabled" BOOLEAN DEFAULT FALSE,\r
    "currency" VARCHAR(30) DEFAULT 'USD ($)',\r
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,\r
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP\r
);\r
\r
-- -----------------------------------------------------------------------------\r
-- "Customer" — customer CRM\r
-- -----------------------------------------------------------------------------\r
CREATE TABLE IF NOT EXISTS "Customer" (\r
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),\r
    "name" VARCHAR(255) NOT NULL,\r
    "whatsapp" VARCHAR(50) NOT NULL,\r
    "email" VARCHAR(255),\r
    "preferredLanguage" "Language" DEFAULT 'EN',\r
    "status" VARCHAR(20) DEFAULT 'ACTIVE',\r
    "notes" TEXT,\r
    "isDeleted" BOOLEAN DEFAULT FALSE,\r
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,\r
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP\r
);\r
\r
CREATE INDEX IF NOT EXISTS "idx_customer_whatsapp" ON "Customer"("whatsapp");\r
CREATE INDEX IF NOT EXISTS "idx_customer_status" ON "Customer"("status");\r
\r
-- -----------------------------------------------------------------------------\r
-- "Plan" — subscription catalog & stock\r
-- -----------------------------------------------------------------------------\r
CREATE TABLE IF NOT EXISTS "Plan" (\r
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),\r
    "name" VARCHAR(255) NOT NULL,\r
    "category" VARCHAR(100) NOT NULL,\r
    "price" DECIMAL(10,2) NOT NULL,\r
    "durationMonths" INT NOT NULL,\r
    "notes" TEXT,\r
    "availableStock" INT DEFAULT 0,\r
    "totalAccounts" INT DEFAULT 0,\r
    "activeOrders" INT DEFAULT 0,\r
    "isDeleted" BOOLEAN DEFAULT FALSE,\r
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,\r
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP\r
);\r
\r
-- -----------------------------------------------------------------------------\r
-- service_accounts — shared provider accounts (snake_case, as in the existing schema)\r
-- -----------------------------------------------------------------------------\r
CREATE TABLE IF NOT EXISTS service_accounts (\r
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),\r
    "service_type" VARCHAR(100) NOT NULL DEFAULT 'Other',\r
    "provider_id" VARCHAR(100),\r
    "email" VARCHAR(255) NOT NULL,\r
    "password" TEXT,\r
    "subscription_start" TIMESTAMP WITH TIME ZONE,\r
    "subscription_end" TIMESTAMP WITH TIME ZONE,\r
    "purchase_cost" DECIMAL(10,2) DEFAULT 0,\r
    "capacity" INTEGER NOT NULL DEFAULT 1,\r
    "status" VARCHAR(20) DEFAULT 'Active',\r
    "notes" TEXT,\r
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,\r
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP\r
);\r
\r
CREATE INDEX IF NOT EXISTS "idx_service_accounts_status" ON service_accounts ("status");\r
CREATE INDEX IF NOT EXISTS "idx_service_accounts_end" ON service_accounts ("subscription_end");\r
\r
-- -----------------------------------------------------------------------------\r
-- "Order" — subscription orders with credentials\r
-- -----------------------------------------------------------------------------\r
CREATE TABLE IF NOT EXISTS "Order" (\r
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),\r
    "orderNumber" INTEGER,\r
    "customerId" UUID NOT NULL REFERENCES "Customer"("id") ON DELETE RESTRICT,\r
    "customerName" VARCHAR(255) NOT NULL,\r
    "customerWhatsApp" VARCHAR(50) NOT NULL,\r
    "planId" UUID NOT NULL REFERENCES "Plan"("id") ON DELETE RESTRICT,\r
    "planName" VARCHAR(255) NOT NULL,\r
    "price" DECIMAL(10,2) NOT NULL,\r
    "durationMonths" INT NOT NULL,\r
    "startDate" TIMESTAMP WITH TIME ZONE NOT NULL,\r
    "endDate" TIMESTAMP WITH TIME ZONE NOT NULL,\r
    "status" "SubscriptionStatus" DEFAULT 'ACTIVE',\r
    "accountEmail" VARCHAR(255) NOT NULL,\r
    "accountPasswordEncrypted" TEXT NOT NULL,\r
    "pinCodeEncrypted" TEXT,\r
    "screenProfileName" VARCHAR(100),\r
    "notes" TEXT,\r
    "contactedForRenewal" BOOLEAN DEFAULT FALSE,\r
    "contactedAt" TIMESTAMP WITH TIME ZONE,\r
    "service_account_id" UUID REFERENCES service_accounts("id"),\r
    "profile_number" INTEGER,\r
    "isDeleted" BOOLEAN DEFAULT FALSE,\r
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,\r
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP\r
);\r
\r
CREATE INDEX IF NOT EXISTS "idx_order_customer_id" ON "Order"("customerId");\r
CREATE INDEX IF NOT EXISTS "idx_order_plan_id" ON "Order"("planId");\r
CREATE INDEX IF NOT EXISTS "idx_order_end_date" ON "Order"("endDate");\r
CREATE INDEX IF NOT EXISTS "idx_order_status" ON "Order"("status");\r
CREATE INDEX IF NOT EXISTS "idx_order_service_account_id" ON "Order"("service_account_id");\r
\r
-- Profile numbers are unique per service account (legacy rows keep NULLs untouched)\r
CREATE UNIQUE INDEX IF NOT EXISTS "uq_order_account_profile"\r
    ON "Order"("service_account_id", "profile_number")\r
    WHERE "service_account_id" IS NOT NULL AND "profile_number" IS NOT NULL;\r
\r
-- -----------------------------------------------------------------------------\r
-- "WhatsAppTemplate" — global notification templates (one row per language)\r
-- -----------------------------------------------------------------------------\r
CREATE TABLE IF NOT EXISTS "WhatsAppTemplate" (\r
    "language" VARCHAR(2) PRIMARY KEY,\r
    "expiring3Days" TEXT NOT NULL DEFAULT '',\r
    "expired" TEXT NOT NULL DEFAULT '',\r
    "thanksClient" TEXT NOT NULL DEFAULT '',\r
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP\r
);\r
\r
-- -----------------------------------------------------------------------------\r
-- "AuditLog" — immutable audit trail\r
-- -----------------------------------------------------------------------------\r
CREATE TABLE IF NOT EXISTS "AuditLog" (\r
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),\r
    "timestamp" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,\r
    "userEmail" VARCHAR(255) NOT NULL,\r
    "userName" VARCHAR(255) NOT NULL,\r
    "action" VARCHAR(100) NOT NULL,\r
    "details" TEXT NOT NULL,\r
    "ipAddress" VARCHAR(50) NOT NULL,\r
    "status" VARCHAR(20) DEFAULT 'SUCCESS',\r
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP\r
);\r
\r
CREATE INDEX IF NOT EXISTS "idx_auditlog_created_at" ON "AuditLog"("createdAt");\r
`,jt=`-- =============================================================================\r
-- Recura — Migration 002: default WhatsApp templates (required config seed)\r
-- Derived from scripts/migrate_order_number_and_templates.sql and\r
-- scripts/migrate_add_thanks_client.sql. NOT demo/business data — these are the\r
-- default notification templates the app depends on. Idempotent.\r
-- =============================================================================\r
\r
INSERT INTO "WhatsAppTemplate" ("language", "expiring3Days", "expired", "thanksClient") VALUES\r
('AR',\r
 'مرحباً {{name}}، نود تذكيركم بأن اشتراككم {{plan}} سينتهي بتاريخ {{date}}. يمكنكم تجديد الاشتراك أو الترقية في أي وقت. شكراً لثقتكم بنا.',\r
 'مرحباً {{name}}، لقد انتهت صلاحية اشتراككم {{plan}} بتاريخ {{date}}. يرجى التواصل معنا لتجديد الخدمة في أقرب وقت.',\r
 E'🎉 مرحباً بك في {STORE_NAME}!\\n\\nعزيزي {NAME}،\\n\\nتم تفعيل اشتراكك بنجاح.\\n\\n━━━━━━━━━━━━━━━━━━\\n📧 البريد الإلكتروني: {EMAIL}\\n🔑 كلمة المرور: {PASSWORD}\\n👤 الملف الشخصي: الملف {PROFILE_NUMBER}\\n🔐 رمز PIN: {PIN_CODE}\\n━━━━━━━━━━━━━━━━━━\\n📝 ملاحظات: {NOTES}\\n\\n⚠️ إرشادات مهمة\\n\\n• يرجى استخدام الملف الشخصي المخصص لك فقط.\\n• لا تقم بتغيير البريد الإلكتروني أو كلمة المرور.\\n• لا تقم بتغيير اسم الملف الشخصي أو صورته.\\n• لا تقم بتغيير رمز PIN.\\n• لا تقم بإنشاء ملفات شخصية إضافية.\\n• حافظ على سرية معلومات تسجيل الدخول الخاصة بك.'),\r
('FR',\r
 'Bonjour {{name}}, votre abonnement {{plan}} expirera le {{date}}. Vous pouvez le renouveler ou passer à une offre supérieure à tout moment. Merci pour votre confiance.',\r
 'Bonjour {{name}}, votre abonnement {{plan}} a expiré le {{date}}. Merci de nous contacter afin de renouveler votre service.',\r
 E'🎉 Bienvenue chez {STORE_NAME} !\\n\\nCher/Chère {NAME},\\n\\nVotre abonnement a été activé avec succès.\\n\\n━━━━━━━━━━━━━━━━━━\\n📧 Email : {EMAIL}\\n🔑 Mot de passe : {PASSWORD}\\n👤 Profil : Profil {PROFILE_NUMBER}\\n🔐 PIN : {PIN_CODE}\\n━━━━━━━━━━━━━━━━━━\\n📝 Notes : {NOTES}\\n\\n⚠️ Consignes importantes\\n\\n• Utilisez UNIQUEMENT le profil qui vous a été attribué.\\n• Ne modifiez PAS l''adresse e-mail ni le mot de passe.\\n• Ne modifiez PAS le nom ou l''avatar du profil.\\n• Ne modifiez PAS le code PIN.\\n• Ne créez PAS de profils supplémentaires.\\n• Gardez vos informations de connexion privées.'),\r
('EN',\r
 'Hello {{name}}, your {{plan}} subscription will expire on {{date}}. You may renew or upgrade your subscription at any time. Thank you for your trust.',\r
 'Hello {{name}}, your {{plan}} subscription expired on {{date}}. Please contact us to renew your service.',\r
 E'🎉 Welcome to {STORE_NAME}!\\n\\nHello {NAME},\\n\\nYour subscription has been successfully activated.\\n\\n━━━━━━━━━━━━━━━━━━\\n📧 Email: {EMAIL}\\n🔑 Password: {PASSWORD}\\n👤 Profile: Profile {PROFILE_NUMBER}\\n🔐 PIN: {PIN_CODE}\\n━━━━━━━━━━━━━━━━━━\\n📝 Notes: {NOTES}\\n\\n⚠️ Important Guidelines\\n\\n• Please use ONLY your assigned profile.\\n• Do NOT change the email or password.\\n• Do NOT change the profile name or avatar.\\n• Do NOT modify the PIN.\\n• Do NOT create additional profiles.\\n• Keep your login information private.')\r
ON CONFLICT ("language") DO NOTHING;\r
`,wt=`-- =============================================================================\r
-- Recura — Migration 003: data guards for partially-existing databases\r
-- Used when the installer detects an existing database that is only partially\r
-- structured (some tables present). Numbering legacy orders is safe and never\r
-- touches customer-provided data other than filling the orderNumber column.\r
-- =============================================================================\r
\r
-- Backfill sequential order numbers for any order missing one (creation order).\r
UPDATE "Order" SET "orderNumber" = seq.rn FROM (\r
  SELECT "id", ROW_NUMBER() OVER (ORDER BY "createdAt" ASC, "id" ASC) AS rn\r
  FROM "Order"\r
) seq\r
WHERE "Order"."id" = seq."id" AND "Order"."orderNumber" IS NULL;\r
`,Dt=`-- =============================================================================\r
-- Recura — Migration 004: mobile-app push notification tables\r
-- The companion mobile app registers device push tokens and logs push deliveries\r
-- in these tables. The web app does not read or write them, but they must exist\r
-- so a fresh install supports the mobile app too.\r
--\r
-- Schema mirrors the production database (push_events / push_log / push_tokens).\r
-- Idempotent, safe to re-run. RLS is intentionally left disabled (like the rest\r
-- of this schema) so the anon key has access; no GRANT/role statements are used\r
-- because the server installer can run against a plain PostgreSQL where the\r
-- anon/authenticated/service_role roles do not exist.\r
-- =============================================================================\r
\r
-- -----------------------------------------------------------------------------\r
-- push_events — queue of push-notification events for the mobile app\r
-- -----------------------------------------------------------------------------\r
CREATE TABLE IF NOT EXISTS push_events (\r
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),\r
    "event_type" TEXT NOT NULL,\r
    "entity_type" TEXT NOT NULL,\r
    "entity_id" TEXT NOT NULL,\r
    "payload" JSONB,\r
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL\r
);\r
\r
CREATE INDEX IF NOT EXISTS idx_push_events_entity\r
    ON push_events ("entity_type", "entity_id", "created_at");\r
\r
-- -----------------------------------------------------------------------------\r
-- push_log — dedup log of push notifications sent\r
-- -----------------------------------------------------------------------------\r
CREATE TABLE IF NOT EXISTS push_log (\r
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),\r
    "entity_type" TEXT NOT NULL,\r
    "entity_id" TEXT NOT NULL,\r
    "milestone" TEXT NOT NULL,\r
    "sent_at" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,\r
    CONSTRAINT push_log_unique UNIQUE ("entity_type", "entity_id", "milestone")\r
);\r
\r
-- -----------------------------------------------------------------------------\r
-- push_tokens — device tokens registered by the mobile app per user\r
-- -----------------------------------------------------------------------------\r
CREATE TABLE IF NOT EXISTS push_tokens (\r
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),\r
    "user_email" TEXT NOT NULL,\r
    "device_token" TEXT NOT NULL,\r
    "platform" TEXT NOT NULL DEFAULT 'android',\r
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,\r
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,\r
    "device_id" TEXT,\r
    "app_version" TEXT,\r
    "is_active" BOOLEAN NOT NULL DEFAULT true,\r
    "last_seen_at" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,\r
    CONSTRAINT push_tokens_device_token_key UNIQUE ("device_token")\r
);\r
\r
CREATE INDEX IF NOT EXISTS idx_push_tokens_user_email ON push_tokens ("user_email");\r
\r
-- -----------------------------------------------------------------------------\r
-- "UserRole" gains MANAGER (production schema has ADMIN, MANAGER, AGENT)\r
-- -----------------------------------------------------------------------------\r
DO $$ BEGIN\r
  IF NOT EXISTS (\r
    SELECT 1 FROM pg_enum e\r
    JOIN pg_type t ON t.oid = e.enumtypid\r
    WHERE t.typname = 'UserRole' AND e.enumlabel = 'MANAGER'\r
  ) THEN\r
    ALTER TYPE "UserRole" ADD VALUE 'MANAGER';\r
  END IF;\r
END $$;\r
`,Ft=`-- -----------------------------------------------------------------------------\r
-- Widen "Order"."pinCodeEncrypted"\r
--\r
-- PIN codes are stored AES-256-GCM encrypted ("enc_aes256_<iv>:<ct>"), which\r
-- exceeds the legacy VARCHAR(20) and made saving an order fail with\r
-- "value too long for type character varying(20)". TEXT matches the sibling\r
-- "accountPasswordEncrypted" column.\r
-- -----------------------------------------------------------------------------\r
ALTER TABLE IF EXISTS "Order" ALTER COLUMN "pinCodeEncrypted" TYPE TEXT;\r
`,Mt=`-- =============================================================================
-- Recura — Migration 006: Mobile Authentication & Device Management
-- Adds tables required for securely pairing and authenticating the Android app.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- installation — represents this specific Recura backend environment
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS installation (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL DEFAULT 'Recura',
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Seed an installation identity if one does not exist
INSERT INTO installation ("name", "status") 
SELECT 'Recura', 'active' 
WHERE NOT EXISTS (SELECT 1 FROM installation);

-- -----------------------------------------------------------------------------
-- mobile_devices — authenticated Android devices paired with this installation
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mobile_devices (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "installation_id" UUID NOT NULL REFERENCES installation("id"),
    "device_id" TEXT NOT NULL,
    "device_name" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "app_version" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    "last_seen_at" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    "revoked_at" TIMESTAMP WITH TIME ZONE,
    "user_id" UUID REFERENCES "User"("id")
);

CREATE INDEX IF NOT EXISTS idx_mobile_devices_user ON mobile_devices ("user_id");

-- -----------------------------------------------------------------------------
-- mobile_pairing_tokens — short-lived, one-time tokens for pairing via QR code
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mobile_pairing_tokens (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "installation_id" UUID NOT NULL REFERENCES installation("id"),
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
    "used_at" TIMESTAMP WITH TIME ZONE,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    "created_by" UUID NOT NULL REFERENCES "User"("id")
);

-- -----------------------------------------------------------------------------
-- mobile_sessions — active login sessions for mobile devices
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mobile_sessions (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "mobile_device_id" UUID NOT NULL REFERENCES mobile_devices("id") ON DELETE CASCADE,
    "user_id" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "session_token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    "last_active_at" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- -----------------------------------------------------------------------------
-- Modify push_tokens to link with installation and user_id explicitly
-- -----------------------------------------------------------------------------
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='push_tokens' AND column_name='installation_id') THEN
    ALTER TABLE push_tokens ADD COLUMN "installation_id" UUID REFERENCES installation("id");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='push_tokens' AND column_name='user_id') THEN
    ALTER TABLE push_tokens ADD COLUMN "user_id" UUID REFERENCES "User"("id");
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- SECURITY: Grant API access to the new tables so the RestAdapter can use them
-- in hosted-backend mode without hitting Row Level Security errors.
-- -----------------------------------------------------------------------------
GRANT ALL PRIVILEGES ON TABLE installation TO anon, authenticated;
GRANT ALL PRIVILEGES ON TABLE mobile_devices TO anon, authenticated;
GRANT ALL PRIVILEGES ON TABLE mobile_pairing_tokens TO anon, authenticated;
GRANT ALL PRIVILEGES ON TABLE mobile_sessions TO anon, authenticated;

DO $$ 
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['installation','mobile_devices','mobile_pairing_tokens','mobile_sessions']
  LOOP
    IF to_regclass(format('%I', t)) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE %I DISABLE ROW LEVEL SECURITY', t);
      EXECUTE format('DROP POLICY IF EXISTS recura_full_access ON %I', t);
      EXECUTE format('CREATE POLICY recura_full_access ON %I FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)', t);
    END IF;
  END LOOP;
END $$;
`,Pt=`-- 007_pre_request_hook.sql
-- Enforces server-side device revocation for Android API requests made directly to PostgREST.

CREATE OR REPLACE FUNCTION public.pre_request()
RETURNS void AS $$
DECLARE
    v_device_id text;
    v_device_token text;
    v_device_status text;
BEGIN
    -- Extract headers provided by the Android App (RecuraApiProvider.kt)
    v_device_id := current_setting('request.headers', true)::json->>'x-device-id';
    v_device_token := current_setting('request.headers', true)::json->>'x-device-token';
    
    -- If neither header is present, this is a web app request or unauthenticated, allow it.
    -- Web app handles its own auth via /api/db and session tokens.
    IF v_device_id IS NULL AND v_device_token IS NULL THEN
        RETURN;
    END IF;

    -- Validate device
    SELECT status INTO v_device_status
    FROM public.mobile_devices
    WHERE device_id = v_device_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'device_revoked' USING ERRCODE = '42501';
    END IF;
    
    IF v_device_status = 'revoked' THEN
        RAISE EXCEPTION 'device_revoked' USING ERRCODE = '42501';
    END IF;
    
    -- In this architecture, device_id acts as the secure token (it is a crypto.randomUUID).
    -- We ensure the device_token provided matches the device_id to satisfy the Android app's requirement.
    IF v_device_id != v_device_token THEN
        RAISE EXCEPTION 'device_revoked' USING ERRCODE = '42501';
    END IF;

    -- Update last_seen_at (Best effort, ignore if fails)
    -- PostgREST handles transactions, this is safe.
    UPDATE public.mobile_devices
    SET last_seen_at = now()
    WHERE device_id = v_device_id;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Configure PostgREST to run this function before every request
-- Note: Requires PostgREST restart or schema cache reload in Supabase
-- ALTER ROLE authenticator SET pgrst.db_pre_request TO 'public.pre_request';
`,kt=`-- 008_pair_device_rpc.sql
-- Provides an RPC for the Android app to securely pair and register itself.

CREATE OR REPLACE FUNCTION public.pair_device(
    p_code_hash text,
    p_device_name text,
    p_platform text,
    p_app_version text
)
RETURNS json AS $$
DECLARE
    v_installation_id uuid;
    v_token_id uuid;
    v_device_id text;
    v_device_token text;
    v_result json;
BEGIN
    -- 1. Get current installation
    SELECT id INTO v_installation_id FROM public.installation LIMIT 1;
    IF v_installation_id IS NULL THEN
        RAISE EXCEPTION 'installation_not_found' USING ERRCODE = 'P0001';
    END IF;

    -- 2. Find valid pairing token
    SELECT id INTO v_token_id
    FROM public.mobile_pairing_tokens
    WHERE token_hash = p_code_hash
      AND expires_at > now()
      AND used_at IS NULL
      AND installation_id = v_installation_id
    FOR UPDATE; -- Lock to prevent race conditions

    IF v_token_id IS NULL THEN
        RAISE EXCEPTION 'invalid_or_expired_token' USING ERRCODE = 'P0002';
    END IF;

    -- 3. Mark token as used
    UPDATE public.mobile_pairing_tokens
    SET used_at = now()
    WHERE id = v_token_id;

    -- 4. Generate device ID and Token
    v_device_id := gen_random_uuid()::text;
    v_device_token := v_device_id; -- Same as device_id to align with web app expectations

    -- 5. Insert new mobile device
    INSERT INTO public.mobile_devices (
        installation_id,
        device_id,
        device_name,
        platform,
        app_version,
        status
    ) VALUES (
        v_installation_id,
        v_device_id,
        p_device_name,
        p_platform,
        p_app_version,
        'active'
    );

    -- 6. Return credentials
    v_result := json_build_object(
        'ok', true,
        'installation_id', v_installation_id,
        'device_id', v_device_id,
        'device_token', v_device_token
    );

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
`,Ht=`-- 009_generic_products.sql

DO  BEGIN
    CREATE TYPE fulfillment_type AS ENUM (
        'SHARED_ACCOUNT',
        'DEDICATED_ACCOUNT',
        'PROFILE',
        'SEAT',
        'INVITATION',
        'LICENSE_KEY',
        'ACTIVATION_CODE',
        'CREDENTIALS',
        'MANUAL'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END ;

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

INSERT INTO product_categories (name, description) VALUES
('Streaming & Entertainment', 'Netflix, Disney+, Spotify, etc.'),
('Software & Tools', 'Microsoft 365, Canva, CapCut'),
('AI & Productivity', 'ChatGPT, Gemini, Claude'),
('VPN & Security', 'NordVPN, ExpressVPN'),
('Other Digital Goods', 'Miscellaneous digital subscriptions')
ON CONFLICT DO NOTHING;\r
`,ve={};let Y=null;function Oe(){const t=ve==null?void 0:ve.VITE_API_URL;return t&&typeof t=="string"&&t.trim()?t.trim().replace(/\/+$/,""):""}function k(t){return Oe()+t}function Xt(t,r){const s=t.trimStart();return(r??"").includes("text/html")||s.startsWith("<!doctype")||s.startsWith("<html")}const Wt="The /api/install/* endpoints returned an HTML page instead of JSON — the installer is not talking to a Recura server. "+(Oe()?`Check that the Recura server is running at ${Oe()} and that VITE_API_URL points at its HTTPS origin (no trailing slash).`:"Set the VITE_API_URL build environment variable to the HTTPS origin of your hosted Recura server (e.g. https://your-server.onrender.com).");async function Te(t,r){const s=await t.text();if(!s)return{};if(Xt(s,t.headers.get("content-type")))throw new Error(`${Wt} (${r} returned HTML with status ${t.status}.)`);try{return JSON.parse(s)}catch{throw new Error(`Unexpected server response (${t.status}). Reload the page and try again.`)}}async function Gt(){if(Y)return Y;const t=await fetch(k("/api/csrf"),{method:"GET",credentials:"include"});if(!t.ok)throw new Error(`Could not reach the Recura server at ${k("/api/csrf")}. Is it running?`);const r=await Te(t,"/api/csrf");if(Y=(r==null?void 0:r.csrfToken)||null,!Y)throw new Error("The Recura server did not issue a security token. Reload the page and try again.");return Y}async function q(t,r,s){const l={"Content-Type":"application/json","X-CSRF-Token":await Gt()};s&&(l.Authorization=`Bearer ${s}`);let h;try{h=await fetch(k(t),{method:"POST",headers:l,credentials:"include",body:JSON.stringify(r??{})})}catch{throw new Error(`Could not reach the Recura server at ${k(t)}. Is it running?`)}const L=await Te(h,t),i=L;if(!h.ok||i.ok===!1)throw i.code==="CSRF"&&(Y=null),new Error(i.message||`Request failed (${h.status}).`);return L}const O={getStatus:async()=>{const t=await fetch(k("/api/install/status"),{credentials:"include"});if(!t.ok)throw new Error(`Could not reach the Recura server at ${k("/api/install/status")}. Is it running?`);return await Te(t,"/api/install/status")},getDbPresets:async()=>{const t=await fetch(k("/api/install/presets"),{credentials:"include"});return t.ok?await Te(t,"/api/install/presets"):{ok:!1,presets:[]}},testConnection:t=>q("/api/install/test-connection",{database:t}),startInstall:(t,r,s,m,l=!1)=>q("/api/install/start",{database:t,dbState:r,consent:s,resume:m,force:l}),migrate:t=>q("/api/install/migrate",{},t),createAdmin:(t,r)=>q("/api/install/admin",r,t),verify:t=>q("/api/install/verify",{},t),complete:t=>q("/api/install/complete",{},t)},$e=Object.assign({"../../server/migrations/001_initial_schema.sql":yt,"../../server/migrations/002_default_whatsapp_templates.sql":jt,"../../server/migrations/003_order_number_backfill.sql":wt,"../../server/migrations/004_mobile_push_tables.sql":Dt,"../../server/migrations/005_widen_pin_code_encrypted.sql":Ft,"../../server/migrations/006_mobile_authentication.sql":Mt,"../../server/migrations/007_pre_request_hook.sql":Pt,"../../server/migrations/008_pair_device_rpc.sql":kt,"../../server/migrations/009_generic_products.sql":Ht}),Vt=Object.keys($e).sort().map(t=>$e[t]).join(`

`),Ue=`
-- ---------------------------------------------------------------------------
-- Supabase / hosted (PostgREST) access
-- Recura authenticates within the app, so the tables must be readable and
-- writable through the API key. Required for Supabase (RLS is on by default).
-- Safe to run again; missing tables are skipped.
-- ---------------------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Disable RLS on every Recura table and, belt-and-suspenders, add permissive
-- policies for the anon/authenticated roles so the API key keeps working even
-- if RLS is ever re-enabled. Missing tables are skipped, so this can be run on
-- a partial schema or repeatedly.
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['User','Customer','Plan','Order','WhatsAppTemplate','AuditLog','service_accounts','push_events','push_log','push_tokens']
  LOOP
    IF to_regclass(format('%I', t)) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE %I DISABLE ROW LEVEL SECURITY', t);
      EXECUTE format('DROP POLICY IF EXISTS recura_full_access ON %I', t);
      EXECUTE format('CREATE POLICY recura_full_access ON %I FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)', t);
    END IF;
  END LOOP;
END $$;
`,qe=Vt+Ue,Ye='The API key can read the Recura schema but is blocked from writing — row-level security (RLS) is still enabled. Open your database SQL console (for Supabase: SQL Editor), run only the "Supabase / hosted access" block below, then verify again.',Be=["Welcome","Database","Install","Admin","Verify","Complete"],Ze={INSTALLED:{title:"Recura is already installed",body:"This server already has a configured database. The installer is locked to protect it.",tone:"ok"},INSTALLING:{title:"Installation was left in progress",body:"A previous installation did not finish. You can safely restart it — partial changes are rolled back or resumed automatically.",tone:"warn"},INSTALLATION_FAILED:{title:"The previous installation failed",body:"The installer can safely retry. Already-completed steps are skipped automatically.",tone:"err"},RECOVERY_REQUIRED:{title:"Recura needs recovery",body:"The server detects an inconsistent installation state. Restart the Recura server process and reload this page.",tone:"warn"}},$t={name:"",username:"",email:"",password:"",confirm:""},Qe=/^[a-zA-Z0-9_.-]+$/,ze=/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/,Ke={host:"",port:"5432",database:"",user:"",password:"",ssl:!1},qt={host:"db",port:"5432",database:"recura",user:"recura",password:"recura",ssl:!1};function nt(t){const r=t.trim();if(!/^postgres(ql)?:\/\//i.test(r))return{db:Ke,error:"That does not look like a connection string. It should start with postgres:// or postgresql://"};let s;try{s=new URL(r)}catch{return{db:Ke,error:"Could not read that connection string. Double-check it and try again."}}const m=(s.searchParams.get("sslmode")||"").toLowerCase(),l=["require","verify-ca","verify-full","prefer","true","1"].includes(m)||s.searchParams.get("ssl")==="true";return{db:{host:s.hostname,port:s.port||"5432",database:decodeURIComponent(s.pathname.replace(/^\//,"")),user:decodeURIComponent(s.username),password:decodeURIComponent(s.password),ssl:l}}}function Je(t){return/auth|password|28P01|password authentication/i.test(t)?"Double-check the username and password.":/could not reach|ECONNREFUSED|host and port/i.test(t)?"Check that the host and port are correct and that the database accepts remote connections.":/does not exist/i.test(t)?"Create the database first (your database provider has a button for that), then try again.":/privileges|permission/i.test(t)?"The database user needs permission to create tables. Choose a database with full access.":/timeout|timed out/i.test(t)?"The connection timed out. Check the host and port, and make sure your network allows it.":/ssl|certificate/i.test(t)?'Your database requires SSL. Turn on "Use SSL connection" and try again.':null}function Yt(){const[t,r]=o.useState(null),[s,m]=o.useState(null),[l,h]=o.useState(0),[L,i]=o.useState(null),[p,_]=o.useState(!1),[j,w]=o.useState({host:"",port:"5432",database:"",user:"",password:"",ssl:!1}),[b,D]=o.useState(null),[re,B]=o.useState(!1),[X,ie]=o.useState(!1),[v,Z]=o.useState(null),[le,Q]=o.useState(null),[T,oe]=o.useState($t),[xe,Ae]=o.useState(null),[I,C]=o.useState([]),[W,be]=o.useState(!1),[A,de]=o.useState(!1),[G,ce]=o.useState(""),[ue,Ie]=o.useState(null),[Ee,z]=o.useState("postgres"),[R,fe]=o.useState(""),[F,M]=o.useState(""),[_e,N]=o.useState("idle"),[ge,K]=o.useState(null),[Le,d]=o.useState(null),[pe,J]=o.useState(!1),[c,S]=o.useState(!1),[ee,Re]=o.useState(!1),[at,rt]=o.useState(null),[je,it]=o.useState("");o.useEffect(()=>{O.getStatus().then(a=>r(a.status)).catch(a=>m(a.message)),O.getDbPresets().then(a=>{a.ok&&C(a.presets??[])}).catch(()=>{})},[]);const te=s!==null;if(o.useEffect(()=>{te&&z("hosted")},[te]),t===null&&!te)return e.jsx(me,{children:e.jsxs(y,{children:[e.jsx(U,{className:"w-8 h-8 text-[#4A90FF] animate-spin mx-auto"}),e.jsx("p",{className:"text-xs text-slate-500 text-center mt-2",children:"Checking installation state…"})]})});if(t==="INSTALLED")return e.jsx(me,{children:e.jsx(et,{state:Ze.INSTALLED,children:e.jsx("a",{href:"/",className:"btn-primary w-full",children:"Open Recura"})})});if(t==="INSTALLING"||t==="INSTALLATION_FAILED"||t==="RECOVERY_REQUIRED"){const a=Ze[t];return e.jsx(me,{children:e.jsx(et,{state:a,children:e.jsx("button",{className:"btn-primary w-full",onClick:()=>{r("NOT_INSTALLED"),h(1)},children:t==="INSTALLATION_FAILED"?"Retry Installation":t==="RECOVERY_REQUIRED"?"I have restarted the server":"Restart Installation"})})})}return e.jsx(me,{children:e.jsxs("div",{className:"w-full max-w-2xl mx-auto space-y-5",children:[te&&e.jsxs("div",{className:"flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-bold text-amber-900",children:[e.jsx(g,{className:"w-4 h-4 text-amber-500 shrink-0 mt-0.5"}),e.jsxs("div",{className:"space-y-1",children:[e.jsx("p",{children:"No Recura server is reachable at this address."}),e.jsx("p",{className:"font-semibold text-amber-800/80 leading-relaxed",children:"You can still install Recura with a hosted database below — that option runs entirely in this browser and needs no server. (Self-hosting needs a running Recura server; see the README.)"})]})]}),e.jsx("div",{className:"flex items-center justify-center gap-1.5 flex-wrap",children:Be.map((a,n)=>e.jsxs("div",{className:"flex items-center gap-1.5",children:[e.jsxs("div",{className:"flex items-center gap-1.5",children:[e.jsx("span",{className:`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold transition-colors ${n<l?"bg-emerald-500 text-white":n===l?"bg-[#4A90FF] text-white":"bg-slate-200 text-slate-500"}`,children:n<l?e.jsx(Ne,{className:"w-3.5 h-3.5"}):n+1}),e.jsx("span",{className:`text-[11px] font-bold hidden sm:block ${n===l?"text-[#111827]":"text-slate-400"}`,children:a})]}),n<Be.length-1&&e.jsx("div",{className:"w-6 h-px bg-slate-200"})]},a))}),L&&e.jsxs("div",{className:"p-3 bg-rose-50 border border-rose-200 text-rose-900 rounded-2xl text-xs flex items-start gap-2.5 font-medium",children:[e.jsx(g,{className:"w-4 h-4 text-rose-500 shrink-0 mt-0.5"}),e.jsx("p",{className:"font-bold text-rose-950",children:L})]}),l===0&&e.jsx(Bt,{onNext:()=>h(1)}),l===1&&e.jsx(Zt,{db:j,setDb:w,test:b,testing:re,consent:X,setConsent:ie,onTest:we,onNext:ut,busy:p,presets:I,useEnv:W,setUseEnv:be,connOpen:A,setConnOpen:de,connString:G,setConnString:ce,connError:ue,setConnError:Ie,onDbChange:()=>{D(null),i(null)},backend:Ee,setBackend:z,serverAvailable:!te,hostedUrl:R,setHostedUrl:fe,hostedKey:F,setHostedKey:M,hostedState:_e,hostedError:Le,setHostedError:d,hostedResult:ge,hostedBusy:pe,hostedAdminExists:c,hostedCopied:ee,setHostedCopied:Re,hostedGraphqlEndpoint:at,graphqlConnString:je,setGraphqlConnString:it,onGraphqlConnString:ot,onHostedTest:lt,onHostedAdmin:dt,onHostedFinish:ct,admin:T,setAdmin:oe}),l===2&&e.jsx(Qt,{migrations:le,onNext:()=>h(3)}),l===3&&e.jsx(zt,{admin:T,setAdmin:oe,busy:p,onSubmit:pt}),l===4&&e.jsx(Kt,{result:xe,onNext:ht,busy:p}),l===5&&e.jsx(Jt,{hosted:Ee==="hosted"})]})});async function we(a){i(null);const n=a&&typeof a=="object"&&typeof a.host=="string"?a:j;if(!W&&(!n.host||!n.database||!n.user)){i("Host, database name and username are required to test the connection.");return}B(!0),D(null);try{const u=await O.testConnection(W?{...n,useEnvDatabase:!0}:n);D(u),u.ok||i(u.message||"Connection test failed.")}catch(u){i(u instanceof Error?u.message:"Connection test failed.")}finally{B(!1)}}async function lt(){i(null);const a=R.trim(),n=F.trim();if(!a){N("error"),d("Please paste the database API URL.");return}if(!/^https:\/\/.+/i.test(a)&&!/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(a)){N("error"),d("The API URL must start with https:// (or http://localhost for local development).");return}N("testing"),d(null),K(null);try{const u=Fe(a,n),{data:f,error:V}=await u.get("User",{select:"id, role",limit:1});if(V){if(/PGRST205|Could not find the table|relation .* does not exist|undefined_table/i.test(V.message)){N("schema-missing"),d(V.message);return}const[De,$]=await Promise.all([Nt(a,n),xt(a,n)]);if(De.isGraphql){N("graphql"),d(null),rt(De.endpoint??null);return}if($.isPostgrest){N("schema-missing"),d(V.message);return}N("error"),d(`We couldn't identify the connection method for this address (HTTP ${$.status}${$.contentType?`, ${$.contentType}`:""}). Paste the connection string your database provider gave you (it starts with postgres://) and Recura will install it automatically.`+($.message?` (${$.message})`:""));return}const P=(f??[]).some(se=>se.role==="ADMIN"),{data:Se,error:Tt}=await u.insert("AuditLog",[{userEmail:`installer-probe-${Date.now()}@recura.local`,userName:"Installer Probe",action:"INSTALLER_ACCESS_PROBE",details:"Temporary write-access check; removed immediately.",ipAddress:"127.0.0.1"}]);if(Tt){N("rls"),d(Ye);return}if(Se&&Se.length){const se=Se[0].id;se&&await u.delete("AuditLog",{id:se})}S(P),N("ok"),K(P?"Connected. An administrator already exists, so the installation is complete.":"Connected and the schema is ready — create your administrator account below.")}catch(u){N("error"),d(u instanceof Error?u.message:"Could not reach the database API.")}}function ot(){const{db:a,error:n}=nt(je);if(n){d(n);return}w(a),z("postgres"),N("idle"),d(null),D(null),i(null),we(a)}async function dt(){const a=T.name.trim(),n=T.username.trim(),u=T.email.trim();if(!a)return d("Full name is required.");if(n.length<3||n.length>40||/\s/.test(n)||!Qe.test(n))return d("Username must be 3–40 characters using letters, numbers, _ , - or . only.");if(!ze.test(u))return d("Please enter a valid email address.");if(T.password.length<6)return d("Password must be at least 6 characters.");if(T.password!==T.confirm)return d("Passwords do not match.");J(!0),d(null);try{const f=await At(T.password),V=Fe(R.trim(),F.trim()),{error:P}=await V.insert("User",[{name:a,username:n,email:u.toLowerCase(),passwordHash:f,role:"ADMIN",currency:"USD ($)"}]);if(P){/duplicate|unique|23505/i.test(P.message)?d("That email or username is already in use. Choose another one."):/row.?level security|permission denied|is not allowed|42501/i.test(P.message)?d(Ye):d(`Could not create the administrator account: ${P.message}`);return}Me({provider:"postgrest",url:R.trim(),key:F.trim()}),h(5)}catch(f){d(f instanceof Error?f.message:"Could not create the administrator account.")}finally{J(!1)}}function ct(){Me({provider:"postgrest",url:R.trim(),key:F.trim()}),h(5)}async function ut(){if(!(b!=null&&b.ok)||!b.state)return;if((b.state==="partial"||b.state==="unrelated"||b.state==="complete"&&b.migrated!==!0)&&!X){i("Please confirm that you authorize installing Recura into the selected database.");return}_(!0),i(null);try{const n=await O.startInstall(W?{...j,useEnvDatabase:!0}:j,b.state,X,!1);if(!n.installToken){i(n.message||"Could not start the installation.");return}Z(n.installToken),_(!1),h(2),await Et(n.installToken)}catch(n){_(!1),i(n instanceof Error?n.message:"Could not start the installation.")}}async function Et(a){_(!0),i(null);try{const n=await O.migrate(a);if(!n.ok||!n.result){i(n.message||"Installing the database schema failed.");return}Q({applied:n.result.applied.map(u=>u.name),total:n.result.applied.length+n.result.alreadyApplied.length}),h(3)}catch(n){i(n instanceof Error?n.message:"Installing the database schema failed.")}finally{_(!1)}}async function pt(){const a=T.name.trim(),n=T.username.trim(),u=T.email.trim();if(!a)return i("Full name is required.");if(n.length<3||n.length>40||/\s/.test(n)||!Qe.test(n))return i("Username must be 3–40 characters using letters, numbers, _ , - or . only.");if(!ze.test(u))return i("Please enter a valid email address.");if(T.password.length<6)return i("Password must be at least 6 characters.");if(T.password!==T.confirm)return i("Passwords do not match.");_(!0),i(null);try{const f=await O.createAdmin(v,{name:a,username:n,email:u,password:T.password});if(!f.ok){i(f.message||"Could not create the administrator account.");return}await mt()}catch(f){i(f instanceof Error?f.message:"Could not create the administrator account.")}finally{_(!1)}}async function mt(){i(null);try{const a=await O.verify(v);Ae(a),h(4)}catch(a){i(a instanceof Error?a.message:"Verification failed.")}}async function ht(){_(!0),i(null);try{const a=await O.complete(v);if(!a.ok){i(a.message||"Could not complete the installation.");return}h(5)}catch(a){i(a instanceof Error?a.message:"Could not complete the installation.")}finally{_(!1)}}}function me({children:t}){return e.jsxs("div",{className:"min-h-screen bg-[#F5F7FA] flex items-center justify-center p-4 relative overflow-hidden",children:[e.jsx("div",{className:"absolute top-0 right-1/4 w-96 h-96 bg-blue-100/50 rounded-full blur-3xl pointer-events-none"}),e.jsx("div",{className:"absolute bottom-0 left-1/4 w-96 h-96 bg-slate-200/50 rounded-full blur-3xl pointer-events-none"}),e.jsxs("div",{className:"w-full max-w-2xl relative z-10 space-y-6",children:[e.jsxs("div",{className:"text-center flex flex-col items-center justify-center",children:[e.jsx("div",{className:"inline-flex items-center justify-center mb-2",children:e.jsx(bt,{className:"w-16 h-16 drop-shadow-sm"})}),e.jsx(It,{className:"text-3xl"}),e.jsx("p",{className:"text-[11px] font-bold text-slate-400 mt-1 tracking-wide uppercase",children:"Automatic Installer"})]}),t]})]})}function y({children:t}){return e.jsx("div",{className:"bg-white border border-[#E8EAF0] rounded-3xl p-7 shadow-xl space-y-4",children:t})}function et({state:t,children:r}){const s=t.tone==="ok"?"text-emerald-500":t.tone==="warn"?"text-amber-500":"text-rose-500";return e.jsxs(y,{children:[t.tone==="ok"?e.jsx(ne,{className:`w-8 h-8 ${s} mx-auto`}):e.jsx(g,{className:`w-8 h-8 ${s} mx-auto`}),e.jsx("h1",{className:"text-lg font-extrabold text-[#111827] text-center",children:t.title}),e.jsx("p",{className:"text-xs text-slate-500 text-center leading-relaxed",children:t.body}),r]})}function ae({children:t}){return e.jsx("div",{className:"border-b border-slate-100 pb-3 flex items-center justify-between",children:e.jsx("h2",{className:"text-base font-extrabold text-[#111827]",children:t})})}function x({label:t,children:r}){return e.jsxs("div",{children:[e.jsx("label",{className:"block text-[#111827] font-extrabold mb-1.5 text-xs",children:t}),r]})}const E="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E8EAF0] text-[#111827] rounded-xl font-medium text-xs focus:outline-none focus:bg-white focus:border-[#4A90FF] focus:ring-2 focus:ring-blue-100 transition-all";function Bt({onNext:t}){const r=[{icon:Ce,title:"Your data stays yours",body:"Recura is installed on your own database — your data is never stored in the browser or on a third party."},{icon:Ut,title:"Almost no setup",body:"The wizard finds the easiest path for you: paste a connection string, use the database your hosting created, or fill in a few fields."},{icon:he,title:"Protected after install",body:"The installer locks itself once you finish. Your data stays on your server."}];return e.jsxs(y,{children:[e.jsx(ae,{children:"Welcome to Recura"}),e.jsx("p",{className:"text-xs text-slate-500 leading-relaxed",children:"This short wizard connects Recura to a database, installs everything it needs, and creates your first administrator account. It takes about 2 minutes and there is nothing technical to understand."}),e.jsx("div",{className:"space-y-3",children:r.map(({icon:s,title:m,body:l})=>e.jsxs("div",{className:"flex items-start gap-3 p-3.5 bg-[#F8FAFC] rounded-2xl border border-[#E8EAF0]",children:[e.jsx(s,{className:"w-5 h-5 text-[#4A90FF] shrink-0 mt-0.5"}),e.jsxs("div",{children:[e.jsx("p",{className:"text-xs font-extrabold text-[#111827]",children:m}),e.jsx("p",{className:"text-[11px] text-slate-500 mt-0.5 leading-relaxed",children:l})]})]},m))}),e.jsxs("div",{className:"p-3.5 bg-blue-50/60 border border-blue-200 rounded-2xl space-y-1.5",children:[e.jsxs("p",{className:"text-[11px] font-extrabold text-[#111827] flex items-center gap-1.5",children:[e.jsx(st,{className:"w-3.5 h-3.5 text-[#4A90FF]"})," What you will need"]}),e.jsxs("p",{className:"text-[11px] text-slate-600 leading-relaxed",children:["One of: ",e.jsx("span",{className:"font-bold text-slate-800",children:"a hosted database REST API"})," (no server needed — any PostgreSQL, e.g. Supabase), ",e.jsx("span",{className:"font-bold text-slate-800",children:"a database your hosting already created"}),","," ",e.jsx("span",{className:"font-bold text-slate-800",children:"a connection string"})," from a free database provider (",e.jsx("a",{className:"text-[#4A90FF] font-bold underline",href:"https://neon.tech",target:"_blank",rel:"noreferrer",children:"Neon"}),","," ",e.jsx("a",{className:"text-[#4A90FF] font-bold underline",href:"https://supabase.com",target:"_blank",rel:"noreferrer",children:"Supabase"}),","," ",e.jsx("a",{className:"text-[#4A90FF] font-bold underline",href:"https://render.com",target:"_blank",rel:"noreferrer",children:"Render"}),"), or"," ",e.jsx("span",{className:"font-bold text-slate-800",children:"a few connection details"}),". Plus an email and a password for your login."]})]}),e.jsxs("button",{className:"btn-primary w-full",onClick:t,children:["Begin Installation ",e.jsx(ye,{className:"w-4 h-4"})]})]})}function Zt({db:t,setDb:r,test:s,testing:m,consent:l,setConsent:h,onTest:L,onNext:i,busy:p,presets:_,useEnv:j,setUseEnv:w,connOpen:b,setConnOpen:D,connString:re,setConnString:B,connError:X,setConnError:ie,onDbChange:v,backend:Z,setBackend:le,serverAvailable:Q,hostedUrl:T,setHostedUrl:oe,hostedKey:xe,setHostedKey:Ae,hostedState:I,hostedError:C,setHostedError:W,hostedResult:be,hostedBusy:A,hostedAdminExists:de,hostedCopied:G,setHostedCopied:ce,hostedGraphqlEndpoint:ue,graphqlConnString:Ie,setGraphqlConnString:Ee,onGraphqlConnString:z,onHostedTest:R,onHostedAdmin:fe,onHostedFinish:F,admin:M,setAdmin:_e}){var J;const N=c=>S=>{const ee=c==="ssl"?S.target.checked:S.target.value;w(!1),v(),r(Re=>({...Re,[c]:ee}))},ge=()=>{const{db:c,error:S}=nt(re);ie(S??null),S||(w(!1),v(),r(c),D(!1),B(""))},K=(s==null?void 0:s.ok)&&(s.state==="partial"||s.state==="unrelated"||s.state==="complete"&&s.migrated!==!0),Le=(s==null?void 0:s.ok)===!0&&(!K||l),d=c=>S=>_e(ee=>({...ee,[c]:S.target.value})),pe=async(c=qe)=>{try{await navigator.clipboard.writeText(c),ce(!0),window.setTimeout(()=>ce(!1),2500)}catch{}};return e.jsxs(y,{children:[e.jsx(ae,{children:"Database Connection"}),e.jsx("p",{className:"text-xs text-slate-500 leading-relaxed",children:Q?"Recura stores everything in a PostgreSQL database. Pick the option that fits you best.":"Recura stores everything in a PostgreSQL database. No server is reachable here, so use a hosted database — it works entirely from this browser."}),Q&&e.jsxs("div",{className:"grid grid-cols-1 sm:grid-cols-2 gap-3",children:[e.jsxs("button",{className:`text-left rounded-2xl border-2 p-4 transition-all ${Z==="postgres"?"border-[#4A90FF] bg-blue-50/60":"border-[#E8EAF0] bg-[#F8FAFC] hover:border-slate-300"}`,onClick:()=>le("postgres"),disabled:p,children:[e.jsx(Ce,{className:"w-5 h-5 text-[#4A90FF]"}),e.jsx("p",{className:"text-xs font-extrabold text-[#111827] mt-2",children:"Self-hosted (Recommended)"}),e.jsx("p",{className:"text-[11px] text-slate-500 mt-1 leading-relaxed",children:"Your own PostgreSQL, installed by the Recura server."})]}),e.jsxs("button",{className:`text-left rounded-2xl border-2 p-4 transition-all ${Z==="hosted"?"border-[#4A90FF] bg-blue-50/60":"border-[#E8EAF0] bg-[#F8FAFC] hover:border-slate-300"}`,onClick:()=>le("hosted"),disabled:p,children:[e.jsx(We,{className:"w-5 h-5 text-[#4A90FF]"}),e.jsx("p",{className:"text-xs font-extrabold text-[#111827] mt-2",children:"Hosted database (REST API)"}),e.jsx("p",{className:"text-[11px] text-slate-500 mt-1 leading-relaxed",children:"PostgreSQL over a PostgREST REST API (e.g. Supabase) — no server to manage."})]})]}),Z==="hosted"?e.jsx("div",{className:"space-y-4",children:e.jsxs("div",{className:"p-4 bg-[#F8FAFC] border border-[#E8EAF0] rounded-2xl space-y-3",children:[e.jsxs("p",{className:"text-[11px] text-slate-500 leading-relaxed",children:["Works with any PostgreSQL served through a PostgREST API — including Supabase. For Supabase, paste ",e.jsx("span",{className:"font-bold",children:"https://<project>.supabase.co/rest/v1"})," and the"," ",e.jsx("span",{className:"font-bold",children:"anon public key"})," from ",e.jsx("span",{className:"font-mono",children:"Project Settings → API"}),". For a self-hosted PostgREST server, use its URL. Only public credentials are used — they stay in this browser. This option speaks PostgREST; if your provider exposes GraphQL (Nhost, Hasura), the wizard detects it and guides you to the connection-string route instead."]}),e.jsx(x,{label:"Database API URL",children:e.jsx("input",{className:E,placeholder:"https://your-database.example.com",value:T,onChange:c=>oe(c.target.value),disabled:A})}),e.jsx(x,{label:"API key (optional)",children:e.jsx("input",{className:E,type:"password",autoComplete:"off",placeholder:"anon public key — leave empty for open access",value:xe,onChange:c=>Ae(c.target.value),disabled:A})}),e.jsxs("button",{className:"btn-secondary w-full",onClick:R,disabled:A||I==="testing",children:[I==="testing"?e.jsx(U,{className:"w-4 h-4 animate-spin"}):e.jsx(We,{className:"w-4 h-4"}),I==="testing"?"Checking…":"Verify connection & schema"]}),I==="error"&&e.jsxs("div",{className:"flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-bold text-rose-800",children:[e.jsx(g,{className:"w-4 h-4 text-rose-500 shrink-0 mt-0.5"})," ",C]}),I==="schema-missing"&&e.jsxs("div",{className:"space-y-3 rounded-2xl border border-amber-200 bg-amber-50 p-4",children:[e.jsxs("div",{className:"flex items-start gap-2.5 text-xs font-bold text-amber-900",children:[e.jsx(g,{className:"w-4 h-4 text-amber-500 shrink-0 mt-0.5"}),e.jsxs("span",{children:["The database is reachable but the Recura schema is not installed yet. Open your database's SQL console (for Supabase: ",e.jsx("span",{className:"font-mono",children:"SQL Editor"}),"), paste the schema below, run it, then verify again.",e.jsx("br",{}),e.jsx("span",{className:"font-normal text-amber-700",children:"For Supabase, the last block also disables row-level security so the API key can read and write — required for the hosted option."}),e.jsx("br",{}),e.jsx("span",{className:"font-normal text-amber-700",children:'Need to start over with a different provider? Use the "Self-hosted (PostgreSQL)" backend instead.'})]})]}),e.jsx("textarea",{className:E,readOnly:!0,rows:8,value:qe,spellCheck:!1}),e.jsxs("div",{className:"flex flex-col sm:flex-row gap-2",children:[e.jsxs("button",{className:"btn-primary flex-1 !py-2 text-xs",onClick:pe,children:[G?e.jsx(He,{className:"w-4 h-4"}):e.jsx(Pe,{className:"w-4 h-4"}),G?"Copied":"Copy the schema"]}),e.jsxs("button",{className:"btn-secondary flex-1 !py-2 text-xs",onClick:R,disabled:A,children:[e.jsx(ke,{className:"w-4 h-4"})," I ran it — check again"]})]})]}),I==="rls"&&e.jsxs("div",{className:"space-y-3 rounded-2xl border border-rose-200 bg-rose-50 p-4",children:[e.jsxs("div",{className:"flex items-start gap-2.5 text-xs font-bold text-rose-900",children:[e.jsx(he,{className:"w-4 h-4 text-rose-500 shrink-0 mt-0.5"}),e.jsx("span",{children:C})]}),e.jsx("textarea",{className:E,readOnly:!0,rows:6,value:Ue,spellCheck:!1}),e.jsxs("div",{className:"flex flex-col sm:flex-row gap-2",children:[e.jsxs("button",{className:"btn-primary flex-1 !py-2 text-xs",onClick:()=>pe(Ue),children:[G?e.jsx(He,{className:"w-4 h-4"}):e.jsx(Pe,{className:"w-4 h-4"}),G?"Copied":"Copy the RLS fix block"]}),e.jsxs("button",{className:"btn-secondary flex-1 !py-2 text-xs",onClick:R,disabled:A,children:[e.jsx(ke,{className:"w-4 h-4"})," I ran it — check again"]})]})]}),I==="graphql"&&e.jsxs("div",{className:"space-y-3 rounded-2xl border border-blue-200 bg-blue-50 p-4",children:[e.jsxs("div",{className:"flex items-start gap-2.5 text-xs font-bold text-blue-900",children:[e.jsx(Ve,{className:"w-4 h-4 text-blue-500 shrink-0 mt-0.5"}),e.jsxs("span",{children:["This looks like a ",e.jsx("span",{className:"font-extrabold",children:"GraphQL"})," database API",ue?` (${ue})`:""," — for example Nhost or Hasura. The hosted-database option connects through PostgREST, so it can't talk to this endpoint directly."]})]}),Q?e.jsxs(e.Fragment,{children:[e.jsxs("p",{className:"text-[11px] text-blue-700 leading-relaxed",children:["No problem — Recura installs its database over plain PostgreSQL. Paste the"," ",e.jsx("span",{className:"font-bold",children:"Postgres connection string"})," your provider gives you (Nhost: Dashboard → Settings → Database) and we'll continue automatically."]}),e.jsx(x,{label:"Postgres connection string",children:e.jsx("textarea",{className:E,rows:3,placeholder:"postgresql://user:password@host:5432/database?sslmode=require",value:Ie,onChange:c=>{Ee(c.target.value),W(null)},disabled:A})}),C&&e.jsxs("div",{className:"flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-bold text-rose-800",children:[e.jsx(g,{className:"w-4 h-4 text-rose-500 shrink-0 mt-0.5"})," ",C]}),e.jsxs("button",{className:"btn-primary w-full !py-2 text-xs",onClick:z,disabled:A,children:[e.jsx(Xe,{className:"w-4 h-4"})," Install with this connection string"]})]}):e.jsx("p",{className:"text-[11px] text-blue-700 leading-relaxed",children:"No Recura server is reachable from this page, and the browser-only hosted option only works with a PostgREST endpoint (e.g. Supabase). Try a PostgREST URL instead, or open this installer from your Recura server."})]}),I==="ok"&&e.jsxs("div",{className:"flex items-start gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs font-bold text-emerald-800",children:[e.jsx(ne,{className:"w-5 h-5 text-emerald-500 shrink-0"})," ",be]}),I==="ok"&&de&&e.jsxs("button",{className:"btn-primary w-full",onClick:F,children:[e.jsx(he,{className:"w-4 h-4"})," Finish installation"]}),I==="ok"&&!de&&e.jsxs("div",{className:"space-y-3 border-t border-[#E8EAF0] pt-4",children:[e.jsx("p",{className:"text-xs font-extrabold text-[#111827]",children:"Administrator Account"}),e.jsx(x,{label:"Full Name",children:e.jsx("input",{className:E,placeholder:"System Owner",value:M.name,onChange:d("name"),disabled:A})}),e.jsx(x,{label:"Username",children:e.jsx("input",{className:E,autoComplete:"username",placeholder:"admin",value:M.username,onChange:d("username"),disabled:A})}),e.jsx(x,{label:"Email",children:e.jsx("input",{className:E,type:"email",autoComplete:"email",placeholder:"admin@example.com",value:M.email,onChange:d("email"),disabled:A})}),e.jsxs("div",{className:"grid grid-cols-1 sm:grid-cols-2 gap-3",children:[e.jsx(x,{label:"Password",children:e.jsx("input",{className:E,type:"password",autoComplete:"new-password",value:M.password,onChange:d("password"),disabled:A})}),e.jsx(x,{label:"Confirm Password",children:e.jsx("input",{className:E,type:"password",autoComplete:"new-password",value:M.confirm,onChange:d("confirm"),disabled:A})})]}),C&&e.jsxs("div",{className:"flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-bold text-rose-800",children:[e.jsx(g,{className:"w-4 h-4 text-rose-500 shrink-0 mt-0.5"})," ",C]}),e.jsxs("button",{className:"btn-primary w-full",onClick:fe,disabled:A,children:[A?e.jsx(U,{className:"w-4 h-4 animate-spin"}):e.jsx(tt,{className:"w-4 h-4"}),A?"Creating…":"Create administrator & finish"]})]})]})}):e.jsxs(e.Fragment,{children:[e.jsxs("div",{className:"space-y-2.5",children:[_.map(c=>e.jsxs("div",{className:"flex items-start gap-3 p-3.5 bg-blue-50/60 border border-blue-200 rounded-2xl",children:[e.jsx(Ce,{className:"w-5 h-5 text-[#4A90FF] shrink-0 mt-0.5"}),e.jsxs("div",{className:"flex-1 min-w-0",children:[e.jsx("p",{className:"text-xs font-extrabold text-[#111827]",children:c.label}),c.hint&&e.jsx("p",{className:"text-[11px] text-slate-500 mt-0.5 leading-relaxed",children:c.hint})]}),e.jsx("button",{className:"btn-primary !px-4 !py-2 text-[11px] shrink-0",onClick:()=>{w(!0),v()},disabled:p,children:"Use it"})]},c.id)),e.jsxs("div",{className:"flex items-start gap-3 p-3.5 bg-[#F8FAFC] rounded-2xl border border-[#E8EAF0]",children:[e.jsx(Ge,{className:"w-5 h-5 text-[#4A90FF] shrink-0 mt-0.5"}),e.jsxs("div",{className:"flex-1 min-w-0",children:[e.jsx("p",{className:"text-xs font-extrabold text-[#111827]",children:"Using Docker?"}),e.jsxs("p",{className:"text-[11px] text-slate-500 mt-0.5 leading-relaxed",children:["If you started Recura with ",e.jsx("code",{className:"font-mono",children:"docker compose up"}),", a database is already included."]})]}),e.jsx("button",{className:"btn-secondary !px-4 !py-2 text-[11px] shrink-0",onClick:()=>{w(!1),v(),r(qt)},disabled:p,children:"Fill it in"})]}),e.jsxs("button",{className:"w-full flex items-center justify-center gap-2 text-xs font-extrabold text-[#4A90FF] hover:text-[#2f74e6] transition-colors py-1",onClick:()=>D(c=>!c),disabled:p,children:[e.jsx(Ve,{className:"w-4 h-4"})," ",b?"Hide connection string":"I have a connection string instead"]})]}),b&&e.jsxs("div",{className:"space-y-3 p-4 bg-[#F8FAFC] border border-[#E8EAF0] rounded-2xl",children:[e.jsxs("p",{className:"text-[11px] text-slate-500 leading-relaxed",children:["Your database provider (Neon, Supabase, Render, …) gives you a connection string that starts with"," ",e.jsx("code",{className:"font-mono",children:"postgres://"}),". Paste it here and we will fill in the fields for you."]}),e.jsx("textarea",{className:E,rows:3,placeholder:"postgresql://user:password@host:5432/database?sslmode=require",value:re,onChange:c=>{B(c.target.value),ie(null)},disabled:p}),X&&e.jsx("p",{className:"text-[11px] font-bold text-rose-700",children:X}),e.jsxs("button",{className:"btn-primary w-full !py-2 text-xs",onClick:ge,disabled:p,children:[e.jsx(Xe,{className:"w-4 h-4"})," Fill in the fields from this string"]})]}),j?e.jsxs("div",{className:"p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl space-y-1.5",children:[e.jsxs("div",{className:"flex items-center gap-2 text-xs font-extrabold text-emerald-800",children:[e.jsx(Ne,{className:"w-4 h-4 text-emerald-500"})," Using the hosting database"]}),e.jsx("p",{className:"text-[11px] text-slate-600 leading-relaxed",children:"The server will connect using the database configured by your hosting provider. There is nothing to fill in — just test the connection below."})]}):e.jsxs("div",{className:"grid grid-cols-2 gap-3",children:[e.jsx("div",{className:"col-span-2 sm:col-span-1",children:e.jsx(x,{label:"Host",children:e.jsx("input",{className:E,placeholder:"db.example.com",value:t.host,onChange:N("host"),disabled:p})})}),e.jsx("div",{className:"col-span-1",children:e.jsx(x,{label:"Port",children:e.jsx("input",{className:E,type:"number",placeholder:"5432",value:t.port,onChange:N("port"),disabled:p})})}),e.jsx("div",{className:"col-span-2",children:e.jsx(x,{label:"Database Name",children:e.jsx("input",{className:E,placeholder:"recura",value:t.database,onChange:N("database"),disabled:p})})}),e.jsx("div",{className:"col-span-2 sm:col-span-1",children:e.jsx(x,{label:"Username",children:e.jsx("input",{className:E,autoComplete:"username",placeholder:"postgres",value:t.user,onChange:N("user"),disabled:p})})}),e.jsx("div",{className:"col-span-2 sm:col-span-1",children:e.jsx(x,{label:"Password",children:e.jsx("input",{className:E,type:"password",autoComplete:"current-password",value:t.password,onChange:N("password"),disabled:p})})})]}),e.jsxs("label",{className:"flex items-center gap-2.5 text-xs font-bold text-slate-600 cursor-pointer select-none",children:[e.jsx("input",{type:"checkbox",checked:t.ssl,onChange:N("ssl"),className:"w-4 h-4 accent-[#4A90FF]",disabled:p||j}),"Use SSL connection",e.jsx("span",{className:"inline-flex items-center gap-1 text-slate-400 font-semibold",title:"Cloud databases (Neon, Supabase, Render, Railway) usually need this. Local databases usually do not.",children:e.jsx(st,{className:"w-3.5 h-3.5"})})]}),e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsxs("button",{className:"btn-secondary",onClick:L,disabled:m||p,children:[m?e.jsx(U,{className:"w-4 h-4 animate-spin"}):e.jsx(Ge,{className:"w-4 h-4"}),m?"Testing…":"Test Connection"]}),e.jsx("span",{className:"text-[11px] text-slate-400 font-semibold",children:"We check the connection before installing anything."})]}),s&&e.jsx("div",{className:`rounded-2xl border p-4 text-xs space-y-2 ${s.ok?"bg-emerald-50/60 border-emerald-200":"bg-rose-50 border-rose-200"}`,children:s.ok?e.jsxs(e.Fragment,{children:[e.jsxs("div",{className:"flex items-center gap-2 font-extrabold text-emerald-800",children:[e.jsx(ne,{className:"w-4 h-4 text-emerald-500"})," Connected"]}),e.jsxs("div",{className:"grid grid-cols-2 gap-x-4 gap-y-1.5 text-slate-600",children:[e.jsxs("div",{className:"flex justify-between",children:[e.jsx("span",{children:"Server"}),e.jsx("span",{className:"font-bold text-slate-800",children:((J=s.serverVersion)==null?void 0:J.split(" on ")[0])??"unknown"})]}),e.jsxs("div",{className:"flex justify-between",children:[e.jsx("span",{children:"Supported (PG 13+)"}),e.jsx("span",{className:`font-bold ${s.versionSupported?"text-emerald-600":"text-rose-600"}`,children:s.versionSupported?"Yes":"No"})]}),e.jsxs("div",{className:"flex justify-between",children:[e.jsx("span",{children:"Can create tables"}),e.jsx("span",{className:`font-bold ${s.canCreateTables?"text-emerald-600":"text-rose-600"}`,children:s.canCreateTables?"Yes":"No"})]}),e.jsxs("div",{className:"flex justify-between",children:[e.jsx("span",{children:"Database state"}),e.jsx("span",{className:"font-bold text-slate-800",children:s.state})]})]}),s.existingTables&&s.existingTables.length>0&&e.jsxs("p",{className:"text-slate-600",children:["Existing Recura tables: ",e.jsx("span",{className:"font-bold",children:s.existingTables.join(", ")})]}),s.unrelatedTables&&s.unrelatedTables.length>0&&e.jsxs("p",{className:"text-slate-600",children:["Unrelated tables found (up to 20 shown): ",e.jsx("span",{className:"font-bold",children:s.unrelatedTables.join(", ")})]})]}):e.jsxs("div",{className:"space-y-1.5",children:[e.jsxs("div",{className:"flex items-center gap-2 font-bold text-rose-800",children:[e.jsx(g,{className:"w-4 h-4 text-rose-500"})," ",s.message||"Connection failed."]}),Je(s.message||"")&&e.jsxs("p",{className:"text-rose-700/80 font-semibold",children:["Tip: ",Je(s.message||"")]})]})}),K&&e.jsxs("label",{className:"flex items-start gap-2.5 text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 rounded-2xl p-3.5 cursor-pointer select-none",children:[e.jsx("input",{type:"checkbox",checked:l,onChange:c=>h(c.target.checked),className:"w-4 h-4 accent-amber-500 mt-0.5",disabled:p}),e.jsx("span",{children:"This database already contains tables. I confirm that I own or administer it and authorize installing Recura here. No existing data will be deleted."})]}),e.jsxs("button",{className:"btn-primary w-full",onClick:i,disabled:!Le||p,children:["Continue ",e.jsx(ye,{className:"w-4 h-4"})]})]})]})}function Qt({migrations:t,onNext:r}){return e.jsxs(y,{children:[e.jsx(ae,{children:"Installing the Database"}),t===null?e.jsxs("div",{className:"flex items-center gap-3 text-xs font-bold text-slate-600 py-6 justify-center",children:[e.jsx(U,{className:"w-5 h-5 animate-spin text-[#4A90FF]"})," Installing schema… this may take a moment."]}):e.jsxs("div",{className:"space-y-3",children:[e.jsx("p",{className:"text-xs text-slate-500",children:"The schema, default templates and data guards were applied successfully:"}),e.jsx("div",{className:"space-y-2",children:t.applied.map(s=>e.jsxs("div",{className:"flex items-center gap-2.5 p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800",children:[e.jsx(Ne,{className:"w-4 h-4 text-emerald-500"})," ",s]},s))}),e.jsxs("p",{className:"text-xs text-slate-400 font-semibold",children:[t.total," migration file(s) processed."]}),e.jsxs("button",{className:"btn-primary w-full",onClick:r,children:["Create Administrator ",e.jsx(ye,{className:"w-4 h-4"})]})]})]})}function zt({admin:t,setAdmin:r,busy:s,onSubmit:m}){const l=h=>L=>r(i=>({...i,[h]:L.target.value}));return e.jsxs(y,{children:[e.jsx(ae,{children:"Administrator Account"}),e.jsx("p",{className:"text-xs text-slate-500 leading-relaxed",children:"Create the first account. It will have Administrator rights and is the account you will use to log in."}),e.jsxs("div",{className:"space-y-3",children:[e.jsx(x,{label:"Full Name",children:e.jsx("input",{className:E,placeholder:"System Owner",value:t.name,onChange:l("name"),disabled:s})}),e.jsx(x,{label:"Username",children:e.jsx("input",{className:E,autoComplete:"username",placeholder:"admin",value:t.username,onChange:l("username"),disabled:s})}),e.jsx(x,{label:"Email",children:e.jsx("input",{className:E,type:"email",autoComplete:"email",placeholder:"admin@example.com",value:t.email,onChange:l("email"),disabled:s})}),e.jsxs("div",{className:"grid grid-cols-1 sm:grid-cols-2 gap-3",children:[e.jsx(x,{label:"Password",children:e.jsx("input",{className:E,type:"password",autoComplete:"new-password",value:t.password,onChange:l("password"),disabled:s})}),e.jsx(x,{label:"Confirm Password",children:e.jsx("input",{className:E,type:"password",autoComplete:"new-password",value:t.confirm,onChange:l("confirm"),disabled:s})})]})]}),e.jsxs("button",{className:"btn-primary w-full",onClick:m,disabled:s,children:[s?e.jsx(U,{className:"w-4 h-4 animate-spin"}):e.jsx(tt,{className:"w-4 h-4"}),s?"Creating…":"Create & Verify"]})]})}function Kt({result:t,onNext:r,busy:s}){var m;return e.jsxs(y,{children:[e.jsx(ae,{children:"Verification"}),t===null?e.jsxs("div",{className:"flex items-center gap-3 text-xs font-bold text-slate-600 py-6 justify-center",children:[e.jsx(U,{className:"w-5 h-5 animate-spin text-[#4A90FF]"})," Verifying installation…"]}):t.ok?e.jsxs("div",{className:"space-y-3",children:[e.jsxs("div",{className:"flex items-center gap-2.5 p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-2xl text-xs font-extrabold text-emerald-800",children:[e.jsx(ne,{className:"w-5 h-5 text-emerald-500"})," All checks passed"]}),e.jsx("div",{className:"space-y-1.5",children:(m=t.checks)==null?void 0:m.map(l=>e.jsxs("div",{className:"flex items-center justify-between text-xs p-2.5 bg-[#F8FAFC] rounded-xl",children:[e.jsx("span",{className:"font-bold text-slate-700",children:l.table}),e.jsxs("span",{className:"flex items-center gap-1.5 font-semibold text-slate-500",children:[l.ok?e.jsx(Ne,{className:"w-3.5 h-3.5 text-emerald-500"}):e.jsx(g,{className:"w-3.5 h-3.5 text-rose-500"}),l.rows," row(s)"]})]},l.table))}),t.adminEmail&&e.jsxs("p",{className:"text-xs text-slate-500",children:["Administrator ready: ",e.jsx("span",{className:"font-bold text-slate-800",children:t.adminEmail})]}),e.jsxs("button",{className:"btn-primary w-full",onClick:r,disabled:s,children:[s?e.jsx(U,{className:"w-4 h-4 animate-spin"}):e.jsx(he,{className:"w-4 h-4"}),s?"Finalizing…":"Finish Installation"]})]}):e.jsxs("div",{className:"space-y-3",children:[e.jsxs("div",{className:"flex items-center gap-2.5 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-bold text-rose-800",children:[e.jsx(g,{className:"w-5 h-5 text-rose-500"})," Verification failed. Go back and check the installation."]}),e.jsx("button",{className:"btn-secondary w-full",onClick:()=>window.location.reload(),children:"Reload"})]})]})}function Jt({hosted:t=!1}){return e.jsxs(y,{children:[e.jsx(ne,{className:"w-10 h-10 text-emerald-500 mx-auto"}),e.jsx("h1",{className:"text-lg font-extrabold text-[#111827] text-center",children:"Installation Complete"}),e.jsx("p",{className:"text-xs text-slate-500 text-center leading-relaxed",children:t?"Recura is connected to your hosted database. The app now talks to it directly — no server to manage. Log in with the administrator account you just created.":"Recura is installed and its installer is now locked. Log in with the administrator account you just created."}),e.jsxs("a",{href:"/",className:"btn-primary w-full",children:[e.jsx(ft,{className:"w-4 h-4"})," Go to Log in"]})]})}_t.createRoot(document.getElementById("root")).render(e.jsx(o.StrictMode,{children:e.jsx(Yt,{})}));
