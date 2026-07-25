import { notFound } from "next/navigation";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { contentEntries } from "@/db/schema";
import { SINGLETON_PAGES, defForType } from "@/lib/content/types";
import { FIELDS, emptyData } from "@/lib/content/ui-fields";
import {
  activeLocales,
  getDefaultLocale,
  resolveLocale,
} from "@/lib/content/locales";
import { listTranslations } from "@/lib/content/entries";
import ContentEditor from "@/components/ContentEditor";
import TranslationBar from "@/components/TranslationBar";

export default async function SingletonEditor({
  params,
  searchParams,
}: {
  params: Promise<{ key: string }>;
  searchParams: Promise<{ locale?: string }>;
}) {
  const { key } = await params;
  const { locale: requested } = await searchParams;
  const cfg = SINGLETON_PAGES[key];
  if (!cfg) notFound();

  const [locale, defaultLocale] = await Promise.all([
    resolveLocale(requested),
    getDefaultLocale(),
  ]);

  // Load the requested language variant; fall back to the default language.
  async function loadFor(loc: string) {
    const [row] = await db
      .select()
      .from(contentEntries)
      .where(
        and(
          eq(contentEntries.type, cfg.type),
          eq(contentEntries.slug, cfg.slug),
          eq(contentEntries.locale, loc),
          isNull(contentEntries.deletedAt),
        ),
      );
    return row;
  }

  const entry =
    (await loadFor(locale)) ??
    (locale !== defaultLocale ? await loadFor(defaultLocale) : undefined);

  const [translations, active] = entry
    ? await Promise.all([listTranslations(entry.translationGroupId), activeLocales()])
    : [[], []];

  const initial = entry
    ? {
        id: entry.id,
        data: entry.data,
        currentVersionId: entry.currentVersionId,
        status: entry.status,
        hasUnpublishedChanges: entry.hasUnpublishedChanges,
      }
    : { data: emptyData(cfg.type) };

  return (
    <>
      {entry && (
        <TranslationBar
          apiType={cfg.type}
          id={entry.id}
          currentLocale={entry.locale}
          existing={translations}
          active={active}
          kind="singleton"
          pageKey={key}
          defaultLocale={defaultLocale}
        />
      )}
      <ContentEditor
        apiType={cfg.type}
        collection="pages"
        mode="singleton"
        fixedSlug={cfg.slug}
        fields={FIELDS[cfg.type]}
        initial={initial}
        label={`${defForType(cfg.type).label} (${key})`}
        defaultLocale={defaultLocale}
      />
    </>
  );
}
