import { NextRequest } from "next/server";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { createAdminClient } from "@/lib/supabase/admin";
import { POST as loginRoute } from "@/app/api/auth/login/route";
import { POST as mfaRoute } from "@/app/api/auth/mfa/route";
import { POST as enrolRoute } from "@/app/api/auth/mfa/enrol/route";
import { POST as enrolConfirmRoute } from "@/app/api/auth/mfa/enrol/confirm/route";
import { freshTotp } from "./totp";
import { resetCookies } from "./next-headers-stub";

/**
 * Auth flow helpers for integration tests.
 *
 * These drive the REAL route handlers against the REAL Supabase project — the
 * only fake part is the cookie jar standing in for the browser (see
 * next-headers-stub.ts).
 *
 * MFA budget warning: Supabase caps challenge/verify at 15/hour PER IP, shared
 * across the whole suite (and everyone else on the network). Every
 * `enrolAndVerify` and `completeMfa` spends one. Design tests to verify as few
 * times as possible.
 */

export interface TestCredentials {
  id: string;
  email: string;
  password: string;
  /** TOTP secret — present once a factor has been enrolled. */
  secret?: string;
}

export function jsonRequest(
  url: string,
  body: unknown,
  method = "POST",
): NextRequest {
  return new NextRequest(`http://localhost:3010${url}`, {
    method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function readJson(res: Response): Promise<Record<string, unknown>> {
  try {
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

/**
 * Create a confirmed user with a known password and a `profiles` row.
 * No MFA factor — the account starts in the bootstrap state.
 */
export async function createPasswordUser(
  role: "admin" | "editor" = "editor",
  status: "active" | "invited" | "disabled" = "active",
): Promise<TestCredentials> {
  const email = `test-auth-${crypto.randomUUID()}@example.com`;
  const password = `Pw!${crypto.randomUUID()}`;
  const admin = createAdminClient();

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) throw error;

  await db.insert(profiles).values({ id: data.user.id, email, role, status });
  return { id: data.user.id, email, password };
}

/** Delete the auth user (profiles cascades). Safe to call in afterAll. */
export async function deleteUsers(
  ...users: Array<TestCredentials | string | undefined>
): Promise<void> {
  const admin = createAdminClient();
  for (const u of users) {
    if (!u) continue;
    const id = typeof u === "string" ? u : u.id;
    await admin.auth.admin.deleteUser(id).catch(() => {});
  }
}

/** Password step of sign-in, into the CURRENT cookie jar. */
export async function signIn(user: TestCredentials) {
  const res = await loginRoute(
    jsonRequest("/api/auth/login", {
      email: user.email,
      password: user.password,
    }),
  );
  return { status: res.status, body: await readJson(res) };
}

/** MFA step of sign-in. Costs one verify against the 15/hour IP budget. */
export async function completeMfa(secret: string) {
  const code = await freshTotp(secret);
  const res = await mfaRoute(jsonRequest("/api/auth/mfa", { code }));
  return { status: res.status, body: await readJson(res) };
}

/** Begin enrolment for the currently signed-in (bootstrap) session. */
export async function beginEnrol() {
  const res = await enrolRoute();
  return { status: res.status, body: await readJson(res) };
}

/**
 * Enrol and verify a factor for the currently signed-in bootstrap session.
 * Leaves the session at aal2. Costs one verify. Returns the TOTP secret.
 */
export async function enrolAndVerify(): Promise<string> {
  const enrol = await beginEnrol();
  if (enrol.status !== 200) {
    throw new Error(`enrol failed: ${enrol.status} ${JSON.stringify(enrol.body)}`);
  }
  const secret = enrol.body.secret as string;
  const factorId = enrol.body.factorId as string;
  const code = await freshTotp(secret);
  const res = await enrolConfirmRoute(
    jsonRequest("/api/auth/mfa/enrol/confirm", { factorId, code }),
  );
  if (res.status !== 200) {
    throw new Error(
      `enrol confirm failed: ${res.status} ${JSON.stringify(await readJson(res))}`,
    );
  }
  return secret;
}

/**
 * Create a user with a verified factor, signed in at aal2 in a fresh jar.
 * Costs ONE verify. Returns credentials including the TOTP secret.
 */
export async function createEnrolledUser(
  role: "admin" | "editor" = "editor",
): Promise<TestCredentials> {
  const user = await createPasswordUser(role);
  resetCookies();
  const login = await signIn(user);
  if (login.status !== 200 || login.body.next !== "enrol") {
    throw new Error(
      `expected bootstrap login, got ${login.status} ${JSON.stringify(login.body)}`,
    );
  }
  user.secret = await enrolAndVerify();
  return user;
}
