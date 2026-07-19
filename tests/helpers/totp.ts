import { createHmac } from "node:crypto";

/**
 * Minimal RFC 6238 TOTP for tests.
 *
 * `otplib` was removed from the project on purpose — production never
 * generates codes, only Supabase verifies them. Tests, however, play the role
 * of the authenticator app, so they need code generation. Twenty lines of
 * standard HMAC-SHA1 beats re-adding a dependency the app must not have.
 */

const B32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function base32Decode(input: string): Buffer {
  const clean = input.toUpperCase().replace(/=+$/, "").replace(/[\s-]/g, "");
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const ch of clean) {
    const idx = B32_ALPHABET.indexOf(ch);
    if (idx === -1) throw new Error(`Invalid base32 character: ${ch}`);
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

export function totp(
  secret: string,
  atMs: number = Date.now(),
  stepSeconds = 30,
  digits = 6,
): string {
  const counter = Math.floor(atMs / 1000 / stepSeconds);
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(counter));
  const hmac = createHmac("sha1", base32Decode(secret)).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    (hmac[offset + 1] << 16) |
    (hmac[offset + 2] << 8) |
    hmac[offset + 3];
  return String(code % 10 ** digits).padStart(digits, "0");
}

const lastCodeUsed = new Map<string, string>();

/**
 * A TOTP code guaranteed not to repeat the previous one issued for this
 * secret. GoTrue may reject a code it has already accepted in the same window,
 * so back-to-back verifications (enrol-confirm, then challenge) wait for the
 * next 30s window when necessary. Worst case ~30s — hence the raised
 * testTimeout for integration suites.
 */
export async function freshTotp(secret: string): Promise<string> {
  let code = totp(secret);
  while (code === lastCodeUsed.get(secret)) {
    await new Promise((r) => setTimeout(r, 1_000));
    code = totp(secret);
  }
  lastCodeUsed.set(secret, code);
  return code;
}

/** A code that is definitely wrong for this secret, right now. */
export function wrongTotp(secret: string): string {
  const good = totp(secret);
  const bad = String((Number(good) + 1) % 10 ** 6).padStart(6, "0");
  return bad;
}
