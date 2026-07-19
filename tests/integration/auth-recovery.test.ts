import { it, expect, afterAll } from "vitest";
import { integrationDescribe as d } from "../helpers/test-env";
import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { POST as recoverRoute } from "@/app/api/auth/recover/route";
import { GET as confirmRoute } from "@/app/auth/confirm/route";
import { resetCookies } from "../helpers/next-headers-stub";
import {
  createPasswordUser,
  deleteUsers,
  jsonRequest,
  type TestCredentials,
} from "../helpers/auth";

function confirmRequest(tokenHash: string): NextRequest {
  return new NextRequest(
    `http://localhost:3010/auth/confirm?token_hash=${encodeURIComponent(tokenHash)}&type=recovery`,
  );
}

// T063 — US5: recovery for a registered and an unregistered address return
// IDENTICAL status and body (FR-017); a recovery link is refused on reuse.
// (True expiry needs the clock; an expired token is rejected by the same
// verifyOtp path as the garbage token asserted below.)
d("US5 password recovery", () => {
  let user: TestCredentials | undefined;

  afterAll(async () => {
    await deleteUsers(user);
  });

  it("registered and unregistered addresses are indistinguishable", async () => {
    user = await createPasswordUser("editor");

    const registered = await recoverRoute(
      jsonRequest("/api/auth/recover", { email: user.email }),
    );
    const unregistered = await recoverRoute(
      jsonRequest("/api/auth/recover", {
        email: `nobody-${crypto.randomUUID()}@example.com`,
      }),
    );

    expect(registered.status).toBe(200);
    expect(unregistered.status).toBe(200);
    expect(await registered.json()).toEqual(await unregistered.json());
  });

  it("a recovery link works once and is refused on reuse", async () => {
    user = user ?? (await createPasswordUser("editor"));

    // generateLink yields the token_hash without sending an email — the same
    // token the emailed link carries, minus the SMTP dependency.
    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.generateLink({
      type: "recovery",
      email: user.email,
    });
    expect(error).toBeNull();
    const tokenHash = data?.properties?.hashed_token as string;
    expect(tokenHash).toBeTruthy();

    resetCookies();
    const first = await confirmRoute(confirmRequest(tokenHash));
    expect(first.status).toBeGreaterThanOrEqual(300);
    expect(first.headers.get("location")).toContain("/auth/update-password");

    // Same link again, fresh browser: refused.
    resetCookies();
    const second = await confirmRoute(confirmRequest(tokenHash));
    expect(second.headers.get("location")).toContain("error=invalid-link");
  });

  it("a malformed link is refused outright", async () => {
    resetCookies();
    const res = await confirmRoute(confirmRequest("not-a-real-token"));
    expect(res.headers.get("location")).toContain("error=invalid-link");
  });
});
