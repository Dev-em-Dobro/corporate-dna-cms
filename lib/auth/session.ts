import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

/**
 * Custom signed-cookie sessions (jose). We deliberately do NOT use Auth.js's
 * built-in sign-in flow because Phase 1 needs a two-step login (password, then
 * a mandatory TOTP second factor for admins — FR-015) which is cleaner to model
 * as: verify password -> issue short-lived MFA challenge -> verify TOTP ->
 * establish the session cookie.
 */

const enc = new TextEncoder();
const SESSION_COOKIE = "cdna_session";
const SESSION_TTL_SECONDS = 60 * 60 * 8; // 8h

export type Role = "admin" | "editor";

export interface SessionPayload {
  sub: string; // user id
  role: Role;
  email: string;
}

function key(secretName: "AUTH_SECRET" | "PREVIEW_TOKEN_SECRET") {
  const s = process.env[secretName];
  if (!s) throw new Error(`${secretName} is not set`);
  return enc.encode(s);
}

export async function createSession(p: SessionPayload): Promise<void> {
  const token = await new SignJWT({ role: p.role, email: p.email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(p.sub)
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(key("AUTH_SECRET"));

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function readSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const raw = store.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  try {
    const { payload } = await jwtVerify(raw, key("AUTH_SECRET"));
    return {
      sub: String(payload.sub),
      role: payload.role as Role,
      email: String(payload.email),
    };
  } catch {
    return null;
  }
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

// --- MFA challenge (stateless, short-lived; no session yet) --------------------

export async function createMfaChallenge(userId: string): Promise<string> {
  return new SignJWT({ typ: "mfa" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(key("AUTH_SECRET"));
}

export async function verifyMfaChallenge(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, key("AUTH_SECRET"));
    if (payload.typ !== "mfa") return null;
    return String(payload.sub);
  } catch {
    return null;
  }
}

// --- Preview tokens (draft-aware preview, D5) ---------------------------------

export async function createPreviewToken(
  entryId: string,
  ttl = "30m",
): Promise<string> {
  return new SignJWT({ typ: "preview" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(entryId)
    .setIssuedAt()
    .setExpirationTime(ttl)
    .sign(key("PREVIEW_TOKEN_SECRET"));
}

export async function verifyPreviewToken(
  token: string,
  entryId: string,
): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, key("PREVIEW_TOKEN_SECRET"));
    return payload.typ === "preview" && String(payload.sub) === entryId;
  } catch {
    return false;
  }
}
