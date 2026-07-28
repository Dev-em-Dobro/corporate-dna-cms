/**
 * Upload each solution's banner background image to Bunny, create a
 * media_assets row, and set it as `bannerMediaId` on the matching published
 * `solution` entry (then re-publish so the read API resolves `bannerUrl` and
 * the site's SolutionView renders it as the hero background).
 *
 * Reuses the real media pipeline (validate -> processImage -> uploadToBunny),
 * so PNGs are compressed to WebP and served from the CDN exactly like an admin
 * upload of the "Banner background image" field.
 *
 * Usage:
 *   npx tsx scripts/attach-solution-banners.ts          # apply (skip if set)
 *   npx tsx scripts/attach-solution-banners.ts --force   # replace existing banner
 *
 * Idempotent: a solution that already has a bannerMediaId is skipped unless
 * --force is passed.
 */
try {
  process.loadEnvFile(".env.local");
} catch {
  // no .env.local — rely on the shell environment
}

import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";

const LOCALE = "en";
const FORCE = process.argv.includes("--force");
const BANNER_DIR = "E:/projetos/consulting-dna-corporate/public/solutions-banners";

/** solution slug -> banner file (all PNGs). */
const BANNERS: Array<{ slug: string; file: string }> = [
  { slug: "executive-coaching", file: "Executive Coaching.png" },
  { slug: "high-performing-teams", file: "High Performing Teams.png" },
  { slug: "asian-talent-development", file: "asian-talent-development.png" },
  { slug: "women-in-leadership", file: "Women In Leadership.png" },
  { slug: "culture-transformation", file: "culture-transformation-banner.png" },
  { slug: "inclusion-diversity", file: "diversification.png" },
];

async function main() {
  const { and, eq, isNull } = await import("drizzle-orm");
  const { db } = await import("../db");
  const { contentEntries, mediaAssets, profiles } = await import("../db/schema");
  const { validateUpload } = await import("../lib/media/validate");
  const { processImage } = await import("../lib/media/image");
  const { uploadToBunny } = await import("../lib/media/bunny");
  const { updateEntry, publishEntry } = await import("../lib/content/entries");

  const [admin] = await db
    .select({ id: profiles.id, email: profiles.email })
    .from(profiles)
    .where(and(eq(profiles.role, "admin"), eq(profiles.status, "active")))
    .limit(1);
  if (!admin) {
    console.error("No active admin profile found. Run `npm run seed:admin`.");
    process.exit(1);
  }
  console.log(`Acting as admin: ${admin.email}${FORCE ? "  (FORCE)" : ""}\n`);

  let attached = 0;
  let skipped = 0;

  for (const { slug, file } of BANNERS) {
    const [entry] = await db
      .select()
      .from(contentEntries)
      .where(
        and(
          eq(contentEntries.type, "solution"),
          eq(contentEntries.slug, slug),
          eq(contentEntries.locale, LOCALE),
          isNull(contentEntries.deletedAt),
        ),
      );

    if (!entry) {
      console.error(`✗ ${slug} — solution entry not found (skipping)`);
      continue;
    }

    const data = entry.data as Record<string, unknown>;
    if (!FORCE && typeof data.bannerMediaId === "string" && data.bannerMediaId) {
      console.log(`• skip  ${slug} — already has bannerMediaId (use --force)`);
      skipped++;
      continue;
    }

    // --- upload the banner through the real media pipeline ---
    const bytes = new Uint8Array(readFileSync(`${BANNER_DIR}/${file}`));
    const mimeType = "image/png";
    const check = validateUpload(mimeType, bytes.byteLength);
    if (!check.ok) {
      console.error(`✗ ${slug} — ${check.error}`);
      continue;
    }

    const processed = await processImage(bytes, mimeType, "png");
    const base = String(data.title ?? slug);
    const path = `uploads/${randomUUID()}-${slug}-banner.${processed.ext}`;
    const { deliveryUrl, bunnyPath } = await uploadToBunny(
      path,
      processed.bytes,
      processed.mimeType,
    );

    const [asset] = await db
      .insert(mediaAssets)
      .values({
        filename: file,
        mimeType: processed.mimeType,
        sizeBytes: processed.bytes.byteLength,
        width: processed.width,
        height: processed.height,
        bunnyPath,
        deliveryUrl,
        altText: `${base} banner`,
        uploadedBy: admin.id,
      })
      .returning();

    // --- set the banner and re-publish ---
    const upd = await updateEntry("solution", entry.id, {
      data: { ...data, bannerMediaId: asset.id },
      actorId: admin.id,
    });
    if (!upd.ok) {
      console.error(`✗ ${slug} — update failed:`, upd.errors);
      continue;
    }

    const pub = await publishEntry("solution", entry.id, admin.id);
    if (!pub.ok) {
      console.error(`  banner set but re-publish failed ${slug}:`, pub.errors);
      continue;
    }

    attached++;
    console.log(
      `✓ ${slug} — ${asset.id} (${processed.width}x${processed.height}) ${deliveryUrl}`,
    );
  }

  console.log(
    `\nSummary: ${attached} attached, ${skipped} skipped, of ${BANNERS.length} total.`,
  );
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
