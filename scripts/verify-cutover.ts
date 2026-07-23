/**
 * Cutover verification — T071 + T072 (FR-024, SC-004, FR-019).
 *
 * T071: exercises every one of the seven collections end-to-end through the
 * application services on the database the app points at — profile, media
 * asset (real Bunny upload), case study with facets, edit -> second version,
 * restore, publish (media gate + published API), webhook registration, audit
 * trail — and confirms every relationship resolves.
 *
 * T072: deletes the throwaway author via auth.admin and asserts the FK
 * deletion rules this schema deliberately chose over Supabase's documented
 * blanket cascade: audit rows SURVIVE with actor_id nulled and actor_email
 * readable; content, versions and media survive with their author refs nulled.
 *
 * Usage:
 *   npx tsx scripts/verify-cutover.ts            # prints the target, refuses
 *   npx tsx scripts/verify-cutover.ts --yes      # runs
 *
 * Everything it creates is cleaned up afterwards, EXCEPT the audit rows the
 * run produces — the audit log is append-only on principle, and the surviving
 * anonymised rows are precisely the evidence T072 exists to produce.
 * It never touches MFA or sends email, so no shared rate limits are consumed.
 */

// Load .env.local before anything else (standalone script — not run by Next).
// Static imports are hoisted, so app modules are imported dynamically inside
// main(), after the env exists.
try {
  process.loadEnvFile(".env.local");
} catch {
  // no .env.local — rely on the shell environment
}

const ok: string[] = [];
const bad: string[] = [];

