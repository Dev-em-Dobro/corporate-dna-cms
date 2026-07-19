import { describe, it, expect, afterAll } from "vitest";
import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { POST as passwordRoute } from "@/app/api/auth/password/route";
import { GET as confirmRoute } from "@/app/auth/confirm/route";
import { resetCookies } from "../helpers/next-headers-stub";
import {
  createEnrolledUser,
  deleteUsers,
  signIn,
  completeMfa,
  jsonRequest,
  readJson,
  type TestCredentials,
} from "../helpers/auth";

const d =
  process.env.DATABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL
    ? describe
    : describe.skip;

// T064 — US5: completing a password reset still requires the second factor.
// A recovery link grants only an aal1 session; if the password could change
// from there, "reset my password" would be a clean bypass of MFA — an
// attacker with mailbox access would own the account outright.
d("US5 recovery does not bypass MFA", () => {
  let user: TestCredentials | undefined;

  afterAll(async () => {
    await deleteUsers(user);
  });

  it("password change after a recovery link demands the factor first", async () => {
    user = await createEnrolledUser("editor");
    const newPassword = `Pw!${crypto.randomUUID()}`;

    // Follow a recovery link into a fresh browser: aal1 session.
    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.generateLink({
      type: "recovery",
      email: user.email,
    });
    expect(error).toBeNull();
    const tokenHash = data?.properties?.hashed_token as string;
    expect(tokenHash).toBeTruthy();

    resetCookies();
    const confirmed = await confirmRoute(
      new NextRequest(
        `http://localhost:3010/auth/confirm?token_hash=${encodeURIComponent(tokenHash)}&type=recovery`,
      ),
    );
    expect(confirmed.headers.get("location")).toContain(
      "/auth/update-password",
    );

    // At aal1 with a verified factor enrolled: the change is refused.
    const refused = await passwordRoute(
      jsonRequest("/api/auth/password", { password: newPassword }),
    );
    expect(refused.status).toBe(403);
    expect((await readJson(refused)).next).toBe("mfa");

    // Satisfy the factor, retry: accepted.
    const mfa = await completeMfa(user.secret!);
    expect(mfa.status, JSON.stringify(mfa.body)).toBe(200);
    const accepted = await passwordRoute(
      jsonRequest("/api/auth/password", { password: newPassword }),
    );
    expect(accepted.status, JSON.stringify(await readJson(accepted))).toBe(200);

    // The new password works — and STILL lands on the challenge, never
    // straight in.
    resetCookies();
    const login = await signIn({ ...user, password: newPassword });
    expect(login.status).toBe(200);
    expect(login.body.next).toBe("mfa");
  });
});
