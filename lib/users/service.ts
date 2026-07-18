import { and, eq, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import { users, type User } from "@/db/schema";
import { hashPassword } from "@/lib/auth/password";
import { generateTotpSecret, totpKeyUri } from "@/lib/auth/totp";
import { ConflictError, NotFoundError } from "@/lib/errors";

export type Role = "admin" | "editor";
export type UserStatus = "active" | "invited" | "disabled";

export async function listUsers() {
  return db
    .select({
      id: users.id,
      email: users.email,
      role: users.role,
      status: users.status,
      mfaEnabled: users.mfaEnabled,
      lastLoginAt: users.lastLoginAt,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(users.createdAt);
}

async function activeAdminCount(excludeId?: string): Promise<number> {
  const conds = [eq(users.role, "admin"), eq(users.status, "active")];
  if (excludeId) conds.push(ne(users.id, excludeId));
  const [{ n }] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(users)
    .where(and(...conds));
  return n;
}

export interface CreateUserInput {
  email: string;
  role: Role;
  password: string;
  enableMfa?: boolean;
}

/** Create a user. Admins always get MFA enrolled and the otpauth URI returned. */
export async function createUser(
  input: CreateUserInput,
): Promise<{ user: User; totpUri?: string; totpSecret?: string }> {
  const email = input.email.toLowerCase().trim();
  const passwordHash = await hashPassword(input.password);
  const mfa = input.role === "admin" || !!input.enableMfa;
  const totpSecret = mfa ? generateTotpSecret() : null;

  const [user] = await db
    .insert(users)
    .values({
      email,
      role: input.role,
      passwordHash,
      mfaEnabled: mfa,
      totpSecret,
      status: "active",
    })
    .returning();

  return {
    user,
    totpUri: totpSecret ? totpKeyUri(email, totpSecret) : undefined,
    totpSecret: totpSecret ?? undefined,
  };
}

export interface UpdateUserInput {
  role?: Role;
  status?: UserStatus;
}

/**
 * Update role/status with safeguards: never remove the last active admin, and
 * never leave an admin without MFA (promotion enrolls TOTP, returns the URI).
 */
export async function updateUser(
  id: string,
  patch: UpdateUserInput,
): Promise<{ user: User; totpUri?: string }> {
  const [target] = await db.select().from(users).where(eq(users.id, id));
  if (!target) throw new NotFoundError("User not found");

  const nextRole: Role = patch.role ?? (target.role as Role);
  const nextStatus: UserStatus = patch.status ?? (target.status as UserStatus);

  const losingAdmin =
    target.role === "admin" && (nextRole !== "admin" || nextStatus !== "active");
  if (losingAdmin && (await activeAdminCount(id)) === 0) {
    throw new ConflictError("Cannot remove the last active administrator");
  }

  const set: Partial<typeof users.$inferInsert> = {
    role: nextRole,
    status: nextStatus,
    updatedAt: new Date(),
  };

  let totpUri: string | undefined;
  if (nextRole === "admin" && !target.mfaEnabled) {
    const secret = generateTotpSecret();
    set.mfaEnabled = true;
    set.totpSecret = secret;
    totpUri = totpKeyUri(target.email, secret);
  }

  const [user] = await db
    .update(users)
    .set(set)
    .where(eq(users.id, id))
    .returning();
  return { user, totpUri };
}
