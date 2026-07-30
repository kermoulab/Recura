-- =============================================================================
-- Recura ERP - Quick Admin Seed
--
-- IMPORTANT: This file only seeds the admin user. For the FULL schema
-- including all tables and demo data, run recura_full_schema.sql instead.
--
-- Instructions:
--   1. Go to your Supabase project → SQL Editor
--   2. Open and run scripts/recura_full_schema.sql (this creates all tables
--      and inserts demo data including the admin user below)
--   3. Copy .env.example to .env and update with your Supabase project credentials:
--        VITE_SUPABASE_URL="https://your-project.supabase.co"
--        VITE_SUPABASE_ANON_KEY="your-supabase-anon-key"
--   4. Run: npm run dev
--   5. Log in with: admin / TestAdmin@123
-- =============================================================================

INSERT INTO "User" (
  "id", "name", "username", "email", "passwordHash", "role", "createdAt"
) VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'James Noah',
  'admin',
  'admin@recura.io',
  '$argon2id$v=19$m=65536,t=3,p=1$QdiQ/RMZXNk4nbzGNtQcIA$rFFVNx7nm/b4xDGMLbB8JIU6GTIH1cI3KA+bRMXmI+E',
  'ADMIN',
  now()
)
ON CONFLICT ("username") DO NOTHING;
