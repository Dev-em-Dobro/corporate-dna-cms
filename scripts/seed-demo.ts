/**
 * Seed the LOCAL demo database with sanitized, 100% fictitious content so the
 * CMS admin can be recorded for a marketing creative without exposing any real
 * client data (names, companies, logos).
 *
 * Seeds one of each visible type: a login profile, 4 placeholder media assets,
 * and 1 case / solution / insight / person / home — all published.
 *
 * Usage:  npm run seed:demo   (after `docker compose -f docker-compose.demo.yml up -d`
 *                              and `npm run db:migrate:demo`)
 * Idempotent: skips content that already exists (matched by type + slug).
 *
 * NOTE: loads .env.demo, so it only ever touches the throwaway Docker Postgres.
 */
export {};

process.loadEnvFile(".env.demo");

const LOCALE = "en";

// Fixed ids so re-runs reference the same placeholder media (idempotent).
const MEDIA = {
  caseLogo: "a0000000-0000-4000-8000-000000000001",
  solutionBanner: "a0000000-0000-4000-8000-000000000002",
  insightCover: "a0000000-0000-4000-8000-000000000003",
  personPhoto: "a0000000-0000-4000-8000-000000000004",
} as const;

// Placeholder images served over plain <img> (the admin does not use next/image),
// so any external URL loads with no domain allow-list needed.
const PLACEHOLDER = {
  caseLogo: "https://placehold.co/240x96/2563eb/ffffff?text=ACME",
  solutionBanner: "https://picsum.photos/seed/demostudio-solution/1200/675",
  insightCover: "https://picsum.photos/seed/demostudio-insight/1200/675",
  personPhoto: "https://i.pravatar.cc/480?img=12",
} as const;

