import { defineConfig } from "vitest/config";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnvConfig } from "@next/env";

const root = resolve(fileURLToPath(new URL(".", import.meta.url)));

// Load .env.local / .env exactly the way `next dev` does, so integration tests
// reach the same database and Supabase project as the running app. Suites
// still guard on `process.env.DATABASE_URL` and skip when it is absent (CI
// without secrets).
//
// NODE_ENV juggling: vitest sets NODE_ENV=test, and in test mode @next/env
// deliberately ignores `.env.local` (it would only read `.env.test*`). This
// project keeps its dev secrets in `.env.local`, so load in development mode.
{
  const env = process.env as Record<string, string | undefined>;
  const nodeEnv = env.NODE_ENV;
  env.NODE_ENV = "development";
  loadEnvConfig(root);
  if (nodeEnv === undefined) delete env.NODE_ENV;
  else env.NODE_ENV = nodeEnv;
}

export default defineConfig({
  resolve: {
    alias: [
      // Alias only "@/..." so package imports like "@supabase/ssr" are untouched.
      { find: /^@\//, replacement: `${root}/` },
      /**
       * Server-context shims. Route handlers and guards import `next/headers`
       * and `server-only`, which only work inside a Next.js request scope.
       * The stub gives tests a controllable cookie jar standing in for the
       * request's cookies — see tests/helpers/next-headers-stub.ts.
       */
      {
        find: /^next\/headers$/,
        replacement: `${root}/tests/helpers/next-headers-stub.ts`,
      },
      {
        find: /^server-only$/,
        replacement: `${root}/tests/helpers/server-only-stub.ts`,
      },
    ],
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    /**
     * Sequential on purpose. The auth suites share three global resources:
     * the per-IP Supabase MFA verify budget (15/hour), the active-admin count
     * that the last-admin safeguard reads, and per-file cookie-jar state.
     * Parallel files turn all three into races.
     */
    fileParallelism: false,
    // Auth integration tests talk to the real Supabase project and sometimes
    // wait out a 30s TOTP window to avoid reusing a code.
    testTimeout: 120_000,
    hookTimeout: 120_000,
  },
});
