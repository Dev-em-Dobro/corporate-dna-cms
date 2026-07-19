import { it, expect, afterAll } from "vitest";
import { integrationDescribe as d } from "../helpers/test-env";
import { inviteUser, updateUser } from "@/lib/users/service";
import { guardedRoutes } from "../helpers/admin-routes";
import { resetCookies } from "../helpers/next-headers-stub";
import {
  createPasswordUser,
  createEnrolledUser,
  deleteUsers,
  signIn,
  type TestCredentials,
} from "../helpers/auth";

// T051 — US4 lifecycle: invite creates an `invited` profile with no password
// accepted from the administrator; a role change takes effect on the user's
// next request; disabling is refused immediately.
d("US4 user lifecycle", () => {
  const cleanup: Array<TestCredentials | string | undefined> = [];
  // A spare active admin so lifecycle transitions below can never trip the
  // last-admin safeguard (that safeguard has its own test file).
  let spare: TestCredentials | undefined;

  afterAll(async () => {
    await deleteUsers(spare, ...cleanup);
  });

  it("an invitation yields an `invited` profile and no administrator-chosen password", async (ctx) => {
    // A real invitation email goes out. Hosted Supabase rejects reserved
    // domains like example.com outright, so this uses a public disposable
    // inbox. Until custom SMTP (T002) is configured the built-in sender
    // allows 2 emails/hour project-wide — on that limit, skip rather than
    // fail: the limitation is the pending T002, not this code.
    const email = `cdna-invite-${crypto.randomUUID().slice(0, 8)}@mailinator.com`;
    let profile;
    try {
      profile = await inviteUser({ email, role: "editor" });
    } catch (e) {
      if (/rate ?limit/i.test(e instanceof Error ? e.message : String(e))) {
        return ctx.skip();
      }
      throw e;
    }
    cleanup.push(profile.id);

    expect(profile.status).toBe("invited");
    expect(profile.role).toBe("editor");
    expect(profile.email).toBe(email);

    // The admin never chose a password, so NO password can sign this
    // account in — the invitee sets their own via the emailed link (FR-014).
    resetCookies();
    const attempt = await signIn({
      id: profile.id,
      email,
      password: "AdminChosenPassword!123",
    });
    expect(attempt.status).toBe(401);
  });

  it("a role change takes effect on the next request; disable refuses immediately", async () => {
    spare = await createPasswordUser("admin");

    const member = await createEnrolledUser("editor");
    cleanup.push(member);
    // Session is live at aal2 in the current jar.

    const adminProbe = (await guardedRoutes()).find(
      (r) => r.name === "GET /api/admin/users",
    )!;

    // Editor: admin surface refused.
    expect((await adminProbe.call()).status).toBe(403);

    // Promote. Same session, very next request: allowed. No re-login — the
    // guard reads role from the database, not from the JWT.
    await updateUser(member.id, { role: "admin" });
    expect((await adminProbe.call()).status).toBe(200);

    // Disable. Very next request: refused.
    await updateUser(member.id, { status: "disabled" });
    expect((await adminProbe.call()).status).toBe(403);
  });
});
