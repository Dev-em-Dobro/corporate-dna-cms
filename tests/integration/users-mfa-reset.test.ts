import { it, expect, afterAll } from "vitest";
import { integrationDescribe as d } from "../helpers/test-env";
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

// T052 — US4: resetting a factor forces re-enrolment.
//
// Platform reality (verified empirically 2026-07-19, contra the documented
// "terminates all sessions"): the session SURVIVES factor deletion. What
// happens to it next is VERSION-DEPENDENT: hosted GoTrue downgraded the
// session to aal1 on its next token refresh (where the guard refuses it);
// local gotrue v2.192 keeps refreshing at aal2. The invariants asserted
// unconditionally here are the ones that hold everywhere: the factors are
// gone, a fresh sign-in lands in bootstrap, and the residual access of a
// surviving session is bounded by the 15-minute token lifetime (T003) —
// an issued token cannot be revoked at all.
d("US4 MFA reset", () => {
  let user: TestCredentials | undefined;

  afterAll(async () => {
    await deleteUsers(user);
  });

  it("deletes the factor and forces re-enrolment", async () => {
    user = await createEnrolledUser("editor");
    const oldSession = currentJar(); // aal2, live

    await resetMfa(user.id);

    // The factor is gone server-side.
    const admin = createAdminClient();
    const { data } = await admin.auth.admin.mfa.listFactors({
      userId: user.id,
    });
    expect((data?.factors ?? []).length).toBe(0);

    // The surviving session still refreshes. Whether the refreshed token is
    // demoted to aal1 is a GoTrue version difference (hosted: yes; local
    // v2.192: no) — but WHEN it is demoted, the guard must refuse it.
    useJar(oldSession);
    const supabase = await createClient();
    const { error: refreshError } = await supabase.auth.refreshSession();
    expect(refreshError).toBeNull();
    const { data: claimsData } = await supabase.auth.getClaims();
    if (claimsData?.claims?.aal === "aal1") {
      const probe = (await guardedRoutes()).find(
        (r) => r.name === "GET /api/media",
      )!;
      expect((await probe.call()).status).toBe(403);
    }

    // A fresh sign-in lands in bootstrap: enrolment is mandatory again.
    resetCookies();
    const login = await signIn(user);
    expect(login.status).toBe(200);
    expect(login.body.next).toBe("enrol");
  });
});
