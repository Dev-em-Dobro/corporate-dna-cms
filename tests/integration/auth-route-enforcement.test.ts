import { describe, it, expect, afterAll } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import {
  guardedRoutes,
  ADMIN_HANDLER_COUNT,
} from "../helpers/admin-routes";
import { resetCookies } from "../helpers/next-headers-stub";
import {
  createPasswordUser,
  createEnrolledUser,
  deleteUsers,
  signIn,
  type TestCredentials,
} from "../helpers/auth";

const d =
  process.env.DATABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL
    ? describe
    : describe.skip;

/**
 * T039 — the negative sweep. This file is the ONLY evidence for SC-002 and
 * SC-002a: the guards are the sole line of defense (no RLS policies grant
 * anything, no middleware gate exists), and a hidden UI button is not
 * enforcement. Handlers are called directly, so nothing between the test and
 * the guard can fake a pass.
 */
d("US2 negative sweep across all admin routes (SC-002 / SC-002a)", () => {
  const cleanup: Array<TestCredentials | undefined> = [];

  afterAll(async () => {
    await deleteUsers(...cleanup);
  });

  async function expectAllRefused(label: string) {
    for (const route of await guardedRoutes()) {
      const res = await route.call();
      expect(res.status, `${label}: ${route.name}`).toBe(403);
    }
  }

  it("the sweep table still covers every admin handler", async () => {
    const routes = await guardedRoutes();
    const adminHandlers = routes.filter((r) => r.name.includes("/api/admin/"));
    // If this fails, an admin route was added or removed without updating
    // tests/helpers/admin-routes.ts — extend the sweep before touching this.
    expect(adminHandlers.length).toBe(ADMIN_HANDLER_COUNT);
  });

  it("(a) an aal1-only session — password accepted, factor pending — is refused everywhere", async () => {
    const user = await createEnrolledUser("admin");
    cleanup.push(user);

    resetCookies();
    const login = await signIn(user);
    expect(login.body.next).toBe("mfa");

    await expectAllRefused("aal1-only");
  });

  it("(b) a bootstrap session — no factor enrolled — is refused everywhere", async () => {
    const user = await createPasswordUser("admin");
    cleanup.push(user);

    resetCookies();
    const login = await signIn(user);
    expect(login.body.next).toBe("enrol");

    await expectAllRefused("bootstrap");
  });

  it("(c) a disabled account is refused everywhere on its very next request", async () => {
    const user = await createPasswordUser("admin");
    cleanup.push(user);

    resetCookies();
    await signIn(user);
    // Disable AFTER the session exists — the token in the jar is still
    // cryptographically valid; only the per-request status read refuses it.
    await db
      .update(profiles)
      .set({ status: "disabled" })
      .where(eq(profiles.id, user.id));

    await expectAllRefused("disabled");
  });

  it("(d) an editor at full assurance is refused on every admin-only route", async () => {
    const editor = await createEnrolledUser("editor");
    cleanup.push(editor);
    // createEnrolledUser leaves the session at aal2 in the current jar.

    const routes = await guardedRoutes();

    // Sanity first: this session is real. Without a passing positive probe,
    // 403s below would also pass for a broken session — vacuously.
    const probe = routes.find((r) => r.name === "GET /api/media")!;
    expect((await probe.call()).status).toBe(200);

    for (const route of routes.filter((r) => r.adminOnly)) {
      const res = await route.call();
      expect(res.status, `editor: ${route.name}`).toBe(403);
    }
  });
});
