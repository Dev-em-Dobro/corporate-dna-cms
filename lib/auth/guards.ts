import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, type User } from "@/db/schema";
import { readSession, type SessionPayload } from "./session";
import { AuthError } from "@/lib/errors";

export { AuthError };

/** Require any authenticated user. Throws AuthError(401) otherwise. */
export async function requireSession(): Promise<SessionPayload> {
  const s = await readSession();
  if (!s) throw new AuthError(401, "Authentication required");
  return s;
}

/** Require an administrator. Throws AuthError(403) for editors (FR-014). */
export async function requireAdmin(): Promise<SessionPayload> {
  const s = await requireSession();
  if (s.role !== "admin") throw new AuthError(403, "Administrator access required");
  return s;
}

/** Load the full user row for the current session, or null. */
export async function currentUser(): Promise<User | null> {
  const s = await readSession();
  if (!s) return null;
  const [u] = await db.select().from(users).where(eq(users.id, s.sub));
  return u ?? null;
}
