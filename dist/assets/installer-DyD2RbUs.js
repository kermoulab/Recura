import{c as q,b as i,j as e,f as _,T as S,C as me,B as we,E as es,z as ss,F as Se,u as ts,w as as,i as Q,S as ge,a as je,l as Ie,h as ns,k as rs,K as De,D as Le,L as ls,A as os}from"./index-BLTA0mg0.js";/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const is=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3",key:"1u773s"}],["path",{d:"M12 17h.01",key:"p32p05"}]],He=q("circle-question-mark",is);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const cs=[["rect",{width:"8",height:"4",x:"8",y:"2",rx:"1",ry:"1",key:"tgr4d6"}],["path",{d:"M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2",key:"116196"}],["path",{d:"m9 14 2 2 4-4",key:"df797q"}]],ds=q("clipboard-check",cs);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const us=[["path",{d:"M11 14h10",key:"1w8e9d"}],["path",{d:"M16 4h2a2 2 0 0 1 2 2v1.344",key:"1e62lh"}],["path",{d:"m17 18 4-4-4-4",key:"z2g111"}],["path",{d:"M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 1.793-1.113",key:"bjbb7m"}],["rect",{x:"8",y:"2",width:"8",height:"4",rx:"1",key:"ublpy"}]],ms=q("clipboard-paste",us);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const hs=[["path",{d:"M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z",key:"p7xjir"}]],Ce=q("cloud",hs);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ps=[["path",{d:"M9 17H7A5 5 0 0 1 7 7h2",key:"8i5ue5"}],["path",{d:"M15 7h2a5 5 0 1 1 0 10h-2",key:"1b9ql8"}],["line",{x1:"8",x2:"16",y1:"12",y2:"12",key:"1jonct"}]],xs=q("link-2",ps);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ns=[["path",{d:"M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z",key:"1s2grr"}],["path",{d:"M20 2v4",key:"1rf3ol"}],["path",{d:"M22 4h-4",key:"gwowj6"}],["circle",{cx:"4",cy:"20",r:"2",key:"6kqj1y"}]],Es=q("sparkles",Ns),fe={};let Y=null;function Ae(){const s=fe==null?void 0:fe.VITE_API_URL;return s&&typeof s=="string"&&s.trim()?s.trim().replace(/\/+$/,""):""}function M(s){return Ae()+s}function Ts(s,r){const t=s.trimStart();return(r??"").includes("text/html")||t.startsWith("<!doctype")||t.startsWith("<html")}const bs="The /api/install/* endpoints returned an HTML page instead of JSON — the installer is not talking to a Recura server. "+(Ae()?`Check that the Recura server is running at ${Ae()} and that VITE_API_URL points at its HTTPS origin (no trailing slash).`:"Set the VITE_API_URL build environment variable to the HTTPS origin of your hosted Recura server (e.g. https://your-server.onrender.com).");async function ue(s,r){const t=await s.text();if(!t)return{};if(Ts(t,s.headers.get("content-type")))throw new Error(`${bs} (${r} returned HTML with status ${s.status}.)`);try{return JSON.parse(t)}catch{throw new Error(`Unexpected server response (${s.status}). Reload the page and try again.`)}}async function fs(){if(Y)return Y;const s=await fetch(M("/api/csrf"),{method:"GET",credentials:"include"});if(!s.ok)throw new Error(`Could not reach the Recura server at ${M("/api/csrf")}. Is it running?`);const r=await ue(s,"/api/csrf");if(Y=(r==null?void 0:r.csrfToken)||null,!Y)throw new Error("The Recura server did not issue a security token. Reload the page and try again.");return Y}async function W(s,r,t){const o={"Content-Type":"application/json","X-CSRF-Token":await fs()};t&&(o.Authorization=`Bearer ${t}`);let p;try{p=await fetch(M(s),{method:"POST",headers:o,credentials:"include",body:JSON.stringify(r??{})})}catch{throw new Error(`Could not reach the Recura server at ${M(s)}. Is it running?`)}const y=await ue(p,s),l=y;if(!p.ok||l.ok===!1)throw l.code==="CSRF"&&(Y=null),new Error(l.message||`Request failed (${p.status}).`);return y}const U={getStatus:async()=>{const s=await fetch(M("/api/install/status"),{credentials:"include"});if(!s.ok)throw new Error(`Could not reach the Recura server at ${M("/api/install/status")}. Is it running?`);return await ue(s,"/api/install/status")},getDbPresets:async()=>{const s=await fetch(M("/api/install/presets"),{credentials:"include"});return s.ok?await ue(s,"/api/install/presets"):{ok:!1,presets:[]}},testConnection:s=>W("/api/install/test-connection",{database:s}),startInstall:(s,r,t,h,o=!1)=>W("/api/install/start",{database:s,dbState:r,consent:t,resume:h,force:o}),migrate:s=>W("/api/install/migrate",{},s),createAdmin:(s,r)=>W("/api/install/admin",r,s),verify:s=>W("/api/install/verify",{},s),complete:s=>W("/api/install/complete",{},s)},gs=`-- =============================================================================
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
    "pinCodeEncrypted" VARCHAR(20),
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
`,As=`-- =============================================================================
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
`,js=`-- =============================================================================
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
`,Is=`-- =============================================================================
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
`,ve=[gs,As,js,Is].join(`

`),Ue=["Welcome","Database","Install","Admin","Verify","Complete"],_e={INSTALLED:{title:"Recura is already installed",body:"This server already has a configured database. The installer is locked to protect it.",tone:"ok"},INSTALLING:{title:"Installation was left in progress",body:"A previous installation did not finish. You can safely restart it — partial changes are rolled back or resumed automatically.",tone:"warn"},INSTALLATION_FAILED:{title:"The previous installation failed",body:"The installer can safely retry. Already-completed steps are skipped automatically.",tone:"err"},RECOVERY_REQUIRED:{title:"Recura needs recovery",body:"The server detects an inconsistent installation state. Restart the Recura server process and reload this page.",tone:"warn"}},Rs={name:"",username:"",email:"",password:"",confirm:""},Oe=/^[a-zA-Z0-9_.-]+$/,Fe=/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/,Me={host:"",port:"5432",database:"",user:"",password:"",ssl:!1},ys={host:"db",port:"5432",database:"recura",user:"recura",password:"recura",ssl:!1};function ws(s){const r=s.trim();if(!/^postgres(ql)?:\/\//i.test(r))return{db:Me,error:"That does not look like a connection string. It should start with postgres:// or postgresql://"};let t;try{t=new URL(r)}catch{return{db:Me,error:"Could not read that connection string. Double-check it and try again."}}const h=(t.searchParams.get("sslmode")||"").toLowerCase(),o=["require","verify-ca","verify-full","prefer","true","1"].includes(h)||t.searchParams.get("ssl")==="true";return{db:{host:t.hostname,port:t.port||"5432",database:decodeURIComponent(t.pathname.replace(/^\//,"")),user:decodeURIComponent(t.username),password:decodeURIComponent(t.password),ssl:o}}}function ke(s){return/auth|password|28P01|password authentication/i.test(s)?"Double-check the username and password.":/could not reach|ECONNREFUSED|host and port/i.test(s)?"Check that the host and port are correct and that the database accepts remote connections.":/does not exist/i.test(s)?"Create the database first (your database provider has a button for that), then try again.":/privileges|permission/i.test(s)?"The database user needs permission to create tables. Choose a database with full access.":/timeout|timed out/i.test(s)?"The connection timed out. Check the host and port, and make sure your network allows it.":/ssl|certificate/i.test(s)?'Your database requires SSL. Turn on "Use SSL connection" and try again.':null}function Ss(){const[s,r]=i.useState(null),[t,h]=i.useState(null),[o,p]=i.useState(0),[y,l]=i.useState(null),[d,A]=i.useState(!1),[j,k]=i.useState({host:"",port:"5432",database:"",user:"",password:"",ssl:!1}),[T,P]=i.useState(null),[J,B]=i.useState(!1),[D,ee]=i.useState(!1),[L,G]=i.useState(null),[se,te]=i.useState(null),[x,ae]=i.useState(Rs),[he,pe]=i.useState(null),[I,Z]=i.useState([]),[H,E]=i.useState(!1),[ne,re]=i.useState(!1),[le,oe]=i.useState(""),[xe,Ne]=i.useState(null),[C,ie]=i.useState("postgres"),[b,Ee]=i.useState(""),[v,Te]=i.useState(""),[F,R]=i.useState("idle"),[ce,c]=i.useState(null),[w,u]=i.useState(null),[be,Re]=i.useState(!1),[Xe,Ve]=i.useState(!1),[$e,We]=i.useState(!1);i.useEffect(()=>{U.getStatus().then(a=>r(a.status)).catch(a=>h(a.message)),U.getDbPresets().then(a=>{a.ok&&Z(a.presets??[])}).catch(()=>{})},[]);const z=t!==null;if(i.useEffect(()=>{z&&ie("hosted")},[z]),s===null&&!z)return e.jsx(de,{children:e.jsxs(O,{children:[e.jsx(_,{className:"w-8 h-8 text-[#4A90FF] animate-spin mx-auto"}),e.jsx("p",{className:"text-xs text-slate-500 text-center mt-2",children:"Checking installation state…"})]})});if(s==="INSTALLED")return e.jsx(de,{children:e.jsx(Pe,{state:_e.INSTALLED,children:e.jsx("a",{href:"/",className:"btn-primary w-full",children:"Open Recura"})})});if(s==="INSTALLING"||s==="INSTALLATION_FAILED"||s==="RECOVERY_REQUIRED"){const a=_e[s];return e.jsx(de,{children:e.jsx(Pe,{state:a,children:e.jsx("button",{className:"btn-primary w-full",onClick:()=>{r("NOT_INSTALLED"),p(1)},children:s==="INSTALLATION_FAILED"?"Retry Installation":s==="RECOVERY_REQUIRED"?"I have restarted the server":"Restart Installation"})})})}return e.jsx(de,{children:e.jsxs("div",{className:"w-full max-w-2xl mx-auto space-y-5",children:[z&&e.jsxs("div",{className:"flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-bold text-amber-900",children:[e.jsx(S,{className:"w-4 h-4 text-amber-500 shrink-0 mt-0.5"}),e.jsxs("div",{className:"space-y-1",children:[e.jsx("p",{children:"No Recura server is reachable at this address."}),e.jsx("p",{className:"font-semibold text-amber-800/80 leading-relaxed",children:"You can still install Recura with a hosted database below — that option runs entirely in this browser and needs no server. (Self-hosting needs a running Recura server; see the README.)"})]})]}),e.jsx("div",{className:"flex items-center justify-center gap-1.5 flex-wrap",children:Ue.map((a,n)=>e.jsxs("div",{className:"flex items-center gap-1.5",children:[e.jsxs("div",{className:"flex items-center gap-1.5",children:[e.jsx("span",{className:`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold transition-colors ${n<o?"bg-emerald-500 text-white":n===o?"bg-[#4A90FF] text-white":"bg-slate-200 text-slate-500"}`,children:n<o?e.jsx(me,{className:"w-3.5 h-3.5"}):n+1}),e.jsx("span",{className:`text-[11px] font-bold hidden sm:block ${n===o?"text-[#111827]":"text-slate-400"}`,children:a})]}),n<Ue.length-1&&e.jsx("div",{className:"w-6 h-px bg-slate-200"})]},a))}),y&&e.jsxs("div",{className:"p-3 bg-rose-50 border border-rose-200 text-rose-900 rounded-2xl text-xs flex items-start gap-2.5 font-medium",children:[e.jsx(S,{className:"w-4 h-4 text-rose-500 shrink-0 mt-0.5"}),e.jsx("p",{className:"font-bold text-rose-950",children:y})]}),o===0&&e.jsx(Ls,{onNext:()=>p(1)}),o===1&&e.jsx(Cs,{db:j,setDb:k,test:T,testing:J,consent:D,setConsent:ee,onTest:Ye,onNext:Ze,busy:d,presets:I,useEnv:H,setUseEnv:E,connOpen:ne,setConnOpen:re,connString:le,setConnString:oe,connError:xe,setConnError:Ne,onDbChange:()=>{P(null),l(null)},backend:C,setBackend:ie,serverAvailable:!z,hostedUrl:b,setHostedUrl:Ee,hostedKey:v,setHostedKey:Te,hostedState:F,hostedError:w,hostedResult:ce,hostedBusy:be,hostedAdminExists:Xe,hostedCopied:$e,setHostedCopied:We,onHostedTest:qe,onHostedAdmin:Be,onHostedFinish:Ge,admin:x,setAdmin:ae}),o===2&&e.jsx(vs,{migrations:se,onNext:()=>p(3)}),o===3&&e.jsx(Us,{admin:x,setAdmin:ae,busy:d,onSubmit:Qe}),o===4&&e.jsx(_s,{result:he,onNext:Je,busy:d}),o===5&&e.jsx(Os,{hosted:C==="hosted"})]})});async function Ye(){if(l(null),!H&&(!j.host||!j.database||!j.user)){l("Host, database name and username are required to test the connection.");return}B(!0),P(null);try{const a=await U.testConnection(H?{...j,useEnvDatabase:!0}:j);P(a),a.ok||l(a.message||"Connection test failed.")}catch(a){l(a instanceof Error?a.message:"Connection test failed.")}finally{B(!1)}}async function qe(){l(null);const a=b.trim(),n=v.trim();if(!a){R("error"),u("Please paste the database API URL.");return}if(!/^https:\/\/.+/i.test(a)&&!/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(a)){R("error"),u("The API URL must start with https:// (or http://localhost for local development).");return}R("testing"),u(null),c(null);try{const f=we(a,n),{data:g,error:X}=await f.get("User",{select:"id, role",limit:1});if(X){if(/PGRST205|Could not find the table|relation .* does not exist|undefined_table/i.test(X.message)){R("schema-missing"),u(X.message);return}const $=await es(a,n);if(!$.isPostgrest){R("error"),u(`This URL does not answer like a PostgREST database API (HTTP ${$.status}${$.contentType?`, ${$.contentType}`:""}). The hosted option needs a PostgREST-compatible endpoint, e.g. https://<project>.supabase.co/rest/v1 or a self-hosted PostgREST server. GraphQL-only providers such as Nhost are not supported here.`+($.message?` (${$.message})`:""));return}R("schema-missing"),u(X.message);return}const V=(g??[]).some(ye=>ye.role==="ADMIN");Ve(V),R("ok"),c(V?"Connected. An administrator already exists, so the installation is complete.":"Connected and the schema is ready — create your administrator account below.")}catch(f){R("error"),u(f instanceof Error?f.message:"Could not reach the database API.")}}async function Be(){const a=x.name.trim(),n=x.username.trim(),f=x.email.trim();if(!a)return u("Full name is required.");if(n.length<3||n.length>40||/\s/.test(n)||!Oe.test(n))return u("Username must be 3–40 characters using letters, numbers, _ , - or . only.");if(!Fe.test(f))return u("Please enter a valid email address.");if(x.password.length<6)return u("Password must be at least 6 characters.");if(x.password!==x.confirm)return u("Passwords do not match.");Re(!0),u(null);try{const g=await ss(x.password),X=we(b.trim(),v.trim()),{error:V}=await X.insert("User",[{name:a,username:n,email:f.toLowerCase(),passwordHash:g,role:"ADMIN",currency:"USD ($)"}]);if(V){/duplicate|unique|23505/i.test(V.message)?u("That email or username is already in use. Choose another one."):u(`Could not create the administrator account: ${V.message}`);return}Se({provider:"postgrest",url:b.trim(),key:v.trim()}),p(5)}catch(g){u(g instanceof Error?g.message:"Could not create the administrator account.")}finally{Re(!1)}}function Ge(){Se({provider:"postgrest",url:b.trim(),key:v.trim()}),p(5)}async function Ze(){if(!(T!=null&&T.ok)||!T.state)return;if((T.state==="partial"||T.state==="unrelated"||T.state==="complete"&&T.migrated!==!0)&&!D){l("Please confirm that you authorize installing Recura into the selected database.");return}A(!0),l(null);try{const n=await U.startInstall(H?{...j,useEnvDatabase:!0}:j,T.state,D,!1);if(!n.installToken){l(n.message||"Could not start the installation.");return}G(n.installToken),A(!1),p(2),await ze(n.installToken)}catch(n){A(!1),l(n instanceof Error?n.message:"Could not start the installation.")}}async function ze(a){A(!0),l(null);try{const n=await U.migrate(a);if(!n.ok||!n.result){l(n.message||"Installing the database schema failed.");return}te({applied:n.result.applied.map(f=>f.name),total:n.result.applied.length+n.result.alreadyApplied.length}),p(3)}catch(n){l(n instanceof Error?n.message:"Installing the database schema failed.")}finally{A(!1)}}async function Qe(){const a=x.name.trim(),n=x.username.trim(),f=x.email.trim();if(!a)return l("Full name is required.");if(n.length<3||n.length>40||/\s/.test(n)||!Oe.test(n))return l("Username must be 3–40 characters using letters, numbers, _ , - or . only.");if(!Fe.test(f))return l("Please enter a valid email address.");if(x.password.length<6)return l("Password must be at least 6 characters.");if(x.password!==x.confirm)return l("Passwords do not match.");A(!0),l(null);try{const g=await U.createAdmin(L,{name:a,username:n,email:f,password:x.password});if(!g.ok){l(g.message||"Could not create the administrator account.");return}await Ke()}catch(g){l(g instanceof Error?g.message:"Could not create the administrator account.")}finally{A(!1)}}async function Ke(){l(null);try{const a=await U.verify(L);pe(a),p(4)}catch(a){l(a instanceof Error?a.message:"Verification failed.")}}async function Je(){A(!0),l(null);try{const a=await U.complete(L);if(!a.ok){l(a.message||"Could not complete the installation.");return}p(5)}catch(a){l(a instanceof Error?a.message:"Could not complete the installation.")}finally{A(!1)}}}function de({children:s}){return e.jsxs("div",{className:"min-h-screen bg-[#F5F7FA] flex items-center justify-center p-4 relative overflow-hidden",children:[e.jsx("div",{className:"absolute top-0 right-1/4 w-96 h-96 bg-blue-100/50 rounded-full blur-3xl pointer-events-none"}),e.jsx("div",{className:"absolute bottom-0 left-1/4 w-96 h-96 bg-slate-200/50 rounded-full blur-3xl pointer-events-none"}),e.jsxs("div",{className:"w-full max-w-2xl relative z-10 space-y-6",children:[e.jsxs("div",{className:"text-center flex flex-col items-center justify-center",children:[e.jsx("div",{className:"inline-flex items-center justify-center mb-2",children:e.jsx(ts,{className:"w-16 h-16 drop-shadow-sm"})}),e.jsx(as,{className:"text-3xl"}),e.jsx("p",{className:"text-[11px] font-bold text-slate-400 mt-1 tracking-wide uppercase",children:"Automatic Installer"})]}),s]})]})}function O({children:s}){return e.jsx("div",{className:"bg-white border border-[#E8EAF0] rounded-3xl p-7 shadow-xl space-y-4",children:s})}function Pe({state:s,children:r}){const t=s.tone==="ok"?"text-emerald-500":s.tone==="warn"?"text-amber-500":"text-rose-500";return e.jsxs(O,{children:[s.tone==="ok"?e.jsx(Q,{className:`w-8 h-8 ${t} mx-auto`}):e.jsx(S,{className:`w-8 h-8 ${t} mx-auto`}),e.jsx("h1",{className:"text-lg font-extrabold text-[#111827] text-center",children:s.title}),e.jsx("p",{className:"text-xs text-slate-500 text-center leading-relaxed",children:s.body}),r]})}function K({children:s}){return e.jsx("div",{className:"border-b border-slate-100 pb-3 flex items-center justify-between",children:e.jsx("h2",{className:"text-base font-extrabold text-[#111827]",children:s})})}function N({label:s,children:r}){return e.jsxs("div",{children:[e.jsx("label",{className:"block text-[#111827] font-extrabold mb-1.5 text-xs",children:s}),r]})}const m="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E8EAF0] text-[#111827] rounded-xl font-medium text-xs focus:outline-none focus:bg-white focus:border-[#4A90FF] focus:ring-2 focus:ring-blue-100 transition-all";function Ls({onNext:s}){const r=[{icon:ge,title:"Your data stays yours",body:"Recura is installed on your own database — your data is never stored in the browser or on a third party."},{icon:Es,title:"Almost no setup",body:"The wizard finds the easiest path for you: paste a connection string, use the database your hosting created, or fill in a few fields."},{icon:je,title:"Protected after install",body:"The installer locks itself once you finish. Your data stays on your server."}];return e.jsxs(O,{children:[e.jsx(K,{children:"Welcome to Recura"}),e.jsx("p",{className:"text-xs text-slate-500 leading-relaxed",children:"This short wizard connects Recura to a database, installs everything it needs, and creates your first administrator account. It takes about 2 minutes and there is nothing technical to understand."}),e.jsx("div",{className:"space-y-3",children:r.map(({icon:t,title:h,body:o})=>e.jsxs("div",{className:"flex items-start gap-3 p-3.5 bg-[#F8FAFC] rounded-2xl border border-[#E8EAF0]",children:[e.jsx(t,{className:"w-5 h-5 text-[#4A90FF] shrink-0 mt-0.5"}),e.jsxs("div",{children:[e.jsx("p",{className:"text-xs font-extrabold text-[#111827]",children:h}),e.jsx("p",{className:"text-[11px] text-slate-500 mt-0.5 leading-relaxed",children:o})]})]},h))}),e.jsxs("div",{className:"p-3.5 bg-blue-50/60 border border-blue-200 rounded-2xl space-y-1.5",children:[e.jsxs("p",{className:"text-[11px] font-extrabold text-[#111827] flex items-center gap-1.5",children:[e.jsx(He,{className:"w-3.5 h-3.5 text-[#4A90FF]"})," What you will need"]}),e.jsxs("p",{className:"text-[11px] text-slate-600 leading-relaxed",children:["One of: ",e.jsx("span",{className:"font-bold text-slate-800",children:"a hosted database REST API"})," (no server needed — any PostgreSQL, e.g. Supabase), ",e.jsx("span",{className:"font-bold text-slate-800",children:"a database your hosting already created"}),","," ",e.jsx("span",{className:"font-bold text-slate-800",children:"a connection string"})," from a free database provider (",e.jsx("a",{className:"text-[#4A90FF] font-bold underline",href:"https://neon.tech",target:"_blank",rel:"noreferrer",children:"Neon"}),","," ",e.jsx("a",{className:"text-[#4A90FF] font-bold underline",href:"https://supabase.com",target:"_blank",rel:"noreferrer",children:"Supabase"}),","," ",e.jsx("a",{className:"text-[#4A90FF] font-bold underline",href:"https://render.com",target:"_blank",rel:"noreferrer",children:"Render"}),"), or"," ",e.jsx("span",{className:"font-bold text-slate-800",children:"a few connection details"}),". Plus an email and a password for your login."]})]}),e.jsxs("button",{className:"btn-primary w-full",onClick:s,children:["Begin Installation ",e.jsx(Ie,{className:"w-4 h-4"})]})]})}function Cs({db:s,setDb:r,test:t,testing:h,consent:o,setConsent:p,onTest:y,onNext:l,busy:d,presets:A,useEnv:j,setUseEnv:k,connOpen:T,setConnOpen:P,connString:J,setConnString:B,connError:D,setConnError:ee,onDbChange:L,backend:G,setBackend:se,serverAvailable:te,hostedUrl:x,setHostedUrl:ae,hostedKey:he,setHostedKey:pe,hostedState:I,hostedError:Z,hostedResult:H,hostedBusy:E,hostedAdminExists:ne,hostedCopied:re,setHostedCopied:le,onHostedTest:oe,onHostedAdmin:xe,onHostedFinish:Ne,admin:C,setAdmin:ie}){var ce;const b=c=>w=>{const u=c==="ssl"?w.target.checked:w.target.value;k(!1),L(),r(be=>({...be,[c]:u}))},Ee=()=>{const{db:c,error:w}=ws(J);ee(w??null),w||(k(!1),L(),r(c),P(!1),B(""))},v=(t==null?void 0:t.ok)&&(t.state==="partial"||t.state==="unrelated"||t.state==="complete"&&t.migrated!==!0),Te=(t==null?void 0:t.ok)===!0&&(!v||o),F=c=>w=>ie(u=>({...u,[c]:w.target.value})),R=async()=>{try{await navigator.clipboard.writeText(ve),le(!0),window.setTimeout(()=>le(!1),2500)}catch{}};return e.jsxs(O,{children:[e.jsx(K,{children:"Database Connection"}),e.jsx("p",{className:"text-xs text-slate-500 leading-relaxed",children:te?"Recura stores everything in a PostgreSQL database. Pick the option that fits you best.":"Recura stores everything in a PostgreSQL database. No server is reachable here, so use a hosted database — it works entirely from this browser."}),te&&e.jsxs("div",{className:"grid grid-cols-1 sm:grid-cols-2 gap-3",children:[e.jsxs("button",{className:`text-left rounded-2xl border-2 p-4 transition-all ${G==="postgres"?"border-[#4A90FF] bg-blue-50/60":"border-[#E8EAF0] bg-[#F8FAFC] hover:border-slate-300"}`,onClick:()=>se("postgres"),disabled:d,children:[e.jsx(ge,{className:"w-5 h-5 text-[#4A90FF]"}),e.jsx("p",{className:"text-xs font-extrabold text-[#111827] mt-2",children:"Self-hosted (Recommended)"}),e.jsx("p",{className:"text-[11px] text-slate-500 mt-1 leading-relaxed",children:"Your own PostgreSQL, installed by the Recura server."})]}),e.jsxs("button",{className:`text-left rounded-2xl border-2 p-4 transition-all ${G==="hosted"?"border-[#4A90FF] bg-blue-50/60":"border-[#E8EAF0] bg-[#F8FAFC] hover:border-slate-300"}`,onClick:()=>se("hosted"),disabled:d,children:[e.jsx(Ce,{className:"w-5 h-5 text-[#4A90FF]"}),e.jsx("p",{className:"text-xs font-extrabold text-[#111827] mt-2",children:"Hosted database (REST API)"}),e.jsx("p",{className:"text-[11px] text-slate-500 mt-1 leading-relaxed",children:"PostgreSQL over a PostgREST REST API (e.g. Supabase) — no server to manage."})]})]}),G==="hosted"?e.jsx("div",{className:"space-y-4",children:e.jsxs("div",{className:"p-4 bg-[#F8FAFC] border border-[#E8EAF0] rounded-2xl space-y-3",children:[e.jsxs("p",{className:"text-[11px] text-slate-500 leading-relaxed",children:["Works with any PostgreSQL served through a PostgREST API — including Supabase. For Supabase, paste ",e.jsx("span",{className:"font-bold",children:"https://<project>.supabase.co/rest/v1"})," and the"," ",e.jsx("span",{className:"font-bold",children:"anon public key"})," from ",e.jsx("span",{className:"font-mono",children:"Project Settings → API"}),". For a self-hosted PostgREST server, use its URL. Only public credentials are used — they stay in this browser. The endpoint must speak PostgREST — GraphQL-only providers such as Nhost are not supported here."]}),e.jsx(N,{label:"Database API URL",children:e.jsx("input",{className:m,placeholder:"https://your-database.example.com",value:x,onChange:c=>ae(c.target.value),disabled:E})}),e.jsx(N,{label:"API key (optional)",children:e.jsx("input",{className:m,type:"password",autoComplete:"off",placeholder:"anon public key — leave empty for open access",value:he,onChange:c=>pe(c.target.value),disabled:E})}),e.jsxs("button",{className:"btn-secondary w-full",onClick:oe,disabled:E||I==="testing",children:[I==="testing"?e.jsx(_,{className:"w-4 h-4 animate-spin"}):e.jsx(Ce,{className:"w-4 h-4"}),I==="testing"?"Checking…":"Verify connection & schema"]}),I==="error"&&e.jsxs("div",{className:"flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-bold text-rose-800",children:[e.jsx(S,{className:"w-4 h-4 text-rose-500 shrink-0 mt-0.5"})," ",Z]}),I==="schema-missing"&&e.jsxs("div",{className:"space-y-3 rounded-2xl border border-amber-200 bg-amber-50 p-4",children:[e.jsxs("div",{className:"flex items-start gap-2.5 text-xs font-bold text-amber-900",children:[e.jsx(S,{className:"w-4 h-4 text-amber-500 shrink-0 mt-0.5"}),e.jsxs("span",{children:["The database is reachable but the Recura schema is not installed yet. Open your database's SQL console (for Supabase: ",e.jsx("span",{className:"font-mono",children:"SQL Editor"}),"), paste the schema below, run it, then verify again.",e.jsx("br",{}),e.jsx("span",{className:"font-normal text-amber-700",children:`Seeing this on a provider like Nhost? The endpoint is not PostgREST, so it can't work with this option — use the "Self-hosted (PostgreSQL)" backend instead.`})]})]}),e.jsx("textarea",{className:m,readOnly:!0,rows:8,value:ve,spellCheck:!1}),e.jsxs("div",{className:"flex flex-col sm:flex-row gap-2",children:[e.jsxs("button",{className:"btn-primary flex-1 !py-2 text-xs",onClick:R,children:[re?e.jsx(ds,{className:"w-4 h-4"}):e.jsx(ns,{className:"w-4 h-4"}),re?"Copied":"Copy the schema"]}),e.jsxs("button",{className:"btn-secondary flex-1 !py-2 text-xs",onClick:oe,disabled:E,children:[e.jsx(rs,{className:"w-4 h-4"})," I ran it — check again"]})]})]}),I==="ok"&&e.jsxs("div",{className:"flex items-start gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs font-bold text-emerald-800",children:[e.jsx(Q,{className:"w-5 h-5 text-emerald-500 shrink-0"})," ",H]}),I==="ok"&&ne&&e.jsxs("button",{className:"btn-primary w-full",onClick:Ne,children:[e.jsx(je,{className:"w-4 h-4"})," Finish installation"]}),I==="ok"&&!ne&&e.jsxs("div",{className:"space-y-3 border-t border-[#E8EAF0] pt-4",children:[e.jsx("p",{className:"text-xs font-extrabold text-[#111827]",children:"Administrator Account"}),e.jsx(N,{label:"Full Name",children:e.jsx("input",{className:m,placeholder:"System Owner",value:C.name,onChange:F("name"),disabled:E})}),e.jsx(N,{label:"Username",children:e.jsx("input",{className:m,autoComplete:"username",placeholder:"admin",value:C.username,onChange:F("username"),disabled:E})}),e.jsx(N,{label:"Email",children:e.jsx("input",{className:m,type:"email",autoComplete:"email",placeholder:"admin@example.com",value:C.email,onChange:F("email"),disabled:E})}),e.jsxs("div",{className:"grid grid-cols-1 sm:grid-cols-2 gap-3",children:[e.jsx(N,{label:"Password",children:e.jsx("input",{className:m,type:"password",autoComplete:"new-password",value:C.password,onChange:F("password"),disabled:E})}),e.jsx(N,{label:"Confirm Password",children:e.jsx("input",{className:m,type:"password",autoComplete:"new-password",value:C.confirm,onChange:F("confirm"),disabled:E})})]}),Z&&e.jsxs("div",{className:"flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-bold text-rose-800",children:[e.jsx(S,{className:"w-4 h-4 text-rose-500 shrink-0 mt-0.5"})," ",Z]}),e.jsxs("button",{className:"btn-primary w-full",onClick:xe,disabled:E,children:[E?e.jsx(_,{className:"w-4 h-4 animate-spin"}):e.jsx(De,{className:"w-4 h-4"}),E?"Creating…":"Create administrator & finish"]})]})]})}):e.jsxs(e.Fragment,{children:[e.jsxs("div",{className:"space-y-2.5",children:[A.map(c=>e.jsxs("div",{className:"flex items-start gap-3 p-3.5 bg-blue-50/60 border border-blue-200 rounded-2xl",children:[e.jsx(ge,{className:"w-5 h-5 text-[#4A90FF] shrink-0 mt-0.5"}),e.jsxs("div",{className:"flex-1 min-w-0",children:[e.jsx("p",{className:"text-xs font-extrabold text-[#111827]",children:c.label}),c.hint&&e.jsx("p",{className:"text-[11px] text-slate-500 mt-0.5 leading-relaxed",children:c.hint})]}),e.jsx("button",{className:"btn-primary !px-4 !py-2 text-[11px] shrink-0",onClick:()=>{k(!0),L()},disabled:d,children:"Use it"})]},c.id)),e.jsxs("div",{className:"flex items-start gap-3 p-3.5 bg-[#F8FAFC] rounded-2xl border border-[#E8EAF0]",children:[e.jsx(Le,{className:"w-5 h-5 text-[#4A90FF] shrink-0 mt-0.5"}),e.jsxs("div",{className:"flex-1 min-w-0",children:[e.jsx("p",{className:"text-xs font-extrabold text-[#111827]",children:"Using Docker?"}),e.jsxs("p",{className:"text-[11px] text-slate-500 mt-0.5 leading-relaxed",children:["If you started Recura with ",e.jsx("code",{className:"font-mono",children:"docker compose up"}),", a database is already included."]})]}),e.jsx("button",{className:"btn-secondary !px-4 !py-2 text-[11px] shrink-0",onClick:()=>{k(!1),L(),r(ys)},disabled:d,children:"Fill it in"})]}),e.jsxs("button",{className:"w-full flex items-center justify-center gap-2 text-xs font-extrabold text-[#4A90FF] hover:text-[#2f74e6] transition-colors py-1",onClick:()=>P(c=>!c),disabled:d,children:[e.jsx(xs,{className:"w-4 h-4"})," ",T?"Hide connection string":"I have a connection string instead"]})]}),T&&e.jsxs("div",{className:"space-y-3 p-4 bg-[#F8FAFC] border border-[#E8EAF0] rounded-2xl",children:[e.jsxs("p",{className:"text-[11px] text-slate-500 leading-relaxed",children:["Your database provider (Neon, Supabase, Render, …) gives you a connection string that starts with"," ",e.jsx("code",{className:"font-mono",children:"postgres://"}),". Paste it here and we will fill in the fields for you."]}),e.jsx("textarea",{className:m,rows:3,placeholder:"postgresql://user:password@host:5432/database?sslmode=require",value:J,onChange:c=>{B(c.target.value),ee(null)},disabled:d}),D&&e.jsx("p",{className:"text-[11px] font-bold text-rose-700",children:D}),e.jsxs("button",{className:"btn-primary w-full !py-2 text-xs",onClick:Ee,disabled:d,children:[e.jsx(ms,{className:"w-4 h-4"})," Fill in the fields from this string"]})]}),j?e.jsxs("div",{className:"p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl space-y-1.5",children:[e.jsxs("div",{className:"flex items-center gap-2 text-xs font-extrabold text-emerald-800",children:[e.jsx(me,{className:"w-4 h-4 text-emerald-500"})," Using the hosting database"]}),e.jsx("p",{className:"text-[11px] text-slate-600 leading-relaxed",children:"The server will connect using the database configured by your hosting provider. There is nothing to fill in — just test the connection below."})]}):e.jsxs("div",{className:"grid grid-cols-2 gap-3",children:[e.jsx("div",{className:"col-span-2 sm:col-span-1",children:e.jsx(N,{label:"Host",children:e.jsx("input",{className:m,placeholder:"db.example.com",value:s.host,onChange:b("host"),disabled:d})})}),e.jsx("div",{className:"col-span-1",children:e.jsx(N,{label:"Port",children:e.jsx("input",{className:m,type:"number",placeholder:"5432",value:s.port,onChange:b("port"),disabled:d})})}),e.jsx("div",{className:"col-span-2",children:e.jsx(N,{label:"Database Name",children:e.jsx("input",{className:m,placeholder:"recura",value:s.database,onChange:b("database"),disabled:d})})}),e.jsx("div",{className:"col-span-2 sm:col-span-1",children:e.jsx(N,{label:"Username",children:e.jsx("input",{className:m,autoComplete:"username",placeholder:"postgres",value:s.user,onChange:b("user"),disabled:d})})}),e.jsx("div",{className:"col-span-2 sm:col-span-1",children:e.jsx(N,{label:"Password",children:e.jsx("input",{className:m,type:"password",autoComplete:"current-password",value:s.password,onChange:b("password"),disabled:d})})})]}),e.jsxs("label",{className:"flex items-center gap-2.5 text-xs font-bold text-slate-600 cursor-pointer select-none",children:[e.jsx("input",{type:"checkbox",checked:s.ssl,onChange:b("ssl"),className:"w-4 h-4 accent-[#4A90FF]",disabled:d||j}),"Use SSL connection",e.jsx("span",{className:"inline-flex items-center gap-1 text-slate-400 font-semibold",title:"Cloud databases (Neon, Supabase, Render, Railway) usually need this. Local databases usually do not.",children:e.jsx(He,{className:"w-3.5 h-3.5"})})]}),e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsxs("button",{className:"btn-secondary",onClick:y,disabled:h||d,children:[h?e.jsx(_,{className:"w-4 h-4 animate-spin"}):e.jsx(Le,{className:"w-4 h-4"}),h?"Testing…":"Test Connection"]}),e.jsx("span",{className:"text-[11px] text-slate-400 font-semibold",children:"We check the connection before installing anything."})]}),t&&e.jsx("div",{className:`rounded-2xl border p-4 text-xs space-y-2 ${t.ok?"bg-emerald-50/60 border-emerald-200":"bg-rose-50 border-rose-200"}`,children:t.ok?e.jsxs(e.Fragment,{children:[e.jsxs("div",{className:"flex items-center gap-2 font-extrabold text-emerald-800",children:[e.jsx(Q,{className:"w-4 h-4 text-emerald-500"})," Connected"]}),e.jsxs("div",{className:"grid grid-cols-2 gap-x-4 gap-y-1.5 text-slate-600",children:[e.jsxs("div",{className:"flex justify-between",children:[e.jsx("span",{children:"Server"}),e.jsx("span",{className:"font-bold text-slate-800",children:((ce=t.serverVersion)==null?void 0:ce.split(" on ")[0])??"unknown"})]}),e.jsxs("div",{className:"flex justify-between",children:[e.jsx("span",{children:"Supported (PG 13+)"}),e.jsx("span",{className:`font-bold ${t.versionSupported?"text-emerald-600":"text-rose-600"}`,children:t.versionSupported?"Yes":"No"})]}),e.jsxs("div",{className:"flex justify-between",children:[e.jsx("span",{children:"Can create tables"}),e.jsx("span",{className:`font-bold ${t.canCreateTables?"text-emerald-600":"text-rose-600"}`,children:t.canCreateTables?"Yes":"No"})]}),e.jsxs("div",{className:"flex justify-between",children:[e.jsx("span",{children:"Database state"}),e.jsx("span",{className:"font-bold text-slate-800",children:t.state})]})]}),t.existingTables&&t.existingTables.length>0&&e.jsxs("p",{className:"text-slate-600",children:["Existing Recura tables: ",e.jsx("span",{className:"font-bold",children:t.existingTables.join(", ")})]}),t.unrelatedTables&&t.unrelatedTables.length>0&&e.jsxs("p",{className:"text-slate-600",children:["Unrelated tables found (up to 20 shown): ",e.jsx("span",{className:"font-bold",children:t.unrelatedTables.join(", ")})]})]}):e.jsxs("div",{className:"space-y-1.5",children:[e.jsxs("div",{className:"flex items-center gap-2 font-bold text-rose-800",children:[e.jsx(S,{className:"w-4 h-4 text-rose-500"})," ",t.message||"Connection failed."]}),ke(t.message||"")&&e.jsxs("p",{className:"text-rose-700/80 font-semibold",children:["Tip: ",ke(t.message||"")]})]})}),v&&e.jsxs("label",{className:"flex items-start gap-2.5 text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 rounded-2xl p-3.5 cursor-pointer select-none",children:[e.jsx("input",{type:"checkbox",checked:o,onChange:c=>p(c.target.checked),className:"w-4 h-4 accent-amber-500 mt-0.5",disabled:d}),e.jsx("span",{children:"This database already contains tables. I confirm that I own or administer it and authorize installing Recura here. No existing data will be deleted."})]}),e.jsxs("button",{className:"btn-primary w-full",onClick:l,disabled:!Te||d,children:["Continue ",e.jsx(Ie,{className:"w-4 h-4"})]})]})]})}function vs({migrations:s,onNext:r}){return e.jsxs(O,{children:[e.jsx(K,{children:"Installing the Database"}),s===null?e.jsxs("div",{className:"flex items-center gap-3 text-xs font-bold text-slate-600 py-6 justify-center",children:[e.jsx(_,{className:"w-5 h-5 animate-spin text-[#4A90FF]"})," Installing schema… this may take a moment."]}):e.jsxs("div",{className:"space-y-3",children:[e.jsx("p",{className:"text-xs text-slate-500",children:"The schema, default templates and data guards were applied successfully:"}),e.jsx("div",{className:"space-y-2",children:s.applied.map(t=>e.jsxs("div",{className:"flex items-center gap-2.5 p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800",children:[e.jsx(me,{className:"w-4 h-4 text-emerald-500"})," ",t]},t))}),e.jsxs("p",{className:"text-xs text-slate-400 font-semibold",children:[s.total," migration file(s) processed."]}),e.jsxs("button",{className:"btn-primary w-full",onClick:r,children:["Create Administrator ",e.jsx(Ie,{className:"w-4 h-4"})]})]})]})}function Us({admin:s,setAdmin:r,busy:t,onSubmit:h}){const o=p=>y=>r(l=>({...l,[p]:y.target.value}));return e.jsxs(O,{children:[e.jsx(K,{children:"Administrator Account"}),e.jsx("p",{className:"text-xs text-slate-500 leading-relaxed",children:"Create the first account. It will have Administrator rights and is the account you will use to log in."}),e.jsxs("div",{className:"space-y-3",children:[e.jsx(N,{label:"Full Name",children:e.jsx("input",{className:m,placeholder:"System Owner",value:s.name,onChange:o("name"),disabled:t})}),e.jsx(N,{label:"Username",children:e.jsx("input",{className:m,autoComplete:"username",placeholder:"admin",value:s.username,onChange:o("username"),disabled:t})}),e.jsx(N,{label:"Email",children:e.jsx("input",{className:m,type:"email",autoComplete:"email",placeholder:"admin@example.com",value:s.email,onChange:o("email"),disabled:t})}),e.jsxs("div",{className:"grid grid-cols-1 sm:grid-cols-2 gap-3",children:[e.jsx(N,{label:"Password",children:e.jsx("input",{className:m,type:"password",autoComplete:"new-password",value:s.password,onChange:o("password"),disabled:t})}),e.jsx(N,{label:"Confirm Password",children:e.jsx("input",{className:m,type:"password",autoComplete:"new-password",value:s.confirm,onChange:o("confirm"),disabled:t})})]})]}),e.jsxs("button",{className:"btn-primary w-full",onClick:h,disabled:t,children:[t?e.jsx(_,{className:"w-4 h-4 animate-spin"}):e.jsx(De,{className:"w-4 h-4"}),t?"Creating…":"Create & Verify"]})]})}function _s({result:s,onNext:r,busy:t}){var h;return e.jsxs(O,{children:[e.jsx(K,{children:"Verification"}),s===null?e.jsxs("div",{className:"flex items-center gap-3 text-xs font-bold text-slate-600 py-6 justify-center",children:[e.jsx(_,{className:"w-5 h-5 animate-spin text-[#4A90FF]"})," Verifying installation…"]}):s.ok?e.jsxs("div",{className:"space-y-3",children:[e.jsxs("div",{className:"flex items-center gap-2.5 p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-2xl text-xs font-extrabold text-emerald-800",children:[e.jsx(Q,{className:"w-5 h-5 text-emerald-500"})," All checks passed"]}),e.jsx("div",{className:"space-y-1.5",children:(h=s.checks)==null?void 0:h.map(o=>e.jsxs("div",{className:"flex items-center justify-between text-xs p-2.5 bg-[#F8FAFC] rounded-xl",children:[e.jsx("span",{className:"font-bold text-slate-700",children:o.table}),e.jsxs("span",{className:"flex items-center gap-1.5 font-semibold text-slate-500",children:[o.ok?e.jsx(me,{className:"w-3.5 h-3.5 text-emerald-500"}):e.jsx(S,{className:"w-3.5 h-3.5 text-rose-500"}),o.rows," row(s)"]})]},o.table))}),s.adminEmail&&e.jsxs("p",{className:"text-xs text-slate-500",children:["Administrator ready: ",e.jsx("span",{className:"font-bold text-slate-800",children:s.adminEmail})]}),e.jsxs("button",{className:"btn-primary w-full",onClick:r,disabled:t,children:[t?e.jsx(_,{className:"w-4 h-4 animate-spin"}):e.jsx(je,{className:"w-4 h-4"}),t?"Finalizing…":"Finish Installation"]})]}):e.jsxs("div",{className:"space-y-3",children:[e.jsxs("div",{className:"flex items-center gap-2.5 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-bold text-rose-800",children:[e.jsx(S,{className:"w-5 h-5 text-rose-500"})," Verification failed. Go back and check the installation."]}),e.jsx("button",{className:"btn-secondary w-full",onClick:()=>window.location.reload(),children:"Reload"})]})]})}function Os({hosted:s=!1}){return e.jsxs(O,{children:[e.jsx(Q,{className:"w-10 h-10 text-emerald-500 mx-auto"}),e.jsx("h1",{className:"text-lg font-extrabold text-[#111827] text-center",children:"Installation Complete"}),e.jsx("p",{className:"text-xs text-slate-500 text-center leading-relaxed",children:s?"Recura is connected to your hosted database. The app now talks to it directly — no server to manage. Log in with the administrator account you just created.":"Recura is installed and its installer is now locked. Log in with the administrator account you just created."}),e.jsxs("a",{href:"/",className:"btn-primary w-full",children:[e.jsx(ls,{className:"w-4 h-4"})," Go to Log in"]})]})}os.createRoot(document.getElementById("root")).render(e.jsx(i.StrictMode,{children:e.jsx(Ss,{})}));
