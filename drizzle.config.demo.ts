import type { Config } from "drizzle-kit";

// Demo variant of drizzle.config.ts: loads the LOCAL demo env so `db:migrate:demo`
// runs against the throwaway Docker Postgres, never the real Neon database.
try {
  process.loadEnvFile(".env.demo");
} catch {
  // no .env.demo — rely on the shell environment
}

export default {
  schema: "./db/schema/index.ts",
  out: "./db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DIRECT_URL ?? "",
  },
  schemaFilter: ["public"],
  entities: { roles: { provider: "supabase" } },
  strict: true,
} satisfies Config;
