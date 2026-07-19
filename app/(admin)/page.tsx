import Link from "next/link";
import { db } from "@/db";
import { contentEntries } from "@/db/schema";
import { and, eq, isNull, sql } from "drizzle-orm";
import { REGISTRY, type ContentType } from "@/lib/content/types";

async function countByType(type: ContentType, status?: "draft" | "published") {
  const rows = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(contentEntries)
    .where(
      and(
        eq(contentEntries.type, type),
        isNull(contentEntries.deletedAt),
        status ? eq(contentEntries.status, status) : undefined,
      ),
    );
  return rows[0]?.n ?? 0;
}

export default async function Dashboard() {
  const types = Object.values(REGISTRY);
  const stats = await Promise.all(
    types.map(async (t) => ({
      def: t,
      total: await countByType(t.type),
      published: await countByType(t.type, "published"),
    })),
  ).catch(() => []); // tolerate no DB in dev

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink">Dashboard</h1>
      <p className="mt-1 text-sm text-muted">
        Content overview. Everything here is editable without a developer.
      </p>
      <ul className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3">
        {stats.map(({ def, total, published }) => (
          <li key={def.type}>
            <Link
              href={def.segment ? `/${def.segment}` : "/pages"}
              className="flex h-full flex-col rounded-lg border border-line-strong p-4 transition-colors duration-150 hover:border-brand-dark hover:bg-paper"
            >
              <p className="text-sm font-semibold text-ink">{def.label}</p>
              <p className="mt-2 text-2xl font-bold text-ink">{total}</p>
              <p className="text-xs text-muted">
                {published} published
                <span className="sr-only"> of {total} total</span>
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
