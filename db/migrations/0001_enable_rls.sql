-- Lock the public schema down at the database layer.
--
-- Supabase auto-publishes every public table through PostgREST, and the anon /
-- authenticated roles are granted full CRUD by default. The publishable
-- (anon) key ships to every browser. With RLS off, that means anyone holding
-- the public key can read and write these tables directly, completely
-- bypassing the server-side guards in lib/auth/guards.ts — the app's only
-- authorization boundary.
--
-- This app never uses PostgREST: all data access goes through Drizzle over the
-- `postgres` role, which owns these tables and bypasses RLS. So enabling RLS
-- with no policies denies anon/authenticated entirely while leaving the app
-- untouched. The REVOKE is belt-and-suspenders against any future default
-- grant.

ALTER TABLE "public"."profiles"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."content_entries"    ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."content_versions"   ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."media_assets"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."case_study_facets"  ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."audit_log"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."webhook_endpoints"  ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON ALL TABLES IN SCHEMA "public" FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA "public" FROM anon, authenticated;

-- Any table created later inherits the same denial rather than Supabase's
-- permissive default.
ALTER DEFAULT PRIVILEGES IN SCHEMA "public" REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA "public" REVOKE ALL ON SEQUENCES FROM anon, authenticated;
