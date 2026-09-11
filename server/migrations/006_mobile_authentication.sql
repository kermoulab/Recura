-- =============================================================================
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
