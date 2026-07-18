import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { verifyTotp } from "@/lib/auth/totp";
import { createSession, verifyMfaChallenge } from "@/lib/auth/session";
import { writeAudit } from "@/lib/audit/log";
import { jsonError, jsonOk, checkRateLimit, handleError } from "@/lib/http";

export async function POST(req: NextRequest) {
  try {
    const { challengeId, code } = await req.json();
    if (typeof challengeId !== "string" || typeof code !== "string") {
      return jsonError(422, "challengeId and code are required");
    }

    const ip = req.headers.get("x-forwarded-for") ?? "unknown";
    if (!checkRateLimit(`mfa:${ip}`, 10, 60_000)) {
      return jsonError(429, "Too many attempts, try again later");
    }

    const userId = await verifyMfaChallenge(challengeId);
    if (!userId) return jsonError(401, "Invalid or expired challenge");

    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user || !user.totpSecret || user.status === "disabled") {
      return jsonError(401, "Invalid challenge");
    }

    if (!(await verifyTotp(code, user.totpSecret))) {
      await writeAudit({ actorId: user.id, action: "auth.mfa_fail" });
      return jsonError(401, "Invalid code");
    }

    await createSession({ sub: user.id, role: user.role, email: user.email });
    await db
      .update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, user.id));
    await writeAudit({ actorId: user.id, action: "auth.login", metadata: { mfa: true } });
    return jsonOk({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}
