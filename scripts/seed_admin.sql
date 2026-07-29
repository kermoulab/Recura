-- Create the expected app tables and seed an admin user for the current Recura app.
-- This SQL is designed for the app code in src/services/supabaseService.ts,
-- which expects tables named: user_profiles, customers, plans, orders, audit_logs.
-- Run this in Supabase SQL editor or PostgreSQL psql for the target database.

CREATE TABLE IF NOT EXISTS public.user_profiles (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  username TEXT UNIQUE,
  email TEXT UNIQUE NOT NULL,
  password TEXT,
  password_hash TEXT,
  role TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status TEXT DEFAULT 'ACTIVE',
  is_blocked BOOLEAN DEFAULT FALSE,
  max_sessions_allowed INTEGER DEFAULT 3,
  active_sessions_count INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  email TEXT,
  preferred_language TEXT DEFAULT 'EN',
  registration_date TEXT,
  status TEXT DEFAULT 'ACTIVE',
  orders_count INTEGER DEFAULT 0,
  total_spent NUMERIC DEFAULT 0,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS public.plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price NUMERIC NOT NULL,
  duration_months INTEGER NOT NULL,
  notes TEXT,
  available_stock INTEGER DEFAULT 0,
  total_accounts INTEGER DEFAULT 0,
  active_orders INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_whatsapp TEXT,
  plan_id TEXT NOT NULL,
  plan_name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  duration_months INTEGER NOT NULL,
  start_date TEXT,
  end_date TEXT,
  status TEXT DEFAULT 'ACTIVE',
  account_email TEXT NOT NULL,
  account_password_encrypted TEXT,
  pin_code_encrypted TEXT,
  screen_profile_name TEXT,
  notes TEXT,
  contacted_for_renewal BOOLEAN DEFAULT FALSE,
  contacted_at TEXT
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id TEXT PRIMARY KEY,
  timestamp TEXT NOT NULL,
  user_email TEXT NOT NULL,
  user_name TEXT NOT NULL,
  action TEXT NOT NULL,
  details TEXT NOT NULL,
  ip_address TEXT NOT NULL,
  status TEXT DEFAULT 'SUCCESS'
);

-- Seed admin profile with credentials.
-- Use these credentials for initial login and change them immediately after.
-- username: admin
-- email: admin@recura.io
-- password: TestAdmin@123

INSERT INTO public.user_profiles (
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
)
ON CONFLICT (id) DO NOTHING;

-- Notes:
-- If your Supabase authentication layer uses a separate auth table, this table is for the app's internal profile data.
-- If you want a hashed password instead of plaintext, set password = NULL and provide a valid password_hash.
-- The app login code accepts either plaintext password or Argon2 hash in password_hash.
