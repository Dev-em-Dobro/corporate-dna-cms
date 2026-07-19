import { it, expect, afterAll } from "vitest";
import { integrationDescribe as d } from "../helpers/test-env";
import { guardedRoutes } from "../helpers/admin-routes";
import { resetCookies } from "../helpers/next-headers-stub";
import {
  createPasswordUser,
  deleteUsers,
  signIn,
  beginEnrol,
  type TestCredentials,
} from "../helpers/auth";

// T028 — SC-002a: an account with no factor reaches enrolment, and EVERY
// admin route returns 403 from that state. The bootstrap session exists to
// enrol and to do nothing else — even for an account whose role is admin.
d("US1 bootstrap containment (SC-002a)", () => {
  let user: TestCredentials | undefined;

  afterAll(async () => {
    await deleteUsers(user);
  });

  it("a factor-less account reaches enrolment but nothing else", async () => {
    // Admin role on purpose: containment must hold on role-escalated accounts
    // too, or a compromised admin password alone would run the CMS.
    user = await createPasswordUser("admin");
    resetCookies();

    const login = await signIn(user);
    expect(login.status).toBe(200);
    expect(login.body.next).toBe("enrol");

    // The one door that must be open: enrolment.
    const enrol = await beginEnrol();
    expect(enrol.status).toBe(200);

    // Every guarded route, handler by handler: closed.
    for (const route of await guardedRoutes()) {
      const res = await route.call();
      expect(res.status, route.name).toBe(403);
    }
  });
});
