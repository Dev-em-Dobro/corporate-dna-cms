import { describe } from "vitest";

/**
 * Gate for every integration suite.
 *
 * Integration tests create auth users, send real emails (built-in SMTP:
 * 2/hour project-wide) and burn MFA verifications (15/hour per IP, shared by
 * everyone behind the same egress). Run against the shared project they can
 * lock real editors out — so they refuse to run unless the environment
 * DECLARES itself a disposable test project.
 *
 * Setup: create `.env.test.local` (see `.env.test.example`) pointing at a
 * dedicated Supabase project + database, and set
 * `SUPABASE_TEST_PROJECT="true"` in it. vitest loads `.env.test.local` /
 * `.env.test` only — never `.env.local` — so pointing tests at the shared
 * project requires deliberately writing its credentials into a file whose
 * name says "test".
 */
export const hasIsolatedTestEnv =
  !!process.env.DATABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.SUPABASE_TEST_PROJECT === "true";

/** `describe` when an isolated test environment is declared, else skip. */
export const integrationDescribe = hasIsolatedTestEnv
  ? describe
  : describe.skip;
