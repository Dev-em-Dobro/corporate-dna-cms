import { it, expect, afterAll } from "vitest";
import { integrationDescribe as d } from "../helpers/test-env";
import { createAdminClient } from "@/lib/supabase/admin";
import { resetCookies } from "../helpers/next-headers-stub";
import {
  createPasswordUser,
  deleteUsers,
  signIn,
  beginEnrol,
  type TestCredentials,
} from "../helpers/auth";

// T027 — US1: beginning enrolment five times without confirming leaves exactly
// ONE unverified factor, not five. Supabase documents no expiry or GC for
// unverified factors and caps a user at 10 — without the unenroll-before-
// enroll step in the route, an indecisive user bricks their own enrolment
// (research D9 / risk R5).
d("US1 abandoned-enrolment lifecycle", () => {
  let user: TestCredentials | undefined;

  afterAll(async () => {
    await deleteUsers(user);
  });

  it("five enrolment starts leave exactly one unverified factor", async () => {
    user = await createPasswordUser("editor");
    resetCookies();
    const login = await signIn(user);
    expect(login.body.next).toBe("enrol");

    const factorIds: string[] = [];
    for (let i = 0; i < 5; i++) {
      const enrol = await beginEnrol();
      expect(enrol.status, `enrol attempt ${i + 1}`).toBe(200);
      factorIds.push(enrol.body.factorId as string);
    }

    // Server-side truth, via the admin API — not what the route claims.
    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.mfa.listFactors({
      userId: user.id,
    });
    expect(error).toBeNull();
    const factors = data?.factors ?? [];
    expect(factors.length).toBe(1);
    expect(factors[0].status).toBe("unverified");
    // The survivor is the LATEST attempt — the one whose QR is on screen.
    expect(factors[0].id).toBe(factorIds.at(-1));
  });
});
