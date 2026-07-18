import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool } from "@neondatabase/serverless";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  // Fail loudly at first use rather than silently connecting to nothing.
  // (Kept as a warning so `next build` / typecheck without env still works.)
  console.warn("[db] DATABASE_URL is not set — database calls will fail.");
}

// The pooled serverless driver supports multi-statement transactions, which the
// entry service relies on (version snapshot + entry update must be atomic).
const pool = new Pool({ connectionString });

export const db = drizzle(pool, { schema });
export type DB = typeof db;
export * as tables from "./schema";
