import { notFound } from "next/navigation";
import { verifyPreviewToken } from "@/lib/auth/session";
import { resolveTypeParam, defForType } from "@/lib/content/types";
import { getEntry } from "@/lib/content/entries";

/**
 * Draft-aware preview, gated by a signed, short-lived preview token bound to the
 * entry id (D5). The public site never uses this route.
 */
export default async function PreviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ type: string; id: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { type: param, id } = await params;
  const { token } = await searchParams;
  const type = resolveTypeParam(param);
  if (!type || !token || !(await verifyPreviewToken(token, id))) notFound();

  const entry = await getEntry(type, id);
  if (!entry) notFound();

  const item = defForType(type).toListItem(entry.data);

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <div className="mb-4 rounded bg-[var(--color-paper)] px-3 py-1 text-xs uppercase tracking-widest text-[var(--color-muted)]">
        Preview · {entry.status}
      </div>
      <h1 className="text-3xl font-bold text-[var(--color-ink)]">{item.title}</h1>
      {item.summary && (
        <p className="mt-2 text-[var(--color-muted)]">{item.summary}</p>
      )}
      <pre className="mt-6 overflow-auto rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] p-4 text-xs">
        {JSON.stringify(entry.data, null, 2)}
      </pre>
    </main>
  );
}
