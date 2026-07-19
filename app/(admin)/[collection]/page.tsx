import Link from "next/link";
import { notFound } from "next/navigation";
import { SEGMENT_TO_TYPE, defForType } from "@/lib/content/types";
import { listEntries } from "@/lib/content/entries";
import { StatusBadge } from "@/components/ui/Feedback";
import { buttonPrimary } from "@/components/ui/styles";

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
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-ink">{def.label}</h1>
        <Link href={`/${collection}/new`} className={buttonPrimary}>
          New
          <span className="sr-only"> {def.label}</span>
        </Link>
      </div>

      {entries.length === 0 ? (
        <div className="rounded-lg border border-dashed border-line-strong p-10 text-center">
          <p className="text-sm font-medium text-ink">Nothing here yet</p>
          <p className="mt-1 text-sm text-muted">
            Create your first entry to see it listed here.
          </p>
          <Link
            href={`/${collection}/new`}
            className={`${buttonPrimary} mt-4`}
          >
            New {def.label}
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-line-strong">
          <table className="w-full min-w-[36rem] text-sm">
            <caption className="sr-only">
              {def.label} entries with status, locale, and last update
            </caption>
            <thead className="bg-paper text-left text-xs uppercase tracking-wide text-muted">
              <tr>
                <th scope="col" className="px-4 py-2 font-semibold">Title</th>
                <th scope="col" className="px-4 py-2 font-semibold">Status</th>
                <th scope="col" className="px-4 py-2 font-semibold">Locale</th>
                <th scope="col" className="px-4 py-2 font-semibold">Updated</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr
                  key={e.id}
                  className="border-t border-line transition-colors duration-150 hover:bg-paper"
                >
                  <th scope="row" className="px-4 py-2 text-left font-normal">
                    <Link
                      href={`/${collection}/${e.id}`}
                      className="font-medium text-ink underline decoration-line-strong underline-offset-2 transition-colors duration-150 hover:decoration-brand-dark"
                    >
                      {def.toListItem(e.data).title}
                    </Link>
                  </th>
                  <td className="px-4 py-2">
                    <StatusBadge status={e.status} />
                  </td>
                  <td className="px-4 py-2 uppercase text-muted">{e.locale}</td>
                  <td className="px-4 py-2 text-muted">
                    <time dateTime={new Date(e.updatedAt).toISOString()}>
                      {new Date(e.updatedAt).toLocaleDateString()}
                    </time>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
