import{c as $,b as i,j as e,f as C,T as S,C as pe,B as _e,E as cs,F as ds,z as us,G as Fe,u as hs,w as ms,i as se,S as je,a as ye,l as we,h as ps,k as xs,K as qe,D as ke,L as Es,A as Ns}from"./index-cIXLGIDc.js";/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ts=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3",key:"1u773s"}],["path",{d:"M12 17h.01",key:"p32p05"}]],Ze=$("circle-question-mark",Ts);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const bs=[["rect",{width:"8",height:"4",x:"8",y:"2",rx:"1",ry:"1",key:"tgr4d6"}],["path",{d:"M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2",key:"116196"}],["path",{d:"m9 14 2 2 4-4",key:"df797q"}]],fs=$("clipboard-check",bs);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const As=[["path",{d:"M11 14h10",key:"1w8e9d"}],["path",{d:"M16 4h2a2 2 0 0 1 2 2v1.344",key:"1e62lh"}],["path",{d:"m17 18 4-4-4-4",key:"z2g111"}],["path",{d:"M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 1.793-1.113",key:"bjbb7m"}],["rect",{x:"8",y:"2",width:"8",height:"4",rx:"1",key:"ublpy"}]],Me=$("clipboard-paste",As);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const gs=[["path",{d:"M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z",key:"p7xjir"}]],Pe=$("cloud",gs);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Is=[["path",{d:"M9 17H7A5 5 0 0 1 7 7h2",key:"8i5ue5"}],["path",{d:"M15 7h2a5 5 0 1 1 0 10h-2",key:"1b9ql8"}],["line",{x1:"8",x2:"16",y1:"12",y2:"12",key:"1jonct"}]],De=$("link-2",Is);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ss=[["path",{d:"M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z",key:"1s2grr"}],["path",{d:"M20 2v4",key:"1rf3ol"}],["path",{d:"M22 4h-4",key:"gwowj6"}],["circle",{cx:"4",cy:"20",r:"2",key:"6kqj1y"}]],Ls=$("sparkles",Ss),Le={};let B=null;function Re(){const s=Le==null?void 0:Le.VITE_API_URL;return s&&typeof s=="string"&&s.trim()?s.trim().replace(/\/+$/,""):""}function D(s){return Re()+s}function js(s,r){const t=s.trimStart();return(r??"").includes("text/html")||t.startsWith("<!doctype")||t.startsWith("<html")}const Rs="The /api/install/* endpoints returned an HTML page instead of JSON — the installer is not talking to a Recura server. "+(Re()?`Check that the Recura server is running at ${Re()} and that VITE_API_URL points at its HTTPS origin (no trailing slash).`:"Set the VITE_API_URL build environment variable to the HTTPS origin of your hosted Recura server (e.g. https://your-server.onrender.com).");async function me(s,r){const t=await s.text();if(!t)return{};if(js(t,s.headers.get("content-type")))throw new Error(`${Rs} (${r} returned HTML with status ${s.status}.)`);try{return JSON.parse(t)}catch{throw new Error(`Unexpected server response (${s.status}). Reload the page and try again.`)}}async function ys(){if(B)return B;const s=await fetch(D("/api/csrf"),{method:"GET",credentials:"include"});if(!s.ok)throw new Error(`Could not reach the Recura server at ${D("/api/csrf")}. Is it running?`);const r=await me(s,"/api/csrf");if(B=(r==null?void 0:r.csrfToken)||null,!B)throw new Error("The Recura server did not issue a security token. Reload the page and try again.");return B}async function Y(s,r,t){const o={"Content-Type":"application/json","X-CSRF-Token":await ys()};t&&(o.Authorization=`Bearer ${t}`);let x;try{x=await fetch(D(s),{method:"POST",headers:o,credentials:"include",body:JSON.stringify(r??{})})}catch{throw new Error(`Could not reach the Recura server at ${D(s)}. Is it running?`)}const L=await me(x,s),l=L;if(!x.ok||l.ok===!1)throw l.code==="CSRF"&&(B=null),new Error(l.message||`Request failed (${x.status}).`);return L}const w={getStatus:async()=>{const s=await fetch(D("/api/install/status"),{credentials:"include"});if(!s.ok)throw new Error(`Could not reach the Recura server at ${D("/api/install/status")}. Is it running?`);return await me(s,"/api/install/status")},getDbPresets:async()=>{const s=await fetch(D("/api/install/presets"),{credentials:"include"});return s.ok?await me(s,"/api/install/presets"):{ok:!1,presets:[]}},testConnection:s=>Y("/api/install/test-connection",{database:s}),startInstall:(s,r,t,p,o=!1)=>Y("/api/install/start",{database:s,dbState:r,consent:t,resume:p,force:o}),migrate:s=>Y("/api/install/migrate",{},s),createAdmin:(s,r)=>Y("/api/install/admin",r,s),verify:s=>Y("/api/install/verify",{},s),complete:s=>Y("/api/install/complete",{},s)},ws=`-- =============================================================================
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
`,Cs=`-- =============================================================================
-- Recura — Migration 002: default WhatsApp templates (required config seed)
-- Derived from scripts/migrate_order_number_and_templates.sql and
-- scripts/migrate_add_thanks_client.sql. NOT demo/business data — these are the
-- default notification templates the app depends on. Idempotent.
-- =============================================================================

INSERT INTO "WhatsAppTemplate" ("language", "expiring3Days", "expired", "thanksClient") VALUES
('AR',
 'مرحباً {{name}}، نود تذكيركم بأن اشتراككم {{plan}} سينتهي بتاريخ {{date}}. يمكنكم تجديد الاشتراك أو الترقية في أي وقت. شكراً لثقتكم بنا.',
 'مرحباً {{name}}، لقد انتهت صلاحية اشتراككم {{plan}} بتاريخ {{date}}. يرجى التواصل معنا لتجديد الخدمة في أقرب وقت.',
 E'🎉 مرحباً بك في {STORE_NAME}!\\n\\nعزيزي {NAME}،\\n\\nتم تفعيل اشتراكك بنجاح.\\n\\n━━━━━━━━━━━━━━━━━━\\n📧 البريد الإلكتروني: {EMAIL}\\n🔑 كلمة المرور: {PASSWORD}\\n👤 الملف الشخصي: الملف {PROFILE_NUMBER}\\n🔐 رمز PIN: {PIN_CODE}\\n━━━━━━━━━━━━━━━━━━\\n📝 ملاحظات: {NOTES}\\n\\n⚠️ إرشادات مهمة\\n\\n• يرجى استخدام الملف الشخصي المخصص لك فقط.\\n• لا تقم بتغيير البريد الإلكتروني أو كلمة المرور.\\n• لا تقم بتغيير اسم الملف الشخصي أو صورته.\\n• لا تقم بتغيير رمز PIN.\\n• لا تقم بإنشاء ملفات شخصية إضافية.\\n• حافظ على سرية معلومات تسجيل الدخول الخاصة بك.'),
('FR',
 'Bonjour {{name}}, votre abonnement {{plan}} expirera le {{date}}. Vous pouvez le renouveler ou passer à une offre supérieure à tout moment. Merci pour votre confiance.',
 'Bonjour {{name}}, votre abonnement {{plan}} a expiré le {{date}}. Merci de nous contacter afin de renouveler votre service.',
 E'🎉 Bienvenue chez {STORE_NAME} !\\n\\nCher/Chère {NAME},\\n\\nVotre abonnement a été activé avec succès.\\n\\n━━━━━━━━━━━━━━━━━━\\n📧 Email : {EMAIL}\\n🔑 Mot de passe : {PASSWORD}\\n👤 Profil : Profil {PROFILE_NUMBER}\\n🔐 PIN : {PIN_CODE}\\n━━━━━━━━━━━━━━━━━━\\n📝 Notes : {NOTES}\\n\\n⚠️ Consignes importantes\\n\\n• Utilisez UNIQUEMENT le profil qui vous a été attribué.\\n• Ne modifiez PAS l''adresse e-mail ni le mot de passe.\\n• Ne modifiez PAS le nom ou l''avatar du profil.\\n• Ne modifiez PAS le code PIN.\\n• Ne créez PAS de profils supplémentaires.\\n• Gardez vos informations de connexion privées.'),
('EN',
 'Hello {{name}}, your {{plan}} subscription will expire on {{date}}. You may renew or upgrade your subscription at any time. Thank you for your trust.',
 'Hello {{name}}, your {{plan}} subscription expired on {{date}}. Please contact us to renew your service.',
 E'🎉 Welcome to {STORE_NAME}!\\n\\nHello {NAME},\\n\\nYour subscription has been successfully activated.\\n\\n━━━━━━━━━━━━━━━━━━\\n📧 Email: {EMAIL}\\n🔑 Password: {PASSWORD}\\n👤 Profile: Profile {PROFILE_NUMBER}\\n🔐 PIN: {PIN_CODE}\\n━━━━━━━━━━━━━━━━━━\\n📝 Notes: {NOTES}\\n\\n⚠️ Important Guidelines\\n\\n• Please use ONLY your assigned profile.\\n• Do NOT change the email or password.\\n• Do NOT change the profile name or avatar.\\n• Do NOT modify the PIN.\\n• Do NOT create additional profiles.\\n• Keep your login information private.')
ON CONFLICT ("language") DO NOTHING;
`,vs=`-- =============================================================================
-- Recura — Migration 003: data guards for partially-existing databases
-- Used when the installer detects an existing database that is only partially
-- structured (some tables present). Numbering legacy orders is safe and never
-- touches customer-provided data other than filling the orderNumber column.
-- =============================================================================

-- Backfill sequential order numbers for any order missing one (creation order).
UPDATE "Order" SET "orderNumber" = seq.rn FROM (
  SELECT "id", ROW_NUMBER() OVER (ORDER BY "createdAt" ASC, "id" ASC) AS rn
  FROM "Order"
) seq
WHERE "Order"."id" = seq."id" AND "Order"."orderNumber" IS NULL;
`,Us=`-- =============================================================================
-- Recura — Migration 004: mobile-app push notification tables
-- The companion mobile app registers device push tokens and logs push deliveries
-- in these tables. The web app does not read or write them, but they must exist
-- so a fresh install supports the mobile app too.
--
-- Schema mirrors the production database (push_events / push_log / push_tokens).
-- Idempotent, safe to re-run. RLS is intentionally left disabled (like the rest
-- of this schema) so the anon key has access; no GRANT/role statements are used
-- because the server installer can run against a plain PostgreSQL where the
-- anon/authenticated/service_role roles do not exist.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- push_events — queue of push-notification events for the mobile app
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS push_events (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "event_type" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "payload" JSONB,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_push_events_entity
    ON push_events ("entity_type", "entity_id", "created_at");

-- -----------------------------------------------------------------------------
-- push_log — dedup log of push notifications sent
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS push_log (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "milestone" TEXT NOT NULL,
    "sent_at" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    CONSTRAINT push_log_unique UNIQUE ("entity_type", "entity_id", "milestone")
);

-- -----------------------------------------------------------------------------
-- push_tokens — device tokens registered by the mobile app per user
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS push_tokens (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_email" TEXT NOT NULL,
    "device_token" TEXT NOT NULL,
    "platform" TEXT NOT NULL DEFAULT 'android',
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    "device_id" TEXT,
    "app_version" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_seen_at" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    CONSTRAINT push_tokens_device_token_key UNIQUE ("device_token")
);

CREATE INDEX IF NOT EXISTS idx_push_tokens_user_email ON push_tokens ("user_email");

-- -----------------------------------------------------------------------------
-- "UserRole" gains MANAGER (production schema has ADMIN, MANAGER, AGENT)
-- -----------------------------------------------------------------------------
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'UserRole' AND e.enumlabel = 'MANAGER'
  ) THEN
    ALTER TYPE "UserRole" ADD VALUE 'MANAGER';
  END IF;
END $$;
`,Os=`-- -----------------------------------------------------------------------------
-- Widen "Order"."pinCodeEncrypted"
--
-- PIN codes are stored AES-256-GCM encrypted ("enc_aes256_<iv>:<ct>"), which
-- exceeds the legacy VARCHAR(20) and made saving an order fail with
-- "value too long for type character varying(20)". TEXT matches the sibling
-- "accountPasswordEncrypted" column.
-- -----------------------------------------------------------------------------
ALTER TABLE IF EXISTS "Order" ALTER COLUMN "pinCodeEncrypted" TYPE TEXT;
`,_s=[ws,Cs,vs,Us,Os].join(`

`),Fs=`
-- ---------------------------------------------------------------------------
-- Supabase / hosted (PostgREST) access
-- Recura authenticates within the app, so the tables must be readable and
-- writable through the API key. Run this block if your provider enabled
-- row-level security (Supabase does by default).
-- ---------------------------------------------------------------------------
ALTER TABLE IF EXISTS "User" DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "Customer" DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "Plan" DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS service_accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "Order" DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "WhatsAppTemplate" DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "AuditLog" DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS push_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS push_log DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS push_tokens DISABLE ROW LEVEL SECURITY;
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
`,He=_s+Fs,Xe=["Welcome","Database","Install","Admin","Verify","Complete"],Ve={INSTALLED:{title:"Recura is already installed",body:"This server already has a configured database. The installer is locked to protect it.",tone:"ok"},INSTALLING:{title:"Installation was left in progress",body:"A previous installation did not finish. You can safely restart it — partial changes are rolled back or resumed automatically.",tone:"warn"},INSTALLATION_FAILED:{title:"The previous installation failed",body:"The installer can safely retry. Already-completed steps are skipped automatically.",tone:"err"},RECOVERY_REQUIRED:{title:"Recura needs recovery",body:"The server detects an inconsistent installation state. Restart the Recura server process and reload this page.",tone:"warn"}},ks={name:"",username:"",email:"",password:"",confirm:""},We=/^[a-zA-Z0-9_.-]+$/,Ye=/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/,Be={host:"",port:"5432",database:"",user:"",password:"",ssl:!1},Ms={host:"db",port:"5432",database:"recura",user:"recura",password:"recura",ssl:!1};function Qe(s){const r=s.trim();if(!/^postgres(ql)?:\/\//i.test(r))return{db:Be,error:"That does not look like a connection string. It should start with postgres:// or postgresql://"};let t;try{t=new URL(r)}catch{return{db:Be,error:"Could not read that connection string. Double-check it and try again."}}const p=(t.searchParams.get("sslmode")||"").toLowerCase(),o=["require","verify-ca","verify-full","prefer","true","1"].includes(p)||t.searchParams.get("ssl")==="true";return{db:{host:t.hostname,port:t.port||"5432",database:decodeURIComponent(t.pathname.replace(/^\//,"")),user:decodeURIComponent(t.username),password:decodeURIComponent(t.password),ssl:o}}}function $e(s){return/auth|password|28P01|password authentication/i.test(s)?"Double-check the username and password.":/could not reach|ECONNREFUSED|host and port/i.test(s)?"Check that the host and port are correct and that the database accepts remote connections.":/does not exist/i.test(s)?"Create the database first (your database provider has a button for that), then try again.":/privileges|permission/i.test(s)?"The database user needs permission to create tables. Choose a database with full access.":/timeout|timed out/i.test(s)?"The connection timed out. Check the host and port, and make sure your network allows it.":/ssl|certificate/i.test(s)?'Your database requires SSL. Turn on "Use SSL connection" and try again.':null}function Ps(){const[s,r]=i.useState(null),[t,p]=i.useState(null),[o,x]=i.useState(0),[L,l]=i.useState(null),[u,g]=i.useState(!1),[U,O]=i.useState({host:"",port:"5432",database:"",user:"",password:"",ssl:!1}),[f,_]=i.useState(null),[ae,G]=i.useState(!1),[H,ne]=i.useState(!1),[R,q]=i.useState(null),[re,Z]=i.useState(null),[E,le]=i.useState(ks),[xe,Ee]=i.useState(null),[I,F]=i.useState([]),[X,Ne]=i.useState(!1),[b,oe]=i.useState(!1),[ie,ce]=i.useState(""),[de,Te]=i.useState(null),[ue,Q]=i.useState("postgres"),[y,be]=i.useState(""),[k,M]=i.useState(""),[fe,T]=i.useState("idle"),[Ae,z]=i.useState(null),[ge,c]=i.useState(null),[Ie,K]=i.useState(!1),[d,j]=i.useState(!1),[J,Se]=i.useState(!1),[ze,Ke]=i.useState(null),[Ce,Je]=i.useState("");i.useEffect(()=>{w.getStatus().then(n=>r(n.status)).catch(n=>p(n.message)),w.getDbPresets().then(n=>{n.ok&&F(n.presets??[])}).catch(()=>{})},[]);const ee=t!==null;if(i.useEffect(()=>{ee&&Q("hosted")},[ee]),s===null&&!ee)return e.jsx(he,{children:e.jsxs(v,{children:[e.jsx(C,{className:"w-8 h-8 text-[#4A90FF] animate-spin mx-auto"}),e.jsx("p",{className:"text-xs text-slate-500 text-center mt-2",children:"Checking installation state…"})]})});if(s==="INSTALLED")return e.jsx(he,{children:e.jsx(Ge,{state:Ve.INSTALLED,children:e.jsx("a",{href:"/",className:"btn-primary w-full",children:"Open Recura"})})});if(s==="INSTALLING"||s==="INSTALLATION_FAILED"||s==="RECOVERY_REQUIRED"){const n=Ve[s];return e.jsx(he,{children:e.jsx(Ge,{state:n,children:e.jsx("button",{className:"btn-primary w-full",onClick:()=>{r("NOT_INSTALLED"),x(1)},children:s==="INSTALLATION_FAILED"?"Retry Installation":s==="RECOVERY_REQUIRED"?"I have restarted the server":"Restart Installation"})})})}return e.jsx(he,{children:e.jsxs("div",{className:"w-full max-w-2xl mx-auto space-y-5",children:[ee&&e.jsxs("div",{className:"flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-bold text-amber-900",children:[e.jsx(S,{className:"w-4 h-4 text-amber-500 shrink-0 mt-0.5"}),e.jsxs("div",{className:"space-y-1",children:[e.jsx("p",{children:"No Recura server is reachable at this address."}),e.jsx("p",{className:"font-semibold text-amber-800/80 leading-relaxed",children:"You can still install Recura with a hosted database below — that option runs entirely in this browser and needs no server. (Self-hosting needs a running Recura server; see the README.)"})]})]}),e.jsx("div",{className:"flex items-center justify-center gap-1.5 flex-wrap",children:Xe.map((n,a)=>e.jsxs("div",{className:"flex items-center gap-1.5",children:[e.jsxs("div",{className:"flex items-center gap-1.5",children:[e.jsx("span",{className:`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold transition-colors ${a<o?"bg-emerald-500 text-white":a===o?"bg-[#4A90FF] text-white":"bg-slate-200 text-slate-500"}`,children:a<o?e.jsx(pe,{className:"w-3.5 h-3.5"}):a+1}),e.jsx("span",{className:`text-[11px] font-bold hidden sm:block ${a===o?"text-[#111827]":"text-slate-400"}`,children:n})]}),a<Xe.length-1&&e.jsx("div",{className:"w-6 h-px bg-slate-200"})]},n))}),L&&e.jsxs("div",{className:"p-3 bg-rose-50 border border-rose-200 text-rose-900 rounded-2xl text-xs flex items-start gap-2.5 font-medium",children:[e.jsx(S,{className:"w-4 h-4 text-rose-500 shrink-0 mt-0.5"}),e.jsx("p",{className:"font-bold text-rose-950",children:L})]}),o===0&&e.jsx(Ds,{onNext:()=>x(1)}),o===1&&e.jsx(Hs,{db:U,setDb:O,test:f,testing:ae,consent:H,setConsent:ne,onTest:ve,onNext:ns,busy:u,presets:I,useEnv:X,setUseEnv:Ne,connOpen:b,setConnOpen:oe,connString:ie,setConnString:ce,connError:de,setConnError:Te,onDbChange:()=>{_(null),l(null)},backend:ue,setBackend:Q,serverAvailable:!ee,hostedUrl:y,setHostedUrl:be,hostedKey:k,setHostedKey:M,hostedState:fe,hostedError:ge,setHostedError:c,hostedResult:Ae,hostedBusy:Ie,hostedAdminExists:d,hostedCopied:J,setHostedCopied:Se,hostedGraphqlEndpoint:ze,graphqlConnString:Ce,setGraphqlConnString:Je,onGraphqlConnString:ss,onHostedTest:es,onHostedAdmin:ts,onHostedFinish:as,admin:E,setAdmin:le}),o===2&&e.jsx(Xs,{migrations:re,onNext:()=>x(3)}),o===3&&e.jsx(Vs,{admin:E,setAdmin:le,busy:u,onSubmit:ls}),o===4&&e.jsx(Ws,{result:xe,onNext:is,busy:u}),o===5&&e.jsx(Ys,{hosted:ue==="hosted"})]})});async function ve(n){l(null);const a=n&&typeof n=="object"&&typeof n.host=="string"?n:U;if(!X&&(!a.host||!a.database||!a.user)){l("Host, database name and username are required to test the connection.");return}G(!0),_(null);try{const m=await w.testConnection(X?{...a,useEnvDatabase:!0}:a);_(m),m.ok||l(m.message||"Connection test failed.")}catch(m){l(m instanceof Error?m.message:"Connection test failed.")}finally{G(!1)}}async function es(){l(null);const n=y.trim(),a=k.trim();if(!n){T("error"),c("Please paste the database API URL.");return}if(!/^https:\/\/.+/i.test(n)&&!/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(n)){T("error"),c("The API URL must start with https:// (or http://localhost for local development).");return}T("testing"),c(null),z(null);try{const m=_e(n,a),{data:A,error:V}=await m.get("User",{select:"id, role",limit:1});if(V){if(/PGRST205|Could not find the table|relation .* does not exist|undefined_table/i.test(V.message)){T("schema-missing"),c(V.message);return}const[Oe,W]=await Promise.all([cs(n,a),ds(n,a)]);if(Oe.isGraphql){T("graphql"),c(null),Ke(Oe.endpoint??null);return}if(W.isPostgrest){T("schema-missing"),c(V.message);return}T("error"),c(`We couldn't identify the connection method for this address (HTTP ${W.status}${W.contentType?`, ${W.contentType}`:""}). Paste the connection string your database provider gave you (it starts with postgres://) and Recura will install it automatically.`+(W.message?` (${W.message})`:""));return}const P=(A??[]).some(Ue=>Ue.role==="ADMIN");j(P),T("ok"),z(P?"Connected. An administrator already exists, so the installation is complete.":"Connected and the schema is ready — create your administrator account below.")}catch(m){T("error"),c(m instanceof Error?m.message:"Could not reach the database API.")}}function ss(){const{db:n,error:a}=Qe(Ce);if(a){c(a);return}O(n),Q("postgres"),T("idle"),c(null),_(null),l(null),ve(n)}async function ts(){const n=E.name.trim(),a=E.username.trim(),m=E.email.trim();if(!n)return c("Full name is required.");if(a.length<3||a.length>40||/\s/.test(a)||!We.test(a))return c("Username must be 3–40 characters using letters, numbers, _ , - or . only.");if(!Ye.test(m))return c("Please enter a valid email address.");if(E.password.length<6)return c("Password must be at least 6 characters.");if(E.password!==E.confirm)return c("Passwords do not match.");K(!0),c(null);try{const A=await us(E.password),V=_e(y.trim(),k.trim()),{error:P}=await V.insert("User",[{name:n,username:a,email:m.toLowerCase(),passwordHash:A,role:"ADMIN",currency:"USD ($)"}]);if(P){/duplicate|unique|23505/i.test(P.message)?c("That email or username is already in use. Choose another one."):/row.?level security|permission denied|is not allowed|42501/i.test(P.message)?c('The API key is blocked by row-level security (RLS) on the Recura tables — Supabase enables it by default. Open the SQL Editor, run the "Supabase / hosted access" block from the schema, then try again.'):c(`Could not create the administrator account: ${P.message}`);return}Fe({provider:"postgrest",url:y.trim(),key:k.trim()}),x(5)}catch(A){c(A instanceof Error?A.message:"Could not create the administrator account.")}finally{K(!1)}}function as(){Fe({provider:"postgrest",url:y.trim(),key:k.trim()}),x(5)}async function ns(){if(!(f!=null&&f.ok)||!f.state)return;if((f.state==="partial"||f.state==="unrelated"||f.state==="complete"&&f.migrated!==!0)&&!H){l("Please confirm that you authorize installing Recura into the selected database.");return}g(!0),l(null);try{const a=await w.startInstall(X?{...U,useEnvDatabase:!0}:U,f.state,H,!1);if(!a.installToken){l(a.message||"Could not start the installation.");return}q(a.installToken),g(!1),x(2),await rs(a.installToken)}catch(a){g(!1),l(a instanceof Error?a.message:"Could not start the installation.")}}async function rs(n){g(!0),l(null);try{const a=await w.migrate(n);if(!a.ok||!a.result){l(a.message||"Installing the database schema failed.");return}Z({applied:a.result.applied.map(m=>m.name),total:a.result.applied.length+a.result.alreadyApplied.length}),x(3)}catch(a){l(a instanceof Error?a.message:"Installing the database schema failed.")}finally{g(!1)}}async function ls(){const n=E.name.trim(),a=E.username.trim(),m=E.email.trim();if(!n)return l("Full name is required.");if(a.length<3||a.length>40||/\s/.test(a)||!We.test(a))return l("Username must be 3–40 characters using letters, numbers, _ , - or . only.");if(!Ye.test(m))return l("Please enter a valid email address.");if(E.password.length<6)return l("Password must be at least 6 characters.");if(E.password!==E.confirm)return l("Passwords do not match.");g(!0),l(null);try{const A=await w.createAdmin(R,{name:n,username:a,email:m,password:E.password});if(!A.ok){l(A.message||"Could not create the administrator account.");return}await os()}catch(A){l(A instanceof Error?A.message:"Could not create the administrator account.")}finally{g(!1)}}async function os(){l(null);try{const n=await w.verify(R);Ee(n),x(4)}catch(n){l(n instanceof Error?n.message:"Verification failed.")}}async function is(){g(!0),l(null);try{const n=await w.complete(R);if(!n.ok){l(n.message||"Could not complete the installation.");return}x(5)}catch(n){l(n instanceof Error?n.message:"Could not complete the installation.")}finally{g(!1)}}}function he({children:s}){return e.jsxs("div",{className:"min-h-screen bg-[#F5F7FA] flex items-center justify-center p-4 relative overflow-hidden",children:[e.jsx("div",{className:"absolute top-0 right-1/4 w-96 h-96 bg-blue-100/50 rounded-full blur-3xl pointer-events-none"}),e.jsx("div",{className:"absolute bottom-0 left-1/4 w-96 h-96 bg-slate-200/50 rounded-full blur-3xl pointer-events-none"}),e.jsxs("div",{className:"w-full max-w-2xl relative z-10 space-y-6",children:[e.jsxs("div",{className:"text-center flex flex-col items-center justify-center",children:[e.jsx("div",{className:"inline-flex items-center justify-center mb-2",children:e.jsx(hs,{className:"w-16 h-16 drop-shadow-sm"})}),e.jsx(ms,{className:"text-3xl"}),e.jsx("p",{className:"text-[11px] font-bold text-slate-400 mt-1 tracking-wide uppercase",children:"Automatic Installer"})]}),s]})]})}function v({children:s}){return e.jsx("div",{className:"bg-white border border-[#E8EAF0] rounded-3xl p-7 shadow-xl space-y-4",children:s})}function Ge({state:s,children:r}){const t=s.tone==="ok"?"text-emerald-500":s.tone==="warn"?"text-amber-500":"text-rose-500";return e.jsxs(v,{children:[s.tone==="ok"?e.jsx(se,{className:`w-8 h-8 ${t} mx-auto`}):e.jsx(S,{className:`w-8 h-8 ${t} mx-auto`}),e.jsx("h1",{className:"text-lg font-extrabold text-[#111827] text-center",children:s.title}),e.jsx("p",{className:"text-xs text-slate-500 text-center leading-relaxed",children:s.body}),r]})}function te({children:s}){return e.jsx("div",{className:"border-b border-slate-100 pb-3 flex items-center justify-between",children:e.jsx("h2",{className:"text-base font-extrabold text-[#111827]",children:s})})}function N({label:s,children:r}){return e.jsxs("div",{children:[e.jsx("label",{className:"block text-[#111827] font-extrabold mb-1.5 text-xs",children:s}),r]})}const h="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E8EAF0] text-[#111827] rounded-xl font-medium text-xs focus:outline-none focus:bg-white focus:border-[#4A90FF] focus:ring-2 focus:ring-blue-100 transition-all";function Ds({onNext:s}){const r=[{icon:je,title:"Your data stays yours",body:"Recura is installed on your own database — your data is never stored in the browser or on a third party."},{icon:Ls,title:"Almost no setup",body:"The wizard finds the easiest path for you: paste a connection string, use the database your hosting created, or fill in a few fields."},{icon:ye,title:"Protected after install",body:"The installer locks itself once you finish. Your data stays on your server."}];return e.jsxs(v,{children:[e.jsx(te,{children:"Welcome to Recura"}),e.jsx("p",{className:"text-xs text-slate-500 leading-relaxed",children:"This short wizard connects Recura to a database, installs everything it needs, and creates your first administrator account. It takes about 2 minutes and there is nothing technical to understand."}),e.jsx("div",{className:"space-y-3",children:r.map(({icon:t,title:p,body:o})=>e.jsxs("div",{className:"flex items-start gap-3 p-3.5 bg-[#F8FAFC] rounded-2xl border border-[#E8EAF0]",children:[e.jsx(t,{className:"w-5 h-5 text-[#4A90FF] shrink-0 mt-0.5"}),e.jsxs("div",{children:[e.jsx("p",{className:"text-xs font-extrabold text-[#111827]",children:p}),e.jsx("p",{className:"text-[11px] text-slate-500 mt-0.5 leading-relaxed",children:o})]})]},p))}),e.jsxs("div",{className:"p-3.5 bg-blue-50/60 border border-blue-200 rounded-2xl space-y-1.5",children:[e.jsxs("p",{className:"text-[11px] font-extrabold text-[#111827] flex items-center gap-1.5",children:[e.jsx(Ze,{className:"w-3.5 h-3.5 text-[#4A90FF]"})," What you will need"]}),e.jsxs("p",{className:"text-[11px] text-slate-600 leading-relaxed",children:["One of: ",e.jsx("span",{className:"font-bold text-slate-800",children:"a hosted database REST API"})," (no server needed — any PostgreSQL, e.g. Supabase), ",e.jsx("span",{className:"font-bold text-slate-800",children:"a database your hosting already created"}),","," ",e.jsx("span",{className:"font-bold text-slate-800",children:"a connection string"})," from a free database provider (",e.jsx("a",{className:"text-[#4A90FF] font-bold underline",href:"https://neon.tech",target:"_blank",rel:"noreferrer",children:"Neon"}),","," ",e.jsx("a",{className:"text-[#4A90FF] font-bold underline",href:"https://supabase.com",target:"_blank",rel:"noreferrer",children:"Supabase"}),","," ",e.jsx("a",{className:"text-[#4A90FF] font-bold underline",href:"https://render.com",target:"_blank",rel:"noreferrer",children:"Render"}),"), or"," ",e.jsx("span",{className:"font-bold text-slate-800",children:"a few connection details"}),". Plus an email and a password for your login."]})]}),e.jsxs("button",{className:"btn-primary w-full",onClick:s,children:["Begin Installation ",e.jsx(we,{className:"w-4 h-4"})]})]})}function Hs({db:s,setDb:r,test:t,testing:p,consent:o,setConsent:x,onTest:L,onNext:l,busy:u,presets:g,useEnv:U,setUseEnv:O,connOpen:f,setConnOpen:_,connString:ae,setConnString:G,connError:H,setConnError:ne,onDbChange:R,backend:q,setBackend:re,serverAvailable:Z,hostedUrl:E,setHostedUrl:le,hostedKey:xe,setHostedKey:Ee,hostedState:I,hostedError:F,setHostedError:X,hostedResult:Ne,hostedBusy:b,hostedAdminExists:oe,hostedCopied:ie,setHostedCopied:ce,hostedGraphqlEndpoint:de,graphqlConnString:Te,setGraphqlConnString:ue,onGraphqlConnString:Q,onHostedTest:y,onHostedAdmin:be,onHostedFinish:k,admin:M,setAdmin:fe}){var K;const T=d=>j=>{const J=d==="ssl"?j.target.checked:j.target.value;O(!1),R(),r(Se=>({...Se,[d]:J}))},Ae=()=>{const{db:d,error:j}=Qe(ae);ne(j??null),j||(O(!1),R(),r(d),_(!1),G(""))},z=(t==null?void 0:t.ok)&&(t.state==="partial"||t.state==="unrelated"||t.state==="complete"&&t.migrated!==!0),ge=(t==null?void 0:t.ok)===!0&&(!z||o),c=d=>j=>fe(J=>({...J,[d]:j.target.value})),Ie=async()=>{try{await navigator.clipboard.writeText(He),ce(!0),window.setTimeout(()=>ce(!1),2500)}catch{}};return e.jsxs(v,{children:[e.jsx(te,{children:"Database Connection"}),e.jsx("p",{className:"text-xs text-slate-500 leading-relaxed",children:Z?"Recura stores everything in a PostgreSQL database. Pick the option that fits you best.":"Recura stores everything in a PostgreSQL database. No server is reachable here, so use a hosted database — it works entirely from this browser."}),Z&&e.jsxs("div",{className:"grid grid-cols-1 sm:grid-cols-2 gap-3",children:[e.jsxs("button",{className:`text-left rounded-2xl border-2 p-4 transition-all ${q==="postgres"?"border-[#4A90FF] bg-blue-50/60":"border-[#E8EAF0] bg-[#F8FAFC] hover:border-slate-300"}`,onClick:()=>re("postgres"),disabled:u,children:[e.jsx(je,{className:"w-5 h-5 text-[#4A90FF]"}),e.jsx("p",{className:"text-xs font-extrabold text-[#111827] mt-2",children:"Self-hosted (Recommended)"}),e.jsx("p",{className:"text-[11px] text-slate-500 mt-1 leading-relaxed",children:"Your own PostgreSQL, installed by the Recura server."})]}),e.jsxs("button",{className:`text-left rounded-2xl border-2 p-4 transition-all ${q==="hosted"?"border-[#4A90FF] bg-blue-50/60":"border-[#E8EAF0] bg-[#F8FAFC] hover:border-slate-300"}`,onClick:()=>re("hosted"),disabled:u,children:[e.jsx(Pe,{className:"w-5 h-5 text-[#4A90FF]"}),e.jsx("p",{className:"text-xs font-extrabold text-[#111827] mt-2",children:"Hosted database (REST API)"}),e.jsx("p",{className:"text-[11px] text-slate-500 mt-1 leading-relaxed",children:"PostgreSQL over a PostgREST REST API (e.g. Supabase) — no server to manage."})]})]}),q==="hosted"?e.jsx("div",{className:"space-y-4",children:e.jsxs("div",{className:"p-4 bg-[#F8FAFC] border border-[#E8EAF0] rounded-2xl space-y-3",children:[e.jsxs("p",{className:"text-[11px] text-slate-500 leading-relaxed",children:["Works with any PostgreSQL served through a PostgREST API — including Supabase. For Supabase, paste ",e.jsx("span",{className:"font-bold",children:"https://<project>.supabase.co/rest/v1"})," and the"," ",e.jsx("span",{className:"font-bold",children:"anon public key"})," from ",e.jsx("span",{className:"font-mono",children:"Project Settings → API"}),". For a self-hosted PostgREST server, use its URL. Only public credentials are used — they stay in this browser. This option speaks PostgREST; if your provider exposes GraphQL (Nhost, Hasura), the wizard detects it and guides you to the connection-string route instead."]}),e.jsx(N,{label:"Database API URL",children:e.jsx("input",{className:h,placeholder:"https://your-database.example.com",value:E,onChange:d=>le(d.target.value),disabled:b})}),e.jsx(N,{label:"API key (optional)",children:e.jsx("input",{className:h,type:"password",autoComplete:"off",placeholder:"anon public key — leave empty for open access",value:xe,onChange:d=>Ee(d.target.value),disabled:b})}),e.jsxs("button",{className:"btn-secondary w-full",onClick:y,disabled:b||I==="testing",children:[I==="testing"?e.jsx(C,{className:"w-4 h-4 animate-spin"}):e.jsx(Pe,{className:"w-4 h-4"}),I==="testing"?"Checking…":"Verify connection & schema"]}),I==="error"&&e.jsxs("div",{className:"flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-bold text-rose-800",children:[e.jsx(S,{className:"w-4 h-4 text-rose-500 shrink-0 mt-0.5"})," ",F]}),I==="schema-missing"&&e.jsxs("div",{className:"space-y-3 rounded-2xl border border-amber-200 bg-amber-50 p-4",children:[e.jsxs("div",{className:"flex items-start gap-2.5 text-xs font-bold text-amber-900",children:[e.jsx(S,{className:"w-4 h-4 text-amber-500 shrink-0 mt-0.5"}),e.jsxs("span",{children:["The database is reachable but the Recura schema is not installed yet. Open your database's SQL console (for Supabase: ",e.jsx("span",{className:"font-mono",children:"SQL Editor"}),"), paste the schema below, run it, then verify again.",e.jsx("br",{}),e.jsx("span",{className:"font-normal text-amber-700",children:"For Supabase, the last block also disables row-level security so the API key can read and write — required for the hosted option."}),e.jsx("br",{}),e.jsx("span",{className:"font-normal text-amber-700",children:'Need to start over with a different provider? Use the "Self-hosted (PostgreSQL)" backend instead.'})]})]}),e.jsx("textarea",{className:h,readOnly:!0,rows:8,value:He,spellCheck:!1}),e.jsxs("div",{className:"flex flex-col sm:flex-row gap-2",children:[e.jsxs("button",{className:"btn-primary flex-1 !py-2 text-xs",onClick:Ie,children:[ie?e.jsx(fs,{className:"w-4 h-4"}):e.jsx(ps,{className:"w-4 h-4"}),ie?"Copied":"Copy the schema"]}),e.jsxs("button",{className:"btn-secondary flex-1 !py-2 text-xs",onClick:y,disabled:b,children:[e.jsx(xs,{className:"w-4 h-4"})," I ran it — check again"]})]})]}),I==="graphql"&&e.jsxs("div",{className:"space-y-3 rounded-2xl border border-blue-200 bg-blue-50 p-4",children:[e.jsxs("div",{className:"flex items-start gap-2.5 text-xs font-bold text-blue-900",children:[e.jsx(De,{className:"w-4 h-4 text-blue-500 shrink-0 mt-0.5"}),e.jsxs("span",{children:["This looks like a ",e.jsx("span",{className:"font-extrabold",children:"GraphQL"})," database API",de?` (${de})`:""," — for example Nhost or Hasura. The hosted-database option connects through PostgREST, so it can't talk to this endpoint directly."]})]}),Z?e.jsxs(e.Fragment,{children:[e.jsxs("p",{className:"text-[11px] text-blue-700 leading-relaxed",children:["No problem — Recura installs its database over plain PostgreSQL. Paste the"," ",e.jsx("span",{className:"font-bold",children:"Postgres connection string"})," your provider gives you (Nhost: Dashboard → Settings → Database) and we'll continue automatically."]}),e.jsx(N,{label:"Postgres connection string",children:e.jsx("textarea",{className:h,rows:3,placeholder:"postgresql://user:password@host:5432/database?sslmode=require",value:Te,onChange:d=>{ue(d.target.value),X(null)},disabled:b})}),F&&e.jsxs("div",{className:"flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-bold text-rose-800",children:[e.jsx(S,{className:"w-4 h-4 text-rose-500 shrink-0 mt-0.5"})," ",F]}),e.jsxs("button",{className:"btn-primary w-full !py-2 text-xs",onClick:Q,disabled:b,children:[e.jsx(Me,{className:"w-4 h-4"})," Install with this connection string"]})]}):e.jsx("p",{className:"text-[11px] text-blue-700 leading-relaxed",children:"No Recura server is reachable from this page, and the browser-only hosted option only works with a PostgREST endpoint (e.g. Supabase). Try a PostgREST URL instead, or open this installer from your Recura server."})]}),I==="ok"&&e.jsxs("div",{className:"flex items-start gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs font-bold text-emerald-800",children:[e.jsx(se,{className:"w-5 h-5 text-emerald-500 shrink-0"})," ",Ne]}),I==="ok"&&oe&&e.jsxs("button",{className:"btn-primary w-full",onClick:k,children:[e.jsx(ye,{className:"w-4 h-4"})," Finish installation"]}),I==="ok"&&!oe&&e.jsxs("div",{className:"space-y-3 border-t border-[#E8EAF0] pt-4",children:[e.jsx("p",{className:"text-xs font-extrabold text-[#111827]",children:"Administrator Account"}),e.jsx(N,{label:"Full Name",children:e.jsx("input",{className:h,placeholder:"System Owner",value:M.name,onChange:c("name"),disabled:b})}),e.jsx(N,{label:"Username",children:e.jsx("input",{className:h,autoComplete:"username",placeholder:"admin",value:M.username,onChange:c("username"),disabled:b})}),e.jsx(N,{label:"Email",children:e.jsx("input",{className:h,type:"email",autoComplete:"email",placeholder:"admin@example.com",value:M.email,onChange:c("email"),disabled:b})}),e.jsxs("div",{className:"grid grid-cols-1 sm:grid-cols-2 gap-3",children:[e.jsx(N,{label:"Password",children:e.jsx("input",{className:h,type:"password",autoComplete:"new-password",value:M.password,onChange:c("password"),disabled:b})}),e.jsx(N,{label:"Confirm Password",children:e.jsx("input",{className:h,type:"password",autoComplete:"new-password",value:M.confirm,onChange:c("confirm"),disabled:b})})]}),F&&e.jsxs("div",{className:"flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-bold text-rose-800",children:[e.jsx(S,{className:"w-4 h-4 text-rose-500 shrink-0 mt-0.5"})," ",F]}),e.jsxs("button",{className:"btn-primary w-full",onClick:be,disabled:b,children:[b?e.jsx(C,{className:"w-4 h-4 animate-spin"}):e.jsx(qe,{className:"w-4 h-4"}),b?"Creating…":"Create administrator & finish"]})]})]})}):e.jsxs(e.Fragment,{children:[e.jsxs("div",{className:"space-y-2.5",children:[g.map(d=>e.jsxs("div",{className:"flex items-start gap-3 p-3.5 bg-blue-50/60 border border-blue-200 rounded-2xl",children:[e.jsx(je,{className:"w-5 h-5 text-[#4A90FF] shrink-0 mt-0.5"}),e.jsxs("div",{className:"flex-1 min-w-0",children:[e.jsx("p",{className:"text-xs font-extrabold text-[#111827]",children:d.label}),d.hint&&e.jsx("p",{className:"text-[11px] text-slate-500 mt-0.5 leading-relaxed",children:d.hint})]}),e.jsx("button",{className:"btn-primary !px-4 !py-2 text-[11px] shrink-0",onClick:()=>{O(!0),R()},disabled:u,children:"Use it"})]},d.id)),e.jsxs("div",{className:"flex items-start gap-3 p-3.5 bg-[#F8FAFC] rounded-2xl border border-[#E8EAF0]",children:[e.jsx(ke,{className:"w-5 h-5 text-[#4A90FF] shrink-0 mt-0.5"}),e.jsxs("div",{className:"flex-1 min-w-0",children:[e.jsx("p",{className:"text-xs font-extrabold text-[#111827]",children:"Using Docker?"}),e.jsxs("p",{className:"text-[11px] text-slate-500 mt-0.5 leading-relaxed",children:["If you started Recura with ",e.jsx("code",{className:"font-mono",children:"docker compose up"}),", a database is already included."]})]}),e.jsx("button",{className:"btn-secondary !px-4 !py-2 text-[11px] shrink-0",onClick:()=>{O(!1),R(),r(Ms)},disabled:u,children:"Fill it in"})]}),e.jsxs("button",{className:"w-full flex items-center justify-center gap-2 text-xs font-extrabold text-[#4A90FF] hover:text-[#2f74e6] transition-colors py-1",onClick:()=>_(d=>!d),disabled:u,children:[e.jsx(De,{className:"w-4 h-4"})," ",f?"Hide connection string":"I have a connection string instead"]})]}),f&&e.jsxs("div",{className:"space-y-3 p-4 bg-[#F8FAFC] border border-[#E8EAF0] rounded-2xl",children:[e.jsxs("p",{className:"text-[11px] text-slate-500 leading-relaxed",children:["Your database provider (Neon, Supabase, Render, …) gives you a connection string that starts with"," ",e.jsx("code",{className:"font-mono",children:"postgres://"}),". Paste it here and we will fill in the fields for you."]}),e.jsx("textarea",{className:h,rows:3,placeholder:"postgresql://user:password@host:5432/database?sslmode=require",value:ae,onChange:d=>{G(d.target.value),ne(null)},disabled:u}),H&&e.jsx("p",{className:"text-[11px] font-bold text-rose-700",children:H}),e.jsxs("button",{className:"btn-primary w-full !py-2 text-xs",onClick:Ae,disabled:u,children:[e.jsx(Me,{className:"w-4 h-4"})," Fill in the fields from this string"]})]}),U?e.jsxs("div",{className:"p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl space-y-1.5",children:[e.jsxs("div",{className:"flex items-center gap-2 text-xs font-extrabold text-emerald-800",children:[e.jsx(pe,{className:"w-4 h-4 text-emerald-500"})," Using the hosting database"]}),e.jsx("p",{className:"text-[11px] text-slate-600 leading-relaxed",children:"The server will connect using the database configured by your hosting provider. There is nothing to fill in — just test the connection below."})]}):e.jsxs("div",{className:"grid grid-cols-2 gap-3",children:[e.jsx("div",{className:"col-span-2 sm:col-span-1",children:e.jsx(N,{label:"Host",children:e.jsx("input",{className:h,placeholder:"db.example.com",value:s.host,onChange:T("host"),disabled:u})})}),e.jsx("div",{className:"col-span-1",children:e.jsx(N,{label:"Port",children:e.jsx("input",{className:h,type:"number",placeholder:"5432",value:s.port,onChange:T("port"),disabled:u})})}),e.jsx("div",{className:"col-span-2",children:e.jsx(N,{label:"Database Name",children:e.jsx("input",{className:h,placeholder:"recura",value:s.database,onChange:T("database"),disabled:u})})}),e.jsx("div",{className:"col-span-2 sm:col-span-1",children:e.jsx(N,{label:"Username",children:e.jsx("input",{className:h,autoComplete:"username",placeholder:"postgres",value:s.user,onChange:T("user"),disabled:u})})}),e.jsx("div",{className:"col-span-2 sm:col-span-1",children:e.jsx(N,{label:"Password",children:e.jsx("input",{className:h,type:"password",autoComplete:"current-password",value:s.password,onChange:T("password"),disabled:u})})})]}),e.jsxs("label",{className:"flex items-center gap-2.5 text-xs font-bold text-slate-600 cursor-pointer select-none",children:[e.jsx("input",{type:"checkbox",checked:s.ssl,onChange:T("ssl"),className:"w-4 h-4 accent-[#4A90FF]",disabled:u||U}),"Use SSL connection",e.jsx("span",{className:"inline-flex items-center gap-1 text-slate-400 font-semibold",title:"Cloud databases (Neon, Supabase, Render, Railway) usually need this. Local databases usually do not.",children:e.jsx(Ze,{className:"w-3.5 h-3.5"})})]}),e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsxs("button",{className:"btn-secondary",onClick:L,disabled:p||u,children:[p?e.jsx(C,{className:"w-4 h-4 animate-spin"}):e.jsx(ke,{className:"w-4 h-4"}),p?"Testing…":"Test Connection"]}),e.jsx("span",{className:"text-[11px] text-slate-400 font-semibold",children:"We check the connection before installing anything."})]}),t&&e.jsx("div",{className:`rounded-2xl border p-4 text-xs space-y-2 ${t.ok?"bg-emerald-50/60 border-emerald-200":"bg-rose-50 border-rose-200"}`,children:t.ok?e.jsxs(e.Fragment,{children:[e.jsxs("div",{className:"flex items-center gap-2 font-extrabold text-emerald-800",children:[e.jsx(se,{className:"w-4 h-4 text-emerald-500"})," Connected"]}),e.jsxs("div",{className:"grid grid-cols-2 gap-x-4 gap-y-1.5 text-slate-600",children:[e.jsxs("div",{className:"flex justify-between",children:[e.jsx("span",{children:"Server"}),e.jsx("span",{className:"font-bold text-slate-800",children:((K=t.serverVersion)==null?void 0:K.split(" on ")[0])??"unknown"})]}),e.jsxs("div",{className:"flex justify-between",children:[e.jsx("span",{children:"Supported (PG 13+)"}),e.jsx("span",{className:`font-bold ${t.versionSupported?"text-emerald-600":"text-rose-600"}`,children:t.versionSupported?"Yes":"No"})]}),e.jsxs("div",{className:"flex justify-between",children:[e.jsx("span",{children:"Can create tables"}),e.jsx("span",{className:`font-bold ${t.canCreateTables?"text-emerald-600":"text-rose-600"}`,children:t.canCreateTables?"Yes":"No"})]}),e.jsxs("div",{className:"flex justify-between",children:[e.jsx("span",{children:"Database state"}),e.jsx("span",{className:"font-bold text-slate-800",children:t.state})]})]}),t.existingTables&&t.existingTables.length>0&&e.jsxs("p",{className:"text-slate-600",children:["Existing Recura tables: ",e.jsx("span",{className:"font-bold",children:t.existingTables.join(", ")})]}),t.unrelatedTables&&t.unrelatedTables.length>0&&e.jsxs("p",{className:"text-slate-600",children:["Unrelated tables found (up to 20 shown): ",e.jsx("span",{className:"font-bold",children:t.unrelatedTables.join(", ")})]})]}):e.jsxs("div",{className:"space-y-1.5",children:[e.jsxs("div",{className:"flex items-center gap-2 font-bold text-rose-800",children:[e.jsx(S,{className:"w-4 h-4 text-rose-500"})," ",t.message||"Connection failed."]}),$e(t.message||"")&&e.jsxs("p",{className:"text-rose-700/80 font-semibold",children:["Tip: ",$e(t.message||"")]})]})}),z&&e.jsxs("label",{className:"flex items-start gap-2.5 text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 rounded-2xl p-3.5 cursor-pointer select-none",children:[e.jsx("input",{type:"checkbox",checked:o,onChange:d=>x(d.target.checked),className:"w-4 h-4 accent-amber-500 mt-0.5",disabled:u}),e.jsx("span",{children:"This database already contains tables. I confirm that I own or administer it and authorize installing Recura here. No existing data will be deleted."})]}),e.jsxs("button",{className:"btn-primary w-full",onClick:l,disabled:!ge||u,children:["Continue ",e.jsx(we,{className:"w-4 h-4"})]})]})]})}function Xs({migrations:s,onNext:r}){return e.jsxs(v,{children:[e.jsx(te,{children:"Installing the Database"}),s===null?e.jsxs("div",{className:"flex items-center gap-3 text-xs font-bold text-slate-600 py-6 justify-center",children:[e.jsx(C,{className:"w-5 h-5 animate-spin text-[#4A90FF]"})," Installing schema… this may take a moment."]}):e.jsxs("div",{className:"space-y-3",children:[e.jsx("p",{className:"text-xs text-slate-500",children:"The schema, default templates and data guards were applied successfully:"}),e.jsx("div",{className:"space-y-2",children:s.applied.map(t=>e.jsxs("div",{className:"flex items-center gap-2.5 p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800",children:[e.jsx(pe,{className:"w-4 h-4 text-emerald-500"})," ",t]},t))}),e.jsxs("p",{className:"text-xs text-slate-400 font-semibold",children:[s.total," migration file(s) processed."]}),e.jsxs("button",{className:"btn-primary w-full",onClick:r,children:["Create Administrator ",e.jsx(we,{className:"w-4 h-4"})]})]})]})}function Vs({admin:s,setAdmin:r,busy:t,onSubmit:p}){const o=x=>L=>r(l=>({...l,[x]:L.target.value}));return e.jsxs(v,{children:[e.jsx(te,{children:"Administrator Account"}),e.jsx("p",{className:"text-xs text-slate-500 leading-relaxed",children:"Create the first account. It will have Administrator rights and is the account you will use to log in."}),e.jsxs("div",{className:"space-y-3",children:[e.jsx(N,{label:"Full Name",children:e.jsx("input",{className:h,placeholder:"System Owner",value:s.name,onChange:o("name"),disabled:t})}),e.jsx(N,{label:"Username",children:e.jsx("input",{className:h,autoComplete:"username",placeholder:"admin",value:s.username,onChange:o("username"),disabled:t})}),e.jsx(N,{label:"Email",children:e.jsx("input",{className:h,type:"email",autoComplete:"email",placeholder:"admin@example.com",value:s.email,onChange:o("email"),disabled:t})}),e.jsxs("div",{className:"grid grid-cols-1 sm:grid-cols-2 gap-3",children:[e.jsx(N,{label:"Password",children:e.jsx("input",{className:h,type:"password",autoComplete:"new-password",value:s.password,onChange:o("password"),disabled:t})}),e.jsx(N,{label:"Confirm Password",children:e.jsx("input",{className:h,type:"password",autoComplete:"new-password",value:s.confirm,onChange:o("confirm"),disabled:t})})]})]}),e.jsxs("button",{className:"btn-primary w-full",onClick:p,disabled:t,children:[t?e.jsx(C,{className:"w-4 h-4 animate-spin"}):e.jsx(qe,{className:"w-4 h-4"}),t?"Creating…":"Create & Verify"]})]})}function Ws({result:s,onNext:r,busy:t}){var p;return e.jsxs(v,{children:[e.jsx(te,{children:"Verification"}),s===null?e.jsxs("div",{className:"flex items-center gap-3 text-xs font-bold text-slate-600 py-6 justify-center",children:[e.jsx(C,{className:"w-5 h-5 animate-spin text-[#4A90FF]"})," Verifying installation…"]}):s.ok?e.jsxs("div",{className:"space-y-3",children:[e.jsxs("div",{className:"flex items-center gap-2.5 p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-2xl text-xs font-extrabold text-emerald-800",children:[e.jsx(se,{className:"w-5 h-5 text-emerald-500"})," All checks passed"]}),e.jsx("div",{className:"space-y-1.5",children:(p=s.checks)==null?void 0:p.map(o=>e.jsxs("div",{className:"flex items-center justify-between text-xs p-2.5 bg-[#F8FAFC] rounded-xl",children:[e.jsx("span",{className:"font-bold text-slate-700",children:o.table}),e.jsxs("span",{className:"flex items-center gap-1.5 font-semibold text-slate-500",children:[o.ok?e.jsx(pe,{className:"w-3.5 h-3.5 text-emerald-500"}):e.jsx(S,{className:"w-3.5 h-3.5 text-rose-500"}),o.rows," row(s)"]})]},o.table))}),s.adminEmail&&e.jsxs("p",{className:"text-xs text-slate-500",children:["Administrator ready: ",e.jsx("span",{className:"font-bold text-slate-800",children:s.adminEmail})]}),e.jsxs("button",{className:"btn-primary w-full",onClick:r,disabled:t,children:[t?e.jsx(C,{className:"w-4 h-4 animate-spin"}):e.jsx(ye,{className:"w-4 h-4"}),t?"Finalizing…":"Finish Installation"]})]}):e.jsxs("div",{className:"space-y-3",children:[e.jsxs("div",{className:"flex items-center gap-2.5 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-bold text-rose-800",children:[e.jsx(S,{className:"w-5 h-5 text-rose-500"})," Verification failed. Go back and check the installation."]}),e.jsx("button",{className:"btn-secondary w-full",onClick:()=>window.location.reload(),children:"Reload"})]})]})}function Ys({hosted:s=!1}){return e.jsxs(v,{children:[e.jsx(se,{className:"w-10 h-10 text-emerald-500 mx-auto"}),e.jsx("h1",{className:"text-lg font-extrabold text-[#111827] text-center",children:"Installation Complete"}),e.jsx("p",{className:"text-xs text-slate-500 text-center leading-relaxed",children:s?"Recura is connected to your hosted database. The app now talks to it directly — no server to manage. Log in with the administrator account you just created.":"Recura is installed and its installer is now locked. Log in with the administrator account you just created."}),e.jsxs("a",{href:"/",className:"btn-primary w-full",children:[e.jsx(Es,{className:"w-4 h-4"})," Go to Log in"]})]})}Ns.createRoot(document.getElementById("root")).render(e.jsx(i.StrictMode,{children:e.jsx(Ps,{})}));
