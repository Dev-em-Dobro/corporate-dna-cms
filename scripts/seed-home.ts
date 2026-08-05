/**
 * Seed the singleton `page_home` entry that holds the homepage statistics
 * (years / countries / faculty / sponsored %) and publish it, so the site's
 * GET /api/content/pages/home has data immediately.
 *
 * Usage: npx tsx scripts/seed-home.ts
 * Idempotent: skips if the `home` entry already exists.
 */
// `export {}` marks this file as a module so its top-level consts/functions
// don't share global scope with the other one-off scripts (tsc would otherwise
// flag duplicate declarations like `main`).
export {};

try {
  process.loadEnvFile(".env.local");
} catch {
  // no .env.local — rely on the shell environment
}

const LOCALE = "en";

async function main() {
  const { and, eq, isNull } = await import("drizzle-orm");
  const { db } = await import("../db");
  const { contentEntries, profiles } = await import("../db/schema");
  const { createEntry, publishEntry } = await import("../lib/content/entries");

  const [admin] = await db
    .select({ id: profiles.id, email: profiles.email })
    .from(profiles)
    .where(and(eq(profiles.role, "admin"), eq(profiles.status, "active")))
    .limit(1);
  if (!admin) {
    console.error("No active admin profile found. Run `npm run seed:admin`.");
    process.exit(1);
  }

  const [existing] = await db
    .select({ id: contentEntries.id })
    .from(contentEntries)
    .where(
      and(
        eq(contentEntries.type, "page_home"),
        eq(contentEntries.slug, "home"),
        eq(contentEntries.locale, LOCALE),
        isNull(contentEntries.deletedAt),
      ),
    );
  if (existing) {
    console.log("• skip — home statistics already exist");
    process.exit(0);
  }

  const result = await createEntry("page_home", {
    data: { years: "18", countries: "36", faculty: "75", sponsoredPct: "90%" },
    locale: LOCALE,
    slug: "home",
    actorId: admin.id,
  });
  if (!result.ok) {
    console.error("✗ validation:", result.errors);
    process.exit(1);
  }
  const pub = await publishEntry("page_home", result.entry.id, admin.id);
  if (!pub.ok) {
    console.error("✗ publish:", pub.errors);
    process.exit(1);
  }
  console.log("✓ home statistics created & published");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
