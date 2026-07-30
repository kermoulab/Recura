-- Seed admin user for Recura ERP using the existing PostgreSQL schema.
-- Assumes the following tables already exist in Supabase:
-- "User", "Customer", "Plan", "Order", "AuditLog".

-- Test admin credentials for the dashboard:
-- username: admin
-- email: admin@recura.io
-- password: TestAdmin@123
-- stored password hash: $argon2id$v=19$m=65536,t=3,p=1$QdiQ/RMZXNk4nbzGNtQcIA$rFFVNx7nm/b4xDGMLbB8JIU6GTIH1cI3KA+bRMXmI+E

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
  '$argon2id$v=19$m=65536,t=3,p=1$QdiQ/RMZXNk4nbzGNtQcIA$rFFVNx7nm/b4xDGMLbB8JIU6GTIH1cI3KA+bRMXmI+E',
  'ADMIN',
  now()
)
ON CONFLICT ("username") DO NOTHING;

-- Note:
-- The application now stores a real Argon2id hash in the passwordHash column.
-- For production use, replace this client-side validation flow with a server-side authentication layer.
