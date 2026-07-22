import { and, arrayOverlaps, desc, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { contentEntries, caseStudyFacets } from "@/db/schema";
import { defForType, type ContentType } from "./types";
import {
  attachDataMediaUrls,
  attachListItemMediaUrl,
  collectDataMediaIds,
  resolveMediaUrls,
} from "./media-urls";

const DEFAULT_LOCALE = "en";

export interface ListParams {
  locale?: string;
  page?: number;
  pageSize?: number;
}

function paging(params: ListParams) {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 20));
  return { page, pageSize, offset: (page - 1) * pageSize };
}

function toListItem(type: ContentType, e: typeof contentEntries.$inferSelect) {
  return {
    id: e.id,
    type: e.type,
    slug: e.slug,
    locale: e.locale,
    publishedAt: e.publishedAt,
    ...defForType(type).toListItem(e.data),
  };
}

/** Published-only list for a collection type (draft/deleted never returned). */
export async function listPublished(type: ContentType, params: ListParams = {}) {
  const locale = params.locale ?? DEFAULT_LOCALE;
  const { page, pageSize, offset } = paging(params);
  const conds = [
    eq(contentEntries.type, type),
    eq(contentEntries.status, "published"),
    isNull(contentEntries.deletedAt),
    eq(contentEntries.locale, locale),
  ];
  const rows = await db
    .select()
    .from(contentEntries)
    .where(and(...conds))
    .orderBy(desc(contentEntries.publishedAt))
    .limit(pageSize)
    .offset(offset);
  const [{ total }] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(contentEntries)
    .where(and(...conds));

  const baseItems = rows.map((e) => toListItem(type, e));
  const urls = await resolveMediaUrls(
    baseItems.map((i) => i.coverMediaId).filter((v): v is string => !!v),
  );
  const items = baseItems.map((i) => attachListItemMediaUrl(i, urls));
  return { items, page, pageSize, total };
}

export interface CaseFilter extends ListParams {
  industry?: string[];
  service?: string[];
  region?: string[]; // region slugs
  outcome?: string[];
}

/**
 * Published case-study library with faceted filtering.
 * Semantics: OR within a facet (any value matches), AND across facets (FR-010).
 */
export async function listPublishedCases(params: CaseFilter = {}) {
  const locale = params.locale ?? DEFAULT_LOCALE;
  const { page, pageSize, offset } = paging(params);

  const conds = [
    eq(contentEntries.type, "case"),
    eq(contentEntries.status, "published"),
    isNull(contentEntries.deletedAt),
    eq(contentEntries.locale, locale),
  ];
  if (params.industry?.length)
    conds.push(arrayOverlaps(caseStudyFacets.industry, params.industry));
  if (params.service?.length)
    conds.push(arrayOverlaps(caseStudyFacets.service, params.service));
  if (params.region?.length)
    conds.push(arrayOverlaps(caseStudyFacets.regionSlugs, params.region));
  if (params.outcome?.length)
    conds.push(arrayOverlaps(caseStudyFacets.outcome, params.outcome));

  const base = db
    .select({ entry: contentEntries, facets: caseStudyFacets })
    .from(contentEntries)
    .innerJoin(
      caseStudyFacets,
      eq(caseStudyFacets.entryId, contentEntries.id),
    )
    .where(and(...conds));

  const rows = await base
    .orderBy(desc(contentEntries.publishedAt))
    .limit(pageSize)
    .offset(offset);

  const [{ total }] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(contentEntries)
    .innerJoin(caseStudyFacets, eq(caseStudyFacets.entryId, contentEntries.id))
    .where(and(...conds));

  const baseItems = rows.map((r) => ({
    ...toListItem("case", r.entry),
    facets: {
      industry: r.facets.industry,
      service: r.facets.service,
      region: r.facets.regionSlugs,
      outcome: r.facets.outcome,
    },
  }));
  const urls = await resolveMediaUrls(
    baseItems.map((i) => i.coverMediaId).filter((v): v is string => !!v),
  );
  const items = baseItems.map((i) => attachListItemMediaUrl(i, urls));
  return { items, page, pageSize, total };
}

/**
 * Published-only single entry by slug, with locale fallback (FR-020): if the
 * requested locale has no published entry, fall back to the default locale.
 */
export async function getPublished(
  type: ContentType,
  slug: string,
  locale = DEFAULT_LOCALE,
): Promise<Record<string, unknown> | null> {
  const fetchOne = async (loc: string) => {
    const [e] = await db
      .select()
      .from(contentEntries)
      .where(
        and(
          eq(contentEntries.type, type),
          eq(contentEntries.slug, slug),
          eq(contentEntries.locale, loc),
          eq(contentEntries.status, "published"),
          isNull(contentEntries.deletedAt),
        ),
      );
    return e ?? null;
  };

  let entry = await fetchOne(locale);
  if (!entry && locale !== DEFAULT_LOCALE) entry = await fetchOne(DEFAULT_LOCALE);
  if (!entry) return null;

  let facets: Record<string, string[]> | undefined;
  if (type === "case") {
    const [f] = await db
      .select()
      .from(caseStudyFacets)
      .where(eq(caseStudyFacets.entryId, entry.id));
    if (f)
      facets = {
        industry: f.industry,
        service: f.service,
        region: f.regionSlugs,
        outcome: f.outcome,
      };
  }

  const urls = await resolveMediaUrls(collectDataMediaIds(entry.data));
  const withUrls = attachDataMediaUrls(entry.data, urls);

  return {
    id: entry.id,
    type: entry.type,
    slug: entry.slug,
    locale: entry.locale,
    data: facets ? { ...withUrls, facets } : withUrls,
    publishedAt: entry.publishedAt,
  };
}
