/**
 * Seed the first administrator with mandatory TOTP enrolment.
 *
 * Usage:
 *   ADMIN_EMAIL=you@corp.com ADMIN_PASSWORD='StrongPass!' npm run seed:admin
 *   # or: npm run seed:admin -- you@corp.com 'StrongPass!'
 *
 * Prints the otpauth:// URI + secret to add to an authenticator app.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Minimal .env.local loader (this standalone script isn't run by Next).
try {
  const raw = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
  for (const line of raw.split("\n")) {
    const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) {
      let v = m[2].trim();
      if (
        (v.startsWith('"') && v.endsWith('"')) ||
        (v.startsWith("'") && v.endsWith("'"))
      )
        v = v.slice(1, -1);
      process.env[m[1]] = v;
    }
  }
} catch {
  // no .env.local — rely on the shell environment
}

import { eq } from "drizzle-orm";
import { db } from "../db";
import { users } from "../db/schema";
import { hashPassword } from "../lib/auth/password";
import { generateTotpSecret, totpKeyUri } from "../lib/auth/totp";

async function main() {
  const email = (process.env.ADMIN_EMAIL ?? process.argv[2] ?? "")
    .trim()
    .toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? process.argv[3] ?? "";

  if (!email || !password) {
    console.error(
      "Usage: ADMIN_EMAIL=.. ADMIN_PASSWORD=.. npm run seed:admin  (or pass as args)",
    );
    process.exit(1);
  }

  const passwordHash = await hashPassword(password);
  const totpSecret = generateTotpSecret();

  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.email, email));

  if (existing) {
    await db
      .update(users)
      .set({
        passwordHash,
        role: "admin",
        mfaEnabled: true,
        totpSecret,
        status: "active",
        updatedAt: new Date(),
      })
      .where(eq(users.id, existing.id));
    console.log(`Updated existing user as admin: ${email}`);
  } else {
    await db.insert(users).values({
      email,
      passwordHash,
      role: "admin",
      mfaEnabled: true,
      totpSecret,
      status: "active",
    });
    console.log(`Created admin: ${email}`);
  }

  console.log("\nAdd this to your authenticator app:");
  console.log("  Secret:", totpSecret);
  console.log("  otpauth URI:", totpKeyUri(email, totpSecret));
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
