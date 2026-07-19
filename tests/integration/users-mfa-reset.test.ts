import { describe, it, expect, afterAll } from "vitest";
import { createAdminClient } from "@/lib/supabase/admin";
import { resetMfa } from "@/lib/users/service";
import { createClient } from "@/lib/supabase/server";
import { guardedRoutes } from "../helpers/admin-routes";
import { resetCookies, currentJar, useJar } from "../helpers/next-headers-stub";
import {
  createEnrolledUser,
  deleteUsers,
  signIn,
  type TestCredentials,
} from "../helpers/auth";

const d =
  process.env.DATABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL
    ? describe
    : describe.skip;

// T052 — US4: resetting a factor locks the user's live session out and forces
// re-enrolment.
//
// Platform reality (verified empirically 2026-07-19, contra the documented
// "terminates all sessions"): the session SURVIVES factor deletion, but its
// next token refresh downgrades it to aal1 — where the guard refuses it and
// routes to enrolment. The already-issued access token keeps claiming aal2
// until expiry; that residual window is bounded by the 15-minute token
// lifetime (T003), because an issued token cannot be revoked at all.
d("US4 MFA reset", () => {
  let user: TestCredentials | undefined;

  afterAll(async () => {
    await deleteUsers(user);
  });

  it("deletes the factor, downgrades the live session on refresh, and forces re-enrolment", async () => {
    user = await createEnrolledUser("editor");
    const oldSession = currentJar(); // aal2, live

    await resetMfa(user.id);

    // The factor is gone server-side.
    const admin = createAdminClient();
    const { data } = await admin.auth.admin.mfa.listFactors({
      userId: user.id,
    });
    expect((data?.factors ?? []).length).toBe(0);

    // The surviving session comes back from its next refresh demoted to aal1…
    useJar(oldSession);
    const supabase = await createClient();
    const { error: refreshError } = await supabase.auth.refreshSession();
    expect(refreshError).toBeNull();
    const { data: claimsData } = await supabase.auth.getClaims();
    expect(claimsData?.claims?.aal).toBe("aal1");

    // …and the guard refuses it outright.
    const probe = (await guardedRoutes()).find(
      (r) => r.name === "GET /api/media",
    )!;
    expect((await probe.call()).status).toBe(403);

    // A fresh sign-in lands in bootstrap: enrolment is mandatory again.
    resetCookies();
    const login = await signIn(user);
    expect(login.status).toBe(200);
    expect(login.body.next).toBe("enrol");
  });
});
