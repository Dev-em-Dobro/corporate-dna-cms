import { and, eq, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import { profiles, type Profile } from "@/db/schema";
import { createAdminClient } from "@/lib/supabase/admin";
import { ConflictError, NotFoundError } from "@/lib/errors";

export type Role = "admin" | "editor";
export type UserStatus = "active" | "invited" | "disabled";

/**
 * Ban duration used to disable an account at the Supabase level. Roughly 100
 * years — Supabase has no "ban indefinitely", and re-enabling is a matter of
 * clearing it rather than waiting it out.
 */
const BAN_FOREVER = "876000h";

export async function listUsers() {
  return db
    .select({
      id: profiles.id,
      email: profiles.email,
      role: profiles.role,
      status: profiles.status,
      lastLoginAt: profiles.lastLoginAt,
      createdAt: profiles.createdAt,
    })
    .from(profiles)
    .orderBy(profiles.createdAt);
}

async function activeAdminCount(excludeId?: string): Promise<number> {
  const conds = [eq(profiles.role, "admin"), eq(profiles.status, "active")];
  if (excludeId) conds.push(ne(profiles.id, excludeId));
  const [{ n }] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(profiles)
    .where(and(...conds));
  return n;
}

export interface InviteUserInput {
  email: string;
  role: Role;
}

/**
 * Invite a user. Note there is no password parameter: the invitee sets their
 * own via the emailed link, so an administrator never handles someone else's
 * credentials.
 *
 * There is also no MFA enrolment here. Supabase has no API to enrol a factor
 * on another user's behalf — the invitee enrols their own on first sign-in,
 * which is what the bootstrap guard exists to permit.
 */
export async function inviteUser(input: InviteUserInput): Promise<Profile> {
  const email = input.email.toLowerCase().trim();
  const admin = createAdminClient();

  const { data, error } = await admin.auth.admin.inviteUserByEmail(email);
  if (error) {
    if (error.status === 422 || /already/i.test(error.message)) {
      throw new ConflictError("A user with that email already exists");
    }
    throw error;
  }

  const [profile] = await db
    .insert(profiles)
    .values({ id: data.user.id, email, role: input.role, status: "invited" })
    .returning();

  return profile;
}

export interface UpdateUserInput {
  role?: Role;
  status?: UserStatus;
}

/**
 * Update role/status, refusing to remove the last active administrator.
 *
 * Disabling writes to both places on purpose. `profiles.status` is what the
 * request guard enforces, and the Supabase ban is what stops token refresh.
 * Either one alone leaves a gap: status alone lets the refresh path keep
 * issuing tokens, ban alone lets the current access token run to expiry.
 */
export async function updateUser(
  id: string,
  patch: UpdateUserInput,
): Promise<Profile> {
  const [target] = await db.select().from(profiles).where(eq(profiles.id, id));
  if (!target) throw new NotFoundError("User not found");

  const nextRole: Role = patch.role ?? (target.role as Role);
  const nextStatus: UserStatus = patch.status ?? (target.status as UserStatus);

  const losingAdmin =
    target.role === "admin" && (nextRole !== "admin" || nextStatus !== "active");
  if (losingAdmin && (await activeAdminCount(id)) === 0) {
    throw new ConflictError("Cannot remove the last active administrator");
  }

  if (nextStatus !== target.status) {
    const admin = createAdminClient();
    const { error } = await admin.auth.admin.updateUserById(id, {
      ban_duration: nextStatus === "disabled" ? BAN_FOREVER : "none",
    });
    if (error) throw error;
  }

  const [profile] = await db
    .update(profiles)
    .set({ role: nextRole, status: nextStatus, updatedAt: new Date() })
    .where(eq(profiles.id, id))
    .returning();

  return profile;
}

/**
 * Clear a user's second factor so they can enrol again — for a lost phone.
 *
 * What actually happens to a live session (verified empirically, 2026-07-19 —
 * the docs' "signs out all sessions" claim does NOT hold on the platform):
 * the session survives, but on its next token refresh it is downgraded to
 * aal1, at which point the guards refuse it and route to re-enrolment. The
 * already-issued access token keeps aal2 until it expires — that staleness
 * window is why the token lifetime is shortened to 15 minutes (T003).
 */
export async function resetMfa(id: string): Promise<void> {
  const [target] = await db.select().from(profiles).where(eq(profiles.id, id));
  if (!target) throw new NotFoundError("User not found");

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.mfa.listFactors({ userId: id });
  if (error) throw error;

  for (const factor of data?.factors ?? []) {
    const { error: delError } = await admin.auth.admin.mfa.deleteFactor({
      id: factor.id,
      userId: id,
    });
    if (delError) throw delError;
  }
}

/**
 * Delete a user outright. `profiles` cascades from auth.users, but audit rows
 * and authored content deliberately do not — they keep their history with the
 * actor nulled and the email snapshot intact.
 */
export async function deleteUser(id: string): Promise<void> {
  const [target] = await db.select().from(profiles).where(eq(profiles.id, id));
  if (!target) throw new NotFoundError("User not found");

  if (target.role === "admin" && (await activeAdminCount(id)) === 0) {
    throw new ConflictError("Cannot remove the last active administrator");
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) throw error;
}
