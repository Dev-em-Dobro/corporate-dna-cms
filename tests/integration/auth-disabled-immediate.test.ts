import { describe, it, expect, afterAll } from "vitest";
import { updateUser } from "@/lib/users/service";
import { guardedRoutes } from "../helpers/admin-routes";
import {
  createEnrolledUser,
  deleteUsers,
  type TestCredentials,
} from "../helpers/auth";

const d =
  process.env.DATABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL
    ? describe
    : describe.skip;

// T040 — an account disabled mid-session is refused on its VERY NEXT request,
// not after the token expires. The access token in the jar stays
// cryptographically valid the whole time — Supabase cannot revoke it — so
// only the per-request `profiles.status` read can produce this refusal.
// This test proves that read is actually wired up.
d("US2 disabled account is refused immediately", () => {
  let user: TestCredentials | undefined;

  afterAll(async () => {
    await deleteUsers(user);
  });

  it("access flips from granted to refused across a single disable call", async () => {
    user = await createEnrolledUser("editor");
    const probe = (await guardedRoutes()).find(
      (r) => r.name === "GET /api/media",
    )!;

    // Session live and accepted.
    expect((await probe.call()).status).toBe(200);

    // Disable through the real service — the single choke-point that sets
    // profiles.status AND the Supabase ban together (T056).
    await updateUser(user.id, { status: "disabled" });

    // The very next request with the SAME still-valid token: refused.
    expect((await probe.call()).status).toBe(403);
  });
});
