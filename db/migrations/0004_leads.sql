-- The leads table was created out-of-band in the same Postgres (see handoff),
-- so this migration is idempotent: it brings a fresh environment up to the same
-- shape without failing where the table already exists.
CREATE TABLE IF NOT EXISTS "leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"organisation" text,
	"message" text NOT NULL,
	"source" text,
	"referer" text,
	"user_agent" text
);
--> statement-breakpoint
-- Lock the table down like every other public table (see 0001_enable_rls): all
-- app access goes through the postgres role via Drizzle, which bypasses RLS, so
-- enabling it with no policy denies anon/authenticated entirely.
ALTER TABLE "public"."leads" ENABLE ROW LEVEL SECURITY;
