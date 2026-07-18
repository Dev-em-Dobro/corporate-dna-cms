import Link from "next/link";
import { notFound } from "next/navigation";
import { SEGMENT_TO_TYPE, defForType } from "@/lib/content/types";
import { listEntries } from "@/lib/content/entries";

export default async function CollectionList({
  params,
}: {
  params: Promise<{ collection: string }>;
}) {
  const { collection } = await params;
  const type = SEGMENT_TO_TYPE[collection];
  if (!type) notFound();
  const def = defForType(type);
  const entries = await listEntries(type, { limit: 100 }).catch(() => []);

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--color-ink)]">
          {def.label}
        </h1>
        <Link
          href={`/${collection}/new`}
          className="rounded bg-[var(--color-brand)] px-3 py-2 text-sm font-semibold text-white"
        >
          New
        </Link>
      </div>
      <div className="overflow-hidden rounded-lg border border-[var(--color-line)]">
        <table className="w-full text-sm">
          <thead className="bg-[var(--color-paper)] text-left text-xs uppercase tracking-wide text-[var(--color-muted)]">
            <tr>
              <th className="px-4 py-2">Title</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Locale</th>
              <th className="px-4 py-2">Updated</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr
                key={e.id}
                className="border-t border-[var(--color-line)] hover:bg-[var(--color-paper)]"
              >
                <td className="px-4 py-2">
                  <Link
                    href={`/${collection}/${e.id}`}
                    className="font-medium text-[var(--color-ink)] underline"
                  >
                    {def.toListItem(e.data).title}
                  </Link>
                </td>
                <td className="px-4 py-2">{e.status}</td>
                <td className="px-4 py-2">{e.locale}</td>
                <td className="px-4 py-2 text-[var(--color-muted)]">
                  {new Date(e.updatedAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
            {entries.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-6 text-center text-[var(--color-muted)]"
                >
                  Nothing here yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
