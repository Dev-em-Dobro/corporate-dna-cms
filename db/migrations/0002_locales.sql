CREATE TABLE "locales" (
	"code" text PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
-- Lock the table down like every other public table (see 0001_enable_rls):
-- all app access goes through the postgres role via Drizzle, which bypasses
-- RLS, so enabling it with no policy denies anon/authenticated entirely.
ALTER TABLE "public"."locales" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
-- Seed the initial registry: English is the default, Portuguese is available.
INSERT INTO "locales" ("code", "label", "is_default", "enabled", "sort_order") VALUES
	('en', 'English', true, true, 0),
	('pt-BR', 'Português (Brasil)', false, true, 1)
ON CONFLICT ("code") DO NOTHING;
