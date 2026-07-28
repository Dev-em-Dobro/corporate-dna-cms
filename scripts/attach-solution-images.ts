/**
 * Attach the legacy-site solution infographics to each published `solution`
 * entry's rich-text body, then re-publish so the public read API + site cache
 * pick up the change.
 *
 * Each image is uploaded through the real media pipeline
 * (validate -> processImage -> uploadToBunny), a media_assets row is created
 * for provenance, and an inline <img src="<cdn>"> is spliced into the body —
 * exactly the shape the Quill editor produces (see lib/content/sanitize.ts,
 * which allow-lists <img src|alt>) and that the site's RichText component
 * already styles ([&_img]:w-full ...).
 *
 * Placement: every solution body has a "…illustrative tools that activate the
 * magic of the 5H©:" paragraph followed by a <ul> naming those tools. The
 * images ARE those tools, so we insert them immediately after that <ul> — the
 * one spot in the copy that introduces them.
 *
 * Usage:
 *   npx tsx scripts/attach-solution-images.ts          # apply
 *   npx tsx scripts/attach-solution-images.ts --dry     # preview, no writes
 *
 * Idempotent: a solution whose body already contains an <img> is skipped, so
 * re-running after a partial failure is safe.
 */
try {
  process.loadEnvFile(".env.local");
} catch {
  // no .env.local — rely on the shell environment
}

import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";

const LOCALE = "en";
const DRY = process.argv.includes("--dry");
const IMG_DIR = "E:/projetos/consulting-dna-corporate/public/cdna-solutions-images";
const ANCHOR = "illustrative tools that activate the magic";

/** Ordered images per solution slug: local file + alt/caption label. */
const PLAN: Record<string, Array<{ file: string; alt: string }>> = {
  "executive-coaching": [
    { file: "executive-coaching/our-coaching-journey.jpg", alt: "Executive Coaching Roadmap" },
    {
      file: "executive-coaching/Executive-Coaching-Intake-Reflective-Questions.jpg",
      alt: "Executive Coaching Intake – Reflective Questions",
    },
  ],
  "high-performing-teams": [
    { file: "high-performing-team/Framework.jpg", alt: "High Performing Teams Framework" },
    { file: "high-performing-team/3-to-6-month-Roadmap.jpg", alt: "3 to 6-month Roadmap" },
    { file: "high-performing-team/9-to-12-month-Roadmap.jpg", alt: "9 to 12-month Roadmap" },
    { file: "high-performing-team/Scoping-with-team-Leaders.jpg", alt: "Scoping with Team Leaders" },
    { file: "high-performing-team/FINAL-HPT-Tools-2.jpg", alt: "High Performing Teams Tools" },
    { file: "high-performing-team/FINAL-HPT-Tools-3.jpg", alt: "High Performing Teams Tools" },
  ],
  "asian-talent-development": [
    { file: "asian-talent-development/2025-Asian-Talent-Shifts.jpg", alt: "2025 Asian Talent Shifts" },
    { file: "asian-talent-development/Global-Asian-Leader-Model.jpg", alt: "Global-Asian Leader Model" },
  ],
  "women-in-leadership": [
    {
      file: "woman-in-leadership/Participant-Feedback.jpg",
      alt: "Participants' Feedback from the Women in Leadership Programme",
    },
    {
      file: "woman-in-leadership/Client-Success.jpg",
      alt: "Client Success — Women in Leadership Programme",
    },
  ],
  "culture-transformation": [
    {
      file: "culture-transformation/10-Planets-of-Transformation.jpg",
      alt: "CDNA's 10 Planets of Transformation",
    },
    {
      file: "culture-transformation/10-Principles-of-Leading-Culture-Change.jpg",
      alt: "CDNA's 10 Principles of Leading Culture Change",
    },
  ],
  "inclusion-diversity": [
    { file: "inclusion-diversity/Twin-Tracks-Roadmap.jpg", alt: "Twin Tracks Roadmap" },
    { file: "inclusion-diversity/Unconscious-Biases-Model.jpg", alt: "Unconscious Biases Model" },
  ],
};

