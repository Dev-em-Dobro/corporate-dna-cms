import { describe, it, expect, afterAll } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { listAudit } from "@/lib/audit/log";
import { POST as mfaRoute } from "@/app/api/auth/mfa/route";
import { guardedRoutes } from "../helpers/admin-routes";
import { resetCookies } from "../helpers/next-headers-stub";
import { wrongTotp } from "../helpers/totp";
import {
  createEnrolledUser,
  deleteUsers,
  signIn,
  completeMfa,
  jsonRequest,
  type TestCredentials,
} from "../helpers/auth";

const d =
  process.env.DATABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL
    ? describe
    : describe.skip;

// T038 — US2: valid credentials return a challenge rather than a session; a
// wrong code is refused and audited; a correct code grants access and updates
// lastLoginAt.
d("US2 sign-in flow", () => {
  let user: TestCredentials | undefined;

  afterAll(async () => {
    await deleteUsers(user);
  });

  it("password grants a challenge, not access; wrong code refused+audited; correct code grants access and stamps lastLoginAt", async () => {
    user = await createEnrolledUser("editor");

    // Fresh sign-in: the password step alone must yield only a challenge.
    resetCookies();
    const login = await signIn(user);
    expect(login.status).toBe(200);
    expect(login.body.next).toBe("mfa");

    const probe = (await guardedRoutes()).find(
      (r) => r.name === "GET /api/media",
    )!;
    expect((await probe.call()).status).toBe(403);

    // Clear the enrolment-time login stamp so the assertion below can only be
    // satisfied by THIS sign-in.
    await db
      .update(profiles)
      .set({ lastLoginAt: null })
      .where(eq(profiles.id, user.id));

    // Wrong code: refused, audited, still no access.
    const bad = await mfaRoute(
      jsonRequest("/api/auth/mfa", { code: wrongTotp(user.secret!) }),
    );
    expect(bad.status).toBe(401);
    const failAudits = await listAudit({
      actorId: user.id,
      action: "auth.mfa_fail",
    });
    expect(failAudits.length).toBeGreaterThan(0);
    expect((await probe.call()).status).toBe(403);

    // Correct code: access granted, lastLoginAt written.
    const ok = await completeMfa(user.secret!);
    expect(ok.status, JSON.stringify(ok.body)).toBe(200);
    expect((await probe.call()).status).toBe(200);

    const [p] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, user.id));
    expect(p.lastLoginAt).not.toBeNull();

    const loginAudits = await listAudit({
      actorId: user.id,
      action: "auth.login",
    });
    expect(loginAudits.length).toBeGreaterThan(0);
  });
});
