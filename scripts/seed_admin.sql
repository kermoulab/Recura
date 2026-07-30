-- Seed admin user for Recura ERP using the existing PostgreSQL schema.
-- Assumes the following tables already exist in Supabase:
-- "User", "Customer", "Plan", "Order", "AuditLog".

-- Test admin credentials for the dashboard:
-- username: admin
-- email: admin@recura.io
-- password: TestAdmin@123

INSERT INTO "User" (
  "id",
  "name",
  "username",
  "email",
  "passwordHash",
  "role",
  "createdAt"
) VALUES (
  uuid_generate_v4(),
  'System Administrator',
  'admin',
  'admin@recura.io',
  'TestAdmin@123',
  'ADMIN',
  now()
)
ON CONFLICT ("username") DO NOTHING;

-- Note:
-- The application stores login credentials in the "passwordHash" column for backward compatibility
-- with its current authentication flow. For production use, replace this with a proper Argon2id hash
-- and a server-side authentication layer instead of client-side password validation.
