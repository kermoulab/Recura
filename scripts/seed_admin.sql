-- Seed admin user for Recura ERP
-- Run this against your Supabase/Postgres database (e.g. psql or Supabase SQL editor)
-- Adjust schema/table name if different. This assumes table name: user_profiles and columns: id, full_name, username, email, password, password_hash, role, created_at, status, is_blocked, max_sessions_allowed, active_sessions_count

-- Test admin credentials (change password after first login):
-- username: admin
-- email: admin@recura.io
-- password: TestAdmin@123

INSERT INTO user_profiles (
  id,
  full_name,
  username,
  email,
  password,
  password_hash,
  role,
  created_at,
  status,
  is_blocked,
  max_sessions_allowed,
  active_sessions_count
) VALUES (
  'user_admin_1',
  'System Administrator',
  'admin',
  'admin@recura.io',
  'TestAdmin@123',
  NULL,
  'ADMIN',
  now(),
  'ACTIVE',
  false,
  5,
  0
);

-- Note:
-- If your authentication expects passwords to be hashed, replace password_hash with an Argon2/bcrypt hash and set password to NULL.
-- After running this, log in with the credentials above and immediately change the password to a secure one.
