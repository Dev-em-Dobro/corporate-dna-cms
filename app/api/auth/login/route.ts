import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { verifyPassword } from "@/lib/auth/password";
import { createSession, createMfaChallenge } from "@/lib/auth/session";
import { writeAudit } from "@/lib/audit/log";
import { jsonError, jsonOk, checkRateLimit, handleError } from "@/lib/http";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (typeof email !== "string" || typeof password !== "string") {
      return jsonError(422, "email and password are required");
    }

    const ip = req.headers.get("x-forwarded-for") ?? "unknown";
    if (!checkRateLimit(`login:${ip}:${email}`, 10, 60_000)) {
      return jsonError(429, "Too many attempts, try again later");
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()));

    if (!user || !user.passwordHash || user.status === "disabled") {
      await writeAudit({
        action: "auth.login_fail",
        metadata: { email, reason: "no-user-or-disabled" },
      });
      return jsonError(401, "Invalid credentials");
    }

    const valid = await verifyPassword(user.passwordHash, password);
    if (!valid) {
      await writeAudit({
        actorId: user.id,
        action: "auth.login_fail",
        metadata: { reason: "bad-password" },
      });
      return jsonError(401, "Invalid credentials");
    }

    // Admins (and any MFA-enabled user) MUST pass a second factor (FR-015).
    const mfaRequired = user.role === "admin" || user.mfaEnabled;
    if (mfaRequired) {
      if (!user.totpSecret) {
        return jsonError(403, "MFA is required but not enrolled for this account");
      }
      const challengeId = await createMfaChallenge(user.id);
      return jsonOk({ mfaRequired: true, challengeId });
    }

    await createSession({ sub: user.id, role: user.role, email: user.email });
    await db
      .update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, user.id));
    await writeAudit({ actorId: user.id, action: "auth.login" });
    return jsonOk({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}
