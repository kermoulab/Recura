-- =============================================================================
-- MIGRATION: sequential order numbers + persisted WhatsApp templates
-- Run this in Supabase SQL Editor (or psql) against your existing database.
-- Safe to re-run.
-- =============================================================================

-- 1) Sequential order numbers (backfill existing orders by creation date)
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "orderNumber" INTEGER;
UPDATE "Order" SET "orderNumber" = seq.rn FROM (
  SELECT "id", ROW_NUMBER() OVER (ORDER BY "createdAt" ASC, "id" ASC) AS rn
  FROM "Order"
) seq
WHERE "Order"."id" = seq."id" AND "Order"."orderNumber" IS NULL;

-- 2) Global WhatsApp template table (one row per language, AR / FR / EN)
CREATE TABLE IF NOT EXISTS "WhatsAppTemplate" (
    "language" VARCHAR(2) PRIMARY KEY,
    "expiring3Days" TEXT NOT NULL DEFAULT '',
    "expired" TEXT NOT NULL DEFAULT '',
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO "WhatsAppTemplate" ("language", "expiring3Days", "expired") VALUES
('AR', 'مرحباً {{name}}، نود تذكيركم بأن اشتراككم {{plan}} سينتهي بتاريخ {{date}}. يمكنكم تجديد الاشتراك أو الترقية في أي وقت. شكراً لثقتكم بنا.', 'مرحباً {{name}}، لقد انتهت صلاحية اشتراككم {{plan}} بتاريخ {{date}}. يرجى التواصل معنا لتجديد الخدمة في أقرب وقت.'),
('FR', 'Bonjour {{name}}, votre abonnement {{plan}} expirera le {{date}}. Vous pouvez le renouveler ou passer à une offre supérieure à tout moment. Merci pour votre confiance.', 'Bonjour {{name}}, votre abonnement {{plan}} a expiré le {{date}}. Merci de nous contacter afin de renouveler votre service.'),
('EN', 'Hello {{name}}, your {{plan}} subscription will expire on {{date}}. You may renew or upgrade your subscription at any time. Thank you for your trust.', 'Hello {{name}}, your {{plan}} subscription expired on {{date}}. Please contact us to renew your service.')
ON CONFLICT ("language") DO NOTHING;
