import { SignJWT, jwtVerify } from "jose";

/**
 * Signed preview tokens for the draft-aware preview renderer.
 *
 * User authentication moved to Supabase Auth — sessions, the MFA challenge and
 * password hashing all live there now. What remains here is deliberately NOT
 * user auth: a preview token grants read access to one specific draft entry
 * for a short window, and is signed with its own secret so it can never be
 * confused for a session.
 */

const enc = new TextEncoder();

function key() {
  const s = process.env.PREVIEW_TOKEN_SECRET;
  if (!s) throw new Error("PREVIEW_TOKEN_SECRET is not set");
  return enc.encode(s);
}

export async function createPreviewToken(
  entryId: string,
  ttl = "30m",
): Promise<string> {
  return new SignJWT({ typ: "preview" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(entryId)
    .setIssuedAt()
    .setExpirationTime(ttl)
    .sign(key());
}

export async function verifyPreviewToken(
  token: string,
  entryId: string,
): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, key());
    return payload.typ === "preview" && String(payload.sub) === entryId;
  } catch {
    return false;
  }
}
