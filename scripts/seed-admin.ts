/**
 * Seed the first administrator.
 *
 * Usage:
 *   ADMIN_EMAIL=you@corp.com ADMIN_PASSWORD='StrongPass!' npm run seed:admin
 *   # or: npm run seed:admin -- you@corp.com 'StrongPass!'
 *
 * Note what this does NOT do: enrol a second factor. Supabase has no API to
 * create an MFA factor on another user's behalf, so the seeded admin lands in
 * the bootstrap state and enrols their own on first sign-in. That is exactly
 * what requireEnrolmentBootstrap exists to permit — this script is the reason
 * that guard has to exist at all.
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
  const { profiles } = await import("../db/schema");
  const { createAdminClient } = await import("../lib/supabase/admin");

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

  const admin = createAdminClient();

  // Find an existing auth user by email rather than assuming a clean slate,
  // so re-running the script is safe.
  const { data: list, error: listError } = await admin.auth.admin.listUsers();
  if (listError) throw listError;
  const existingAuthUser = list.users.find(
    (u) => u.email?.toLowerCase() === email,
  );

  let userId: string;

  if (existingAuthUser) {
    const { error } = await admin.auth.admin.updateUserById(
      existingAuthUser.id,
      { password, email_confirm: true, ban_duration: "none" },
    );
    if (error) throw error;
    userId = existingAuthUser.id;
    console.log(`Updated existing auth user: ${email}`);
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error) throw error;
    userId = data.user.id;
    console.log(`Created auth user: ${email}`);
  }

  const [existingProfile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, userId));

  if (existingProfile) {
    await db
      .update(profiles)
      .set({ role: "admin", status: "active", email, updatedAt: new Date() })
      .where(eq(profiles.id, userId));
    console.log(`Updated profile as admin: ${email}`);
  } else {
    await db
      .insert(profiles)
      .values({ id: userId, email, role: "admin", status: "active" });
    console.log(`Created profile as admin: ${email}`);
  }

  console.log("\nSign in at /login with this email and password.");
  console.log(
    "You will be sent straight to second-factor enrolment — that is expected,",
  );
  console.log("and no admin function is reachable until you complete it.");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
