import { it, expect, afterAll } from "vitest";
import { integrationDescribe as d } from "../helpers/test-env";
import { NextRequest } from "next/server";
import { POST as logoutRoute } from "@/app/api/auth/logout/route";
import { resetCookies, useJar } from "../helpers/next-headers-stub";
import {
  createPasswordUser,
  deleteUsers,
  signIn,
  beginEnrol,
  type TestCredentials,
} from "../helpers/auth";

// T041 — signing out ends the CURRENT session and leaves other devices signed
// in. Supabase's default signOut scope is 'global'; the route must pass
// `scope: 'local'` explicitly or this test fails on device B.
d("US2 logout is scoped to the current session", () => {
  let user: TestCredentials | undefined;

  afterAll(async () => {
    await deleteUsers(user);
  });

  it("device A signs out; device B stays signed in", async () => {
    user = await createPasswordUser("editor");

    // Two independent "browsers", same account.
    const jarA = resetCookies();
    await signIn(user);
    const jarB = resetCookies();
    await signIn(user);

    // Both sessions alive — the bootstrap-only enrolment endpoint is the
    // cheapest authenticated probe.
    useJar(jarA);
    expect((await beginEnrol()).status).toBe(200);
    useJar(jarB);
    expect((await beginEnrol()).status).toBe(200);

    // Sign out on A.
    useJar(jarA);
    const res = await logoutRoute(
      new NextRequest("http://localhost:3010/api/auth/logout", {
        method: "POST",
      }),
    );
    expect([302, 303, 307, 308]).toContain(res.status);

    // A is out…
    expect((await beginEnrol()).status).toBe(401);

    // …and B is untouched.
    useJar(jarB);
    expect((await beginEnrol()).status).toBe(200);
  });
});
