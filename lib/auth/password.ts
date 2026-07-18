import { hash, verify } from "@node-rs/argon2";

/** Hash a plaintext password (argon2id, prebuilt binaries via @node-rs/argon2). */
export function hashPassword(plain: string): Promise<string> {
  return hash(plain);
}

/** Verify a plaintext password against a stored hash. */
export async function verifyPassword(
  storedHash: string,
  plain: string,
): Promise<boolean> {
  try {
    return await verify(storedHash, plain);
  } catch {
    return false;
  }
}
