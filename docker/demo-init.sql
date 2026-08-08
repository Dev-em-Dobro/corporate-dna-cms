-- Supabase-compatible bootstrap for a plain Postgres container so the CMS
-- migrations apply cleanly against the local *demo* database.
--
-- Two things the real DB gets from Supabase that a vanilla Postgres lacks:
--   1. the anon / authenticated / service_role roles (migration
--      0001_enable_rls.sql runs REVOKE ... FROM anon, authenticated);
--   2. the auth.users table (profiles.id has a FK to auth.users(id)).
-- This script creates minimal stand-ins for both, once, at container init.

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'anon') THEN
    CREATE ROLE anon NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'service_role') THEN
    CREATE ROLE service_role NOLOGIN;
  END IF;
END
$$;

-- Minimal auth schema so the profiles -> auth.users foreign key resolves. Real
-- Supabase owns this table; the demo only needs the referenced column plus the
-- single row the seed inserts for the login profile.
CREATE SCHEMA IF NOT EXISTS auth;
CREATE TABLE IF NOT EXISTS auth.users (
  id    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text
);
