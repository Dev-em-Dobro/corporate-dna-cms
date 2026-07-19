import { describe, it, expect, afterAll } from "vitest";
import { POST as enrolConfirmRoute } from "@/app/api/auth/mfa/enrol/confirm/route";
import { resetCookies } from "../helpers/next-headers-stub";
import { freshTotp } from "../helpers/totp";
import {
  createPasswordUser,
  deleteUsers,
  signIn,
  beginEnrol,
  jsonRequest,
  readJson,
  type TestCredentials,
} from "../helpers/auth";

const d =
  process.env.DATABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL
    ? describe
    : describe.skip;

// T026 — US1: enrolment returns a QR payload and a manual-entry secret; the
// secret is not returned again after the factor is verified.
d("US1 enrolment happy path", () => {
  let user: TestCredentials | undefined;

  afterAll(async () => {
    await deleteUsers(user);
  });

  it("returns QR + secret once, and never re-exposes the secret after verification", async () => {
    user = await createPasswordUser("editor");
    resetCookies();

    const login = await signIn(user);
    expect(login.status).toBe(200);
    expect(login.body.next).toBe("enrol");

    const enrol = await beginEnrol();
    expect(enrol.status).toBe(200);
    // QR payload for the scanner, plus the manual-entry fallback (FR-003).
    expect(String(enrol.body.qrCodeSvg)).toMatch(/svg/i);
    expect(typeof enrol.body.secret).toBe("string");
    expect((enrol.body.secret as string).length).toBeGreaterThan(0);
    expect(String(enrol.body.uri)).toContain("otpauth://");
    expect(typeof enrol.body.factorId).toBe("string");

    const secret = enrol.body.secret as string;
    const code = await freshTotp(secret);
    const confirm = await enrolConfirmRoute(
      jsonRequest("/api/auth/mfa/enrol/confirm", {
        factorId: enrol.body.factorId,
        code,
      }),
    );
    expect(confirm.status, JSON.stringify(await readJson(confirm))).toBe(200);

    // Verified: the enrolment endpoint now refuses, so the secret has no
    // second exit path.
    const again = await beginEnrol();
    expect(again.status).toBe(403);
    expect(again.body.secret).toBeUndefined();

    // And a fresh sign-in routes to the challenge — carrying no secret.
    resetCookies();
    const relogin = await signIn(user);
    expect(relogin.status).toBe(200);
    expect(relogin.body.next).toBe("mfa");
    expect(JSON.stringify(relogin.body)).not.toContain(secret);
  });
});
