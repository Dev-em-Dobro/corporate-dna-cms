import { notFound } from "next/navigation";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { contentEntries } from "@/db/schema";
import { SINGLETON_PAGES, defForType } from "@/lib/content/types";
import { FIELDS, emptyData } from "@/lib/content/ui-fields";
import ContentEditor from "@/components/ContentEditor";
import VersionsPanel from "@/components/VersionsPanel";

export default async function SingletonEditor({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  const { key } = await params;
  const cfg = SINGLETON_PAGES[key];
  if (!cfg) notFound();

  const [entry] = await db
    .select()
    .from(contentEntries)
    .where(
      and(
        eq(contentEntries.type, cfg.type),
        eq(contentEntries.slug, cfg.slug),
        eq(contentEntries.locale, "en"),
        isNull(contentEntries.deletedAt),
      ),
    );

  const initial = entry
    ? {
        id: entry.id,
        data: entry.data,
        currentVersionId: entry.currentVersionId,
        status: entry.status,
      }
    : { data: emptyData(cfg.type) };

  return (
    <>
      <ContentEditor
        apiType={cfg.type}
        collection="pages"
        mode="singleton"
        fixedSlug={cfg.slug}
        fields={FIELDS[cfg.type]}
        initial={initial}
        label={`${defForType(cfg.type).label} (${key})`}
      />
      {entry && <VersionsPanel apiType={cfg.type} id={entry.id} />}
    </>
  );
}