async function main() {
  const { and, eq, isNull, sql } = await import("drizzle-orm");
  const { db } = await import("../db");
  const { contentEntries, profiles, mediaAssets } = await import("../db/schema");
  const { createEntry, publishEntry } = await import("../lib/content/entries");
  const { createClient } = await import("@supabase/supabase-js");

  // 1. Resolve the Supabase user id you log in with — guards.ts matches the
  //    session sub against profiles.id, so the demo profile MUST use that id.
  const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!supaUrl || !serviceKey || !adminEmail) {
    console.error(
      "Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / ADMIN_EMAIL in .env.demo",
    );
    process.exit(1);
  }
  const supabase = createClient(supaUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: list, error } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (error) {
    console.error("Could not list Supabase users:", error.message);
    process.exit(1);
  }
  const user = list.users.find(
    (u) => u.email?.toLowerCase() === adminEmail.toLowerCase(),
  );
  if (!user) {
    console.error(
      `No Supabase user with email ${adminEmail}. Create it (npm run seed:admin against the real env) first.`,
    );
    process.exit(1);
  }
  const userId = user.id;
  const displayEmail = "admin@demostudio.dev"; // fictitious byline shown in the admin

  // 2. Satisfy the profiles -> auth.users FK on the local DB, then the profile.
  await db.execute(
    sql`INSERT INTO auth.users (id, email) VALUES (${userId}, ${displayEmail})
        ON CONFLICT (id) DO NOTHING`,
  );
  await db
    .insert(profiles)
    .values({
      id: userId,
      email: displayEmail,
      role: "admin",
      status: "active",
    })
    .onConflictDoNothing();
  console.log(`• profile ready (${displayEmail})`);

  // 3. Placeholder media assets (deliveryUrl wins over bunnyPath in media-urls.ts).
  await db
    .insert(mediaAssets)
    .values([
      row(MEDIA.caseLogo, "acme-logo.png", "image/png", PLACEHOLDER.caseLogo, 240, 96),
      row(MEDIA.solutionBanner, "solution-banner.jpg", "image/jpeg", PLACEHOLDER.solutionBanner, 1200, 675),
      row(MEDIA.insightCover, "insight-cover.jpg", "image/jpeg", PLACEHOLDER.insightCover, 1200, 675),
      row(MEDIA.personPhoto, "person-photo.jpg", "image/jpeg", PLACEHOLDER.personPhoto, 480, 480),
    ])
    .onConflictDoNothing();
  console.log("• media placeholders ready");

  function row(
    id: string,
    filename: string,
    mimeType: string,
    deliveryUrl: string,
    width: number,
    height: number,
  ) {
    return {
      id,
      filename,
      mimeType,
      sizeBytes: 12345,
      width,
      height,
      bunnyPath: `demo/${filename}`,
      deliveryUrl,
      altText: "Demo placeholder",
      uploadedBy: userId,
    };
  }

  // 4. One published entry of each visible type.
  const entries: Array<{ type: Parameters<typeof createEntry>[0]; slug: string; data: Record<string, unknown> }> = [
    {
      type: "case",
      slug: "acme-robotics-culture-at-scale",
      data: {
        tags: ["Transformation", "Culture"],
        facets: {
          industry: ["Technology"],
          service: ["Culture Design"],
          region: ["Europe"],
          outcome: ["Engagement +40%"],
        },
        title: "Acme Robotics — Rebuilding Culture at Scale",
        quote:
          "The program reshaped how our teams collaborate across three continents.",
        quoter: "Jordan Lee, Chief People Officer",
        introduction:
          "How a fast-scaling robotics company realigned its culture after tripling headcount in two years.",
        text: "<p>Acme Robotics partnered with us to redesign its operating rhythms, leadership rituals and shared language for decision-making.</p>",
        brandColor: "#2563eb",
        logoMediaId: MEDIA.caseLogo,
      },
    },
    {
      type: "solution",
      slug: "culture-operating-system",
      data: {
        title: "Culture Operating System",
        bannerMediaId: MEDIA.solutionBanner,
        problemStatement:
          "Leaders lack a shared language to diagnose and evolve their culture as they scale.",
        body: "<p>A practical framework that turns culture from an abstract value into a set of observable, coachable behaviours.</p>",
        proofRefs: [
          {
            quote: "A turning point for our leadership team.",
            author: "Sam Rivera",
            role: "VP People, Nova Foods",
          },
        ],
      },
    },
    {
      type: "insight",
      slug: "three-signals-your-culture-is-drifting",
      data: {
        tags: ["Leadership"],
        title: "Three Signals Your Culture Is Drifting",
        author: "Alex Morgan",
        excerpt:
          "Culture rarely fails loudly. It erodes in small, quiet signals leaders learn to ignore.",
        body: "<p>Here are three early warning signs that the culture you designed is quietly drifting from the culture you now have.</p>",
        coverMediaId: MEDIA.insightCover,
        publishedDate: "2026-08-01",
        authorApproved: true,
      },
    },
    {
      type: "person",
      slug: "alex-morgan",
      data: {
        name: "Alex Morgan",
        role: "Principal Consultant",
        bio: "Alex partners with executive teams to design cultures that scale without losing their edge.",
        photoMediaId: MEDIA.personPhoto,
        linkedin: "https://www.linkedin.com/in/example",
      },
    },
    {
      type: "page_home",
      slug: "home",
      data: { years: "18", countries: "36", faculty: "75", sponsoredPct: "90%" },
    },
  ];

  for (const e of entries) {
    const [existing] = await db
      .select({ id: contentEntries.id })
      .from(contentEntries)
      .where(
        and(
          eq(contentEntries.type, e.type),
          eq(contentEntries.slug, e.slug),
          eq(contentEntries.locale, LOCALE),
          isNull(contentEntries.deletedAt),
        ),
      );
    if (existing) {
      console.log(`• skip — ${e.type}/${e.slug} already exists`);
      continue;
    }
    const created = await createEntry(e.type, {
      data: e.data,
      locale: LOCALE,
      slug: e.slug,
      actorId: userId,
    });
    if (!created.ok) {
      console.error(`✗ ${e.type}/${e.slug} failed validation:`, created.errors);
      process.exit(1);
    }
    const published = await publishEntry(e.type, created.entry.id, userId);
    if (!published.ok) {
      console.error(`✗ ${e.type}/${e.slug} failed publish:`, published.errors);
      process.exit(1);
    }
    console.log(`✓ ${e.type}/${e.slug} created & published`);
  }

  console.log("\nDemo seed complete. Log in at http://localhost:3010 with your real credentials.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
