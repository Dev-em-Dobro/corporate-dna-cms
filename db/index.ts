import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  // Fail loudly at first use rather than silently connecting to nothing.
  // (Kept as a warning so `next build` / typecheck without env still works.)
  console.warn("[db] DATABASE_URL is not set — database calls will fail.");
}

/**
 * DATABASE_URL points at Supavisor in transaction mode (port 6543), which is
 * what serverless needs. Transaction mode does not support prepared
 * statements, hence `prepare: false` — without it queries fail once the pooler
 * hands the connection to another client mid-session.
 *
 * Migrations use DIRECT_URL (port 5432) instead; see drizzle.config.ts.
 */
const client = postgres(connectionString ?? "", { prepare: false });

export const db = drizzle(client, { schema });
export type DB = typeof db;
export * as tables from "./schema";