function check(name: string, cond: unknown, detail?: string) {
  if (cond) {
    ok.push(name);
    console.log(`  PASS  ${name}`);
  } else {
    bad.push(name);
    console.error(`  FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

// 1x1 transparent PNG.
const PNG_BYTES = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64",
);

async function main() {
  const dbUrl = process.env.DATABASE_URL ?? "";
  const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  if (!dbUrl || !supaUrl || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error(
      "DATABASE_URL / NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are required.",
    );
    process.exit(1);
  }

  const dbHost = new URL(dbUrl.replace(/^postgres(ql)?:/, "http:")).host;
  console.log("Target database:", dbHost);
  console.log("Target Supabase:", supaUrl);

  if (!process.argv.includes("--yes")) {
    console.log(
      "\nThis WRITES to the database above (and uploads/deletes one tiny file",
      "in Bunny). Re-run with --yes to proceed.",
    );
    process.exit(2);
  }

  const { eq, and, isNull } = await import("drizzle-orm");
  const { db } = await import("../db");
  const {
    profiles,
    contentEntries,
    contentVersions,
    caseStudyFacets,
    mediaAssets,
    auditLog,
    webhookEndpoints,
  } = await import("../db/schema");
  const { createEntry, updateEntry, publishEntry, listVersions, restoreVersion } =
    await import("../lib/content/entries");
  const { listPublished } = await import("../lib/content/published");
  const { uploadToBunny, deleteFromBunny } = await import("../lib/media/bunny");
  const { createClient } = await import("@supabase/supabase-js");

  // lib/supabase/admin is `server-only`; a standalone script builds its own.
  const admin = createClient(supaUrl, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const stamp = Math.random().toString(36).slice(2, 8);
  let authorId: string | undefined;
  let authorEmail = "";
  let entryId: string | undefined;
  let mediaId: string | undefined;
  let bunnyPath: string | undefined;
  let webhookId: string | undefined;

  try {
    // ---- T071: the seven collections -----------------------------------

    console.log("\n[1/7] profiles — author");
    authorEmail = `cutover-verify-${stamp}@example.invalid`;
    {
      const { data, error } = await admin.auth.admin.createUser({
        email: authorEmail,
        password: crypto.randomUUID(),
        email_confirm: true,
      });
      if (error) throw error;
      authorId = data.user.id;
      await db.insert(profiles).values({
        id: authorId,
        email: authorEmail,
        role: "editor",
        status: "active",
      });
      const [p] = await db
        .select()
        .from(profiles)
        .where(eq(profiles.id, authorId));
      check("profiles row keyed by auth.users UUID", p?.id === authorId);
    }

    console.log("[2/7] media_assets — real Bunny upload");
    {
      const path = `uploads/cutover-verify-${stamp}.png`;
      const up = await uploadToBunny(path, PNG_BYTES, "image/png");
      bunnyPath = up.bunnyPath;
      const [asset] = await db
        .insert(mediaAssets)
        .values({
          filename: `cutover-verify-${stamp}.png`,
          mimeType: "image/png",
          sizeBytes: PNG_BYTES.length,
          bunnyPath: up.bunnyPath,
          deliveryUrl: up.deliveryUrl,
          altText: "cutover verification pixel",
          uploadedBy: authorId,
        })
        .returning();
      mediaId = asset.id;
      check("media asset stored with uploadedBy -> author", asset.uploadedBy === authorId);
    }

    console.log("[3/7] content_entries + [4/7] content_versions + [5/7] case_study_facets");
    let firstVersionId: string | undefined;
    {
      const created = await createEntry("case", {
        actorId: authorId!,
        data: {
          title: `Cutover verification ${stamp}`,
          tags: ["verification", "cutover"],
          quote: "q",
          quoter: "Cutover Bot",
          introduction: "intro",
          text: "body",
        },
      });
      check("createEntry ok", created.ok, JSON.stringify(!created.ok && created.errors));
      if (!created.ok) throw new Error("createEntry failed");
      entryId = created.entry.id;
      firstVersionId = created.entry.currentVersionId ?? undefined;

      const updated = await updateEntry("case", entryId, {
        actorId: authorId!,
        data: {
          title: `Cutover verification ${stamp} (edited)`,
          tags: ["verification", "cutover"],
          quote: "q2",
          quoter: "Cutover Bot",
          introduction: "intro2",
          text: "body2",
        },
      });
      check("updateEntry ok", updated.ok);

      const versions = await listVersions(entryId);
      check("edit produced a second version", versions.length === 2, `got ${versions.length}`);
      // listVersions left-joins profiles — the resolved email IS the proof
      // that version.author_id -> profiles resolves.
      check(
        "version author -> profile resolves",
        versions.every((v) => v.authorEmail === authorEmail),
      );

      if (firstVersionId) {
        await restoreVersion("case", entryId, firstVersionId, authorId!);
        const after = await listVersions(entryId);
        check("restore recorded as a NEW version", after.length === 3, `got ${after.length}`);
      } else {
        check("restore recorded as a NEW version", false, "no currentVersionId on create");
      }

      const [facets] = await db
        .select()
        .from(caseStudyFacets)
        .where(eq(caseStudyFacets.entryId, entryId));
      check("facets row resolves to the entry", !!facets);
    }

    console.log("[6/7] webhook_endpoints");
    {
      // Registered INACTIVE on purpose: dispatch targets active rows only, so
      // the publish below fires nothing at this placeholder URL.
      const [hook] = await db
        .insert(webhookEndpoints)
        .values({
          url: `https://example.invalid/cutover-verify-${stamp}`,
          secret: crypto.randomUUID(),
          active: false,
          events: ["publish"],
        })
        .returning();
      webhookId = hook.id;
      check("webhook endpoint registered", !!hook.id);
    }

    console.log("publish + published API");
    {
      const published = await publishEntry("case", entryId!, authorId!);
      check("publishEntry ok (media gate passed against real asset)", published.ok);
      const list = await listPublished("case", { pageSize: 100 });
      const hit = list.items.find((i) => i.slug?.includes(`cutover-verification-${stamp}`));
      check("published API returns the entry", !!hit);
    }

    console.log("[7/7] audit_log");
    {
      const rows = await db
        .select()
        .from(auditLog)
        .where(eq(auditLog.actorId, authorId!));
      check(
        "service calls audited with actorId -> profile",
        rows.length >= 3,
        `got ${rows.length}`,
      );
      // Snapshot the email the way the app does, so T072 has something to keep.
      const { writeAudit } = await import("../lib/audit/log");
      await writeAudit({
        actorId: authorId,
        actorEmail: authorEmail,
        action: "cutover.verify",
        metadata: { stamp },
      });
    }

    // ---- T072: FK deletion rules ----------------------------------------

    console.log("\nT072 — deleting the author via auth.admin…");
    {
      const { error } = await admin.auth.admin.deleteUser(authorId!);
      if (error) throw error;

      const [gone] = await db
        .select()
        .from(profiles)
        .where(eq(profiles.id, authorId!));
      check("profiles row cascaded away with auth.users", !gone);

      const surviving = await db
        .select()
        .from(auditLog)
        .where(and(eq(auditLog.actorEmail, authorEmail), isNull(auditLog.actorId)));
      check(
        "audit rows SURVIVE: actor_id nulled, actor_email readable",
        surviving.length >= 1,
        `got ${surviving.length}`,
      );

      const [entry] = await db
        .select()
        .from(contentEntries)
        .where(eq(contentEntries.id, entryId!));
      check(
        "content survives author deletion (createdBy/updatedBy nulled)",
        !!entry && entry.createdBy === null && entry.updatedBy === null,
      );

      const versions = await db
        .select()
        .from(contentVersions)
        .where(eq(contentVersions.entryId, entryId!));
      check(
        "versions survive (authorId nulled)",
        versions.length === 3 && versions.every((v) => v.authorId === null),
      );

      const [asset] = await db
        .select()
        .from(mediaAssets)
        .where(eq(mediaAssets.id, mediaId!));
      check("media survives (uploadedBy nulled)", !!asset && asset.uploadedBy === null);

      authorId = undefined; // already gone — cleanup must not retry
    }
  } finally {
    // ---- Cleanup (audit rows intentionally left in place) ----------------
    console.log("\nCleaning up…");
    try {
      if (entryId) {
        await db
          .update(contentEntries)
          .set({ currentVersionId: null })
          .where(eq(contentEntries.id, entryId));
        await db.delete(contentVersions).where(eq(contentVersions.entryId, entryId));
        await db.delete(caseStudyFacets).where(eq(caseStudyFacets.entryId, entryId));
        await db.delete(contentEntries).where(eq(contentEntries.id, entryId));
      }
      if (mediaId) await db.delete(mediaAssets).where(eq(mediaAssets.id, mediaId));
      if (bunnyPath) await deleteFromBunny(bunnyPath).catch(() => {});
      if (webhookId)
        await db.delete(webhookEndpoints).where(eq(webhookEndpoints.id, webhookId));
      if (authorId) await admin.auth.admin.deleteUser(authorId).catch(() => {});
      console.log("Cleanup done.");
    } catch (e) {
      console.error("Cleanup incomplete — remove leftovers manually:", e);
    }
  }

  console.log(`\n${ok.length} passed, ${bad.length} failed.`);
  if (bad.length) {
    console.error("FAILED checks:", bad.join("; "));
    process.exit(1);
  }
  console.log("T071 + T072 verified against", dbHost);
  process.exit(0);
}

main().catch((e) => {
  console.error("verify-cutover aborted:", e);
  process.exit(1);
});

// Top-level imports are all dynamic, so without this TS would treat the file
// as a global script and collide with scripts/seed-admin.ts.
export {};
