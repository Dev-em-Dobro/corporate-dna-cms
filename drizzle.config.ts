import type { Config } from "drizzle-kit";

// drizzle-kit doesn't load .env.local the way Next does.
try {
  process.loadEnvFile(".env.local");
} catch {
  // no .env.local — rely on the shell environment
}

export default {
  schema: "./db/schema/index.ts",
  out: "./db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    // Port 5432, not the pooled 6543: DDL through transaction-mode pooling is
    // unreliable, and migrations want a session-scoped connection.
    url: process.env.DIRECT_URL ?? "",
  },
  // Never introspect or emit DDL for `auth` — it is Supabase-owned and any
  // generated `CREATE SCHEMA "auth"` would fail. auth.users is referenced via
  // `authUsers` from drizzle-orm/supabase instead.
  schemaFilter: ["public"],
  // Leave Supabase's built-in roles alone rather than trying to drop them.
  entities: { roles: { provider: "supabase" } },
  strict: true,
} satisfies Config;
