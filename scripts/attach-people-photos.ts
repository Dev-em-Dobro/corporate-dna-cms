/**
 * Upload local team photos to Bunny, create media_assets rows, and attach each
 * as `photoMediaId` on the matching published `person` entry (then re-publish
 * so the public read API + site cache pick up the change).
 *
 * Usage:
 *   npx tsx scripts/attach-people-photos.ts
 *
 * Reuses the real media pipeline (validate -> processImage -> uploadToBunny)
 * exactly like app/api/media/route.ts, so images are compressed to WebP and
 * served from the CDN just as an admin upload would be.
 *
 * Idempotent: a person that already has a photoMediaId is skipped (no dup
 * upload), so re-running after a partial failure is safe.
 */
try {
  process.loadEnvFile(".env.local");
} catch {
  // no .env.local — rely on the shell environment
}

import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";

const LOCALE = "en";
const PHOTO_DIR = "E:/projetos/consulting-dna-corporate/public";

// person slug -> local photo file (all JPEGs). Priyanka has no photo yet.
const PHOTOS: Array<{ slug: string; file: string }> = [
  { slug: "rhea-leckie", file: "rhea.jpg" },
  { slug: "genevieve-james", file: "gen.jpg" },
  { slug: "jon-paul-pritchard", file: "jp.jpg" },
  { slug: "phil-paul", file: "phil.jpg" },
  { slug: "mike-jackson", file: "mike.jpg" },
  { slug: "guilherme-mendes", file: "guilherme.jpg" },
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
  console.log(`Acting as admin: ${admin.email}\n`);

  let attached = 0;
  let skipped = 0;

  for (const { slug, file } of PHOTOS) {
    const [entry] = await db
      .select()
      .from(contentEntries)
      .where(
        and(
          eq(contentEntries.type, "person"),
          eq(contentEntries.slug, slug),
          eq(contentEntries.locale, LOCALE),
          isNull(contentEntries.deletedAt),
        ),
      );

    if (!entry) {
      console.error(`✗ ${slug} — person entry not found (skipping)`);
      continue;
    }

    const data = entry.data as Record<string, unknown>;
    if (typeof data.photoMediaId === "string" && data.photoMediaId) {
      console.log(`• skip  ${slug} — already has photoMediaId`);
      skipped++;
      continue;
    }

    // --- upload the image through the real media pipeline ---
    const bytes = new Uint8Array(readFileSync(`${PHOTO_DIR}/${file}`));
    const mimeType = "image/jpeg";
    const check = validateUpload(mimeType, bytes.byteLength);
    if (!check.ok) {
      console.error(`✗ ${slug} — ${check.error}`);
      continue;
    }

    const processed = await processImage(bytes, mimeType, "jpg");
    const path = `uploads/${randomUUID()}-${slug}.${processed.ext}`;
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
        altText: String(data.name ?? slug),
        uploadedBy: admin.id,
      })
      .returning();

    // --- attach to the person and re-publish ---
    const upd = await updateEntry("person", entry.id, {
      data: { ...data, photoMediaId: asset.id },
      actorId: admin.id,
    });
    if (!upd.ok) {
      console.error(`✗ ${slug} — update failed:`, upd.errors);
      continue;
    }

    const pub = await publishEntry("person", entry.id, admin.id);
    if (!pub.ok) {
      console.error(`  photo set but re-publish failed ${slug}:`, pub.errors);
      continue;
    }

    attached++;
    console.log(
      `✓ ${slug} — ${asset.id} (${processed.width}x${processed.height}) ${deliveryUrl}`,
    );
  }

  console.log(
    `\nSummary: ${attached} attached, ${skipped} skipped, of ${PHOTOS.length} total.`,
  );
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
