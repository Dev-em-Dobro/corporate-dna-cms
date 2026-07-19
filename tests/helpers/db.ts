import { db } from "@/db";
import { profiles } from "@/db/schema";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Insert a throwaway user and return its id (for actorId FKs in tests).
 *
 * `profiles.id` is a foreign key onto `auth.users`, so a bare insert with a
 * random UUID no longer works — the auth user has to exist first. This creates
 * both, which also means tests leave rows in auth.users; use deleteTestUser to
 * clean up.
 */
export async function createTestUser(
  role: "admin" | "editor" = "admin",
): Promise<string> {
  const email = `test-${crypto.randomUUID()}@example.com`;
  const admin = createAdminClient();

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: crypto.randomUUID(),
    email_confirm: true,
  });
  if (error) throw error;

  await db
    .insert(profiles)
    .values({ id: data.user.id, email, role, status: "active" });

  return data.user.id;
}

/** Remove a test user. profiles cascades from auth.users. */
export async function deleteTestUser(id: string): Promise<void> {
  const admin = createAdminClient();
  await admin.auth.admin.deleteUser(id);
}

export function uniqueTitle(prefix: string): string {
  return `${prefix} ${crypto.randomUUID().slice(0, 8)}`;
}
