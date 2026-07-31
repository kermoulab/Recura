-- =============================================================================
-- MIGRATION: add per-user currency preference to the "User" table
-- Run this in Supabase SQL Editor (or psql) against your existing database.
-- Safe to re-run; it does nothing if the column already exists.
-- =============================================================================

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "currency" VARCHAR(30) DEFAULT 'USD ($)';