/** Insert `block` right after the first </ul> that follows the anchor phrase. */
function spliceAfterToolsList(body: string, block: string): string | null {
  const anchorIdx = body.indexOf(ANCHOR);
  if (anchorIdx === -1) return null;
  const ulClose = body.indexOf("</ul>", anchorIdx);
  if (ulClose === -1) return null;
  const at = ulClose + "</ul>".length;
  return body.slice(0, at) + "\n" + block + body.slice(at);
}

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
  console.log(`Acting as admin: ${admin.email}${DRY ? "  (DRY RUN)" : ""}\n`);

  let done = 0;
  let skipped = 0;

  for (const [slug, images] of Object.entries(PLAN)) {
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
    const body = String(data.body ?? "");

    if (/<img\b/i.test(body)) {
      console.log(`• skip  ${slug} — body already has an <img>`);
      skipped++;
      continue;
    }
    if (!body.includes(ANCHOR)) {
      console.error(`✗ ${slug} — anchor phrase not found in body (skipping)`);
      continue;
    }

    // Upload each image and build the inline <img> blocks.
    const blocks: string[] = [];
    for (const { file, alt } of images) {
      const path = `${IMG_DIR}/${file}`;
      const bytes = new Uint8Array(readFileSync(path));
      const mimeType = "image/jpeg";
      const check = validateUpload(mimeType, bytes.byteLength);
      if (!check.ok) {
        console.error(`✗ ${slug} — ${file}: ${check.error}`);
        throw new Error("validation failed");
      }

      if (DRY) {
        blocks.push(`<p><img src="(dry-run)" alt="${alt}"></p>`);
        console.log(`    would upload ${file}  ->  alt="${alt}"`);
        continue;
      }

      const processed = await processImage(bytes, mimeType, "jpg");
      const base = file.split("/").pop()!.replace(/\.[^.]+$/, "");
      const bunnyKey = `uploads/${randomUUID()}-${base}.${processed.ext}`;
      const { deliveryUrl, bunnyPath } = await uploadToBunny(
        bunnyKey,
        processed.bytes,
        processed.mimeType,
      );

      const [asset] = await db
        .insert(mediaAssets)
        .values({
          filename: file.split("/").pop()!,
          mimeType: processed.mimeType,
          sizeBytes: processed.bytes.byteLength,
          width: processed.width,
          height: processed.height,
          bunnyPath,
          deliveryUrl,
          altText: alt,
          uploadedBy: admin.id,
        })
        .returning();

      blocks.push(`<p><img src="${deliveryUrl}" alt="${alt}"></p>`);
      console.log(
        `    ✓ ${file}  ${asset.id}  (${processed.width}x${processed.height})`,
      );
    }

    const newBody = spliceAfterToolsList(body, blocks.join("\n"));
    if (!newBody) {
      console.error(`✗ ${slug} — could not locate tools <ul> to splice after`);
      continue;
    }

    if (DRY) {
      console.log(`  (dry) ${slug} — would add ${images.length} image(s), body ${body.length} -> ${newBody.length}\n`);
      done++;
      continue;
    }

    const upd = await updateEntry("solution", entry.id, {
      data: { ...data, body: newBody },
      actorId: admin.id,
    });
    if (!upd.ok) {
      console.error(`✗ ${slug} — update failed:`, upd.errors);
      continue;
    }

    const pub = await publishEntry("solution", entry.id, admin.id);
    if (!pub.ok) {
      console.error(`  images added but re-publish failed ${slug}:`, pub.errors);
      continue;
    }

    done++;
    console.log(`✓ ${slug} — ${images.length} image(s) added & re-published\n`);
  }

  console.log(
    `\nSummary: ${done} updated, ${skipped} skipped, of ${Object.keys(PLAN).length} solutions.`,
  );
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
