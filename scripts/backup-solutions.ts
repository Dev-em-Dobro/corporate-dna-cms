/**
 * Full-fidelity backup / restore of every `solution` content entry (and its
 * version history) so any change can be reverted verbatim.
 *
 *   npx tsx scripts/backup-solutions.ts                 # write backup/solutions-<ts>.json
 *   npx tsx scripts/backup-solutions.ts --restore <file># restore rows from a backup file
 *
 * Backup dumps ALL columns of ALL solution rows regardless of deletedAt, plus
 * the content_versions rows that reference them. Restore upserts each row by id
 * with every column set back to the saved value (a true point-in-time revert).
 */
export {};

try {
  process.loadEnvFile(".env.local");
} catch {}

import { writeFileSync, readFileSync, mkdirSync } from "node:fs";

async function main() {
  const { eq, inArray } = await import("drizzle-orm");
  const { db } = await import("../db");
  const { contentEntries, contentVersions } = await import("../db/schema");

  const restoreIdx = process.argv.indexOf("--restore");
  if (restoreIdx !== -1) {
    const file = process.argv[restoreIdx + 1];
    if (!file) {
      console.error("Usage: --restore <path-to-backup.json>");
      process.exit(1);
    }
    const snap = JSON.parse(readFileSync(file, "utf8")) as {
      entries: Record<string, unknown>[];
      versions: Record<string, unknown>[];
    };
    console.log(`Restoring ${snap.entries.length} solution rows from ${file} ...`);
    const revive = (row: Record<string, unknown>) => {
      const r: Record<string, unknown> = { ...row };
      for (const k of ["publishedAt", "deletedAt", "createdAt", "updatedAt"]) {
        if (r[k]) r[k] = new Date(r[k] as string);
      }
      return r;
    };
    for (const raw of snap.entries) {
      const row = revive(raw);
      await db
        .insert(contentEntries)
        .values(row as never)
        .onConflictDoUpdate({ target: contentEntries.id, set: row as never });
      console.log(`  ✓ entry ${row.slug} (${row.status})`);
    }
    for (const raw of snap.versions) {
      const row = revive(raw);
      await db
        .insert(contentVersions)
        .values(row as never)
        .onConflictDoNothing({ target: contentVersions.id });
    }
    console.log(`Restore complete: ${snap.entries.length} entries, ${snap.versions.length} versions.`);
    process.exit(0);
  }

  // ── backup ──────────────────────────────────────────────────────────────
  const entries = await db
    .select()
    .from(contentEntries)
    .where(eq(contentEntries.type, "solution"));

  const ids = entries.map((e) => e.id);
  const versions = ids.length
    ? await db.select().from(contentVersions).where(inArray(contentVersions.entryId, ids))
    : [];

  const ts = new Date()
    .toISOString()
    .replace(/[:.]/g, "")
    .replace("T", "-")
    .slice(0, 15);
  mkdirSync("backup", { recursive: true });
  const path = `backup/solutions-${ts}.json`;
  writeFileSync(
    path,
    JSON.stringify({ takenAt: new Date().toISOString(), entries, versions }, null, 2),
  );

  console.log(`✓ Backed up ${entries.length} solution entries + ${versions.length} versions`);
  console.log(`  → ${path}`);
  console.log("\nRows captured:");
  for (const e of entries) {
    console.log(`  • ${e.slug} [${e.status}]${e.deletedAt ? " (deleted)" : ""}  id=${e.id}`);
  }
  console.log(`\nRevert later with:\n  npx tsx scripts/backup-solutions.ts --restore ${path}`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
