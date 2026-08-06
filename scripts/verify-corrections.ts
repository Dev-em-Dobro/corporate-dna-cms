/**
 * Read-only audit: checks whether the CMS content corrections (file `cms`)
 * were applied in the live DB. Prints a report; changes nothing.
 *   npx tsx scripts/verify-corrections.ts
 */
try {
  process.loadEnvFile(".env.local");
} catch {}

async function main() {
  const { and, eq, isNull, inArray } = await import("drizzle-orm");
  const { db } = await import("../db");
  const { contentEntries } = await import("../db/schema");

  const rows = await db
    .select({
      type: contentEntries.type,
      slug: contentEntries.slug,
      status: contentEntries.status,
      data: contentEntries.data,
    })
    .from(contentEntries)
    .where(isNull(contentEntries.deletedAt));

  const byType = (t: string) => rows.filter((r) => r.type === t);

  const solutions = byType("solution");
  console.log("\n===== 1) SOLUTIONS =====");
  console.log(`total solutions (não deletadas): ${solutions.length}`);
  for (const s of solutions) {
    const d = (s.data ?? {}) as Record<string, unknown>;
    const body = String(d.body ?? "");
    const ps = String(d.problemStatement ?? "");
    const proof = Array.isArray((d as any).proofRefs) ? (d as any).proofRefs.length : 0;
    const flags: string[] = [];
    if (/in 2020/i.test(body)) flags.push("HPT:'in 2020'");
    if (/roadmap/i.test(body)) flags.push("roadmap");
    if (/HPT Tools/i.test(body)) flags.push("HPT Tools");
    if (/2025 Asian Talent Shifts/i.test(body)) flags.push("2025 Asian Talent Shifts");
    if (/CorporateDNA/.test(body) || /CorporateDNA/.test(ps)) flags.push("CorporateDNA(sem espaço)");
    if (/<blockquote/i.test(body)) flags.push("blockquote-inline");
    console.log(
      `  • ${s.slug} [${s.status}]  proofRefs=${proof}  ${flags.length ? "⚠ " + flags.join(", ") : "ok"}`,
    );
    console.log(`      problemStatement: ${ps.replace(/<[^>]+>/g, "").slice(0, 90)}`);
  }
  const newSlugs = ["ceo-top-team-transformation", "chro-hrlt-effectiveness", "talent-succession", "leadership-culture-transformation"];
  const present = solutions.map((s) => s.slug);
  console.log("  Novas solutions esperadas:");
  for (const ns of newSlugs) console.log(`    ${present.includes(ns) ? "✓ existe" : "✗ falta"}  ${ns}`);

  console.log("\n===== 3) INSIGHTS (autoria) =====");
  const insights = byType("insight");
  console.log(`total insights: ${insights.length}`);
  for (const i of insights) {
    const d = (i.data ?? {}) as Record<string, unknown>;
    const approval = (d as any).authorApprovalStatus ?? (d as any).authorApproved ?? "—";
    const hasRes = Array.isArray((d as any).resources) ? (d as any).resources.length : 0;
    console.log(`  • ${i.slug}  author="${d.author ?? ""}"  approval=${approval}  resources=${hasRes}`);
  }

  console.log("\n===== 4) CASES (tags) =====");
  const cases = byType("case");
  for (const c of cases) {
    const d = (c.data ?? {}) as Record<string, unknown>;
    const tags = (d as any).tags ?? (d as any).facets ?? (d as any).service ?? (d as any).outcome;
    console.log(`  • ${c.slug}  tags=${JSON.stringify(tags)}`);
  }

  console.log("\n===== 5) REGIONS / Riyadh =====");
  const riyadh = rows.filter((r) => /riyadh/i.test(JSON.stringify(r.data)));
  const saudi = rows.filter((r) => /saudi/i.test(JSON.stringify(r.data)));
  console.log(`  entradas com "Riyadh": ${riyadh.length} | com "Saudi": ${saudi.length}`);

  console.log("\n===== resumo tipos =====");
  const counts: Record<string, number> = {};
  for (const r of rows) counts[r.type] = (counts[r.type] ?? 0) + 1;
  console.log(counts);

  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
