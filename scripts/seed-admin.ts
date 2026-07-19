/**
 * Seed the first administrator with mandatory TOTP enrolment.
 *
 * Usage:
 *   ADMIN_EMAIL=you@corp.com ADMIN_PASSWORD='StrongPass!' npm run seed:admin
 *   # or: npm run seed:admin -- you@corp.com 'StrongPass!'
 *
 * Prints the otpauth:// URI + secret to add to an authenticator app.
 */
// Load .env.local before anything else (this standalone script isn't run by
// Next). Static imports are hoisted, so ../db must be imported dynamically
// inside main() — otherwise it initialises before DATABASE_URL is set.
try {
  process.loadEnvFile(".env.local");
} catch {
  // no .env.local — rely on the shell environment
}

async function main() {
  const { eq } = await import("drizzle-orm");
  const { db } = await import("../db");
  const { users } = await import("../db/schema");
  const { hashPassword } = await import("../lib/auth/password");
  const { generateTotpSecret, totpKeyUri } = await import("../lib/auth/totp");

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
