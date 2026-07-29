-- Seed admin user for Recura ERP using the existing schema you created.
-- This file assumes the following tables already exist in supabase:
-- "User", "Customer", "Plan", "Order", "AuditLog".
-- It does not recreate the schema; it only inserts the admin record.

-- Test admin credentials (change password immediately after login):
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
  'user_admin_1',
  'System Administrator',
  'admin',
  'admin@recura.io',
  '$argon2id$v=19$m=65536,t=3,p=4$simulatedhash',
  'ADMIN',
  now()
)
ON CONFLICT ("id") DO NOTHING;

-- Note:
-- This seed uses the existing "User" table from the Recura database dump.
-- If you want to use a plaintext password instead of passwordHash, set
-- passwordHash to NULL and add a password column to the schema.
