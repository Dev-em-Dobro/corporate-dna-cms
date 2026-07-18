import { db } from "@/db";
import { users } from "@/db/schema";

/** Insert a throwaway user and return its id (for actorId FKs in tests). */
export async function createTestUser(
  role: "admin" | "editor" = "admin",
): Promise<string> {
  const [u] = await db
    .insert(users)
    .values({
      email: `test-${crypto.randomUUID()}@example.com`,
      role,
      status: "active",
    })
    .returning();
  return u.id;
}

export function uniqueTitle(prefix: string): string {
  return `${prefix} ${crypto.randomUUID().slice(0, 8)}`;
}
