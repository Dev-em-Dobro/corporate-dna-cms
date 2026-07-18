import { generateSecret, generateURI, verify } from "otplib";

const ISSUER = "Corporate DNA CMS";

export function generateTotpSecret(): string {
  return generateSecret();
}

/** otpauth:// URI to render as a QR code during enrolment. */
export function totpKeyUri(email: string, secret: string): string {
  return generateURI({ issuer: ISSUER, label: email, secret });
}

export async function verifyTotp(
  token: string,
  secret: string,
): Promise<boolean> {
  try {
    const result = await verify({ secret, token });
    return result.valid;
  } catch {
    return false;
  }
}
