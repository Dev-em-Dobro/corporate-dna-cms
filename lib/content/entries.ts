import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import { db } from "@/db";
import {
  contentEntries,
  contentVersions,
  caseStudyFacets,
  mediaAssets,
  profiles,
  type ContentEntry,
} from "@/db/schema";
import { ConflictError, NotFoundError } from "@/lib/errors";
import { writeAudit } from "@/lib/audit/log";
import { dispatchRevalidation } from "@/lib/webhooks/dispatch";
import {
  validateContent,
  extractCaseFacets,
  defForType,
  type ContentType,
} from "./types";
import { sanitizeRichText } from "./sanitize";
import { slugify } from "./slug";

export type ServiceResult<T> =
  | { ok: true; entry: T }
  | { ok: false; errors: Record<string, string> };

// --- media references ----------------------------------------------------------

function collectMediaIds(
  type: ContentType,
  data: Record<string, unknown>,
): string[] {
  const ids: string[] = [];
  const push = (v: unknown) => {
    if (typeof v === "string") ids.push(v);
  };
  push(data.coverMediaId);
  push(data.photoMediaId);
  if (type === "page_awards" && Array.isArray(data.items)) {
    for (const it of data.items as Array<Record<string, unknown>>)
      push(it.logoMediaId);
  }
  return ids;
}

async function missingMediaRefs(
  type: ContentType,
  data: Record<string, unknown>,
): Promise<string[]> {
  const ids = [...new Set(collectMediaIds(type, data))];
  if (!ids.length) return [];
  const rows = await db
    .select({ id: mediaAssets.id })
    .from(mediaAssets)
    .where(inArray(mediaAssets.id, ids));
  const found = new Set(rows.map((r) => r.id));
  return ids.filter((i) => !found.has(i));
}

// --- reads ---------------------------------------------------------------------

export async function listEntries(
  type: ContentType,
  opts: { status?: "draft" | "published" | "archived"; limit?: number; offset?: number } = {},
): Promise<ContentEntry[]> {
  const conds = [eq(contentEntries.type, type), isNull(contentEntries.deletedAt)];
  if (opts.status) conds.push(eq(contentEntries.status, opts.status));
  return db
    .select()
    .from(contentEntries)
    .where(and(...conds))
    .orderBy(desc(contentEntries.updatedAt))
    .limit(opts.limit ?? 50)
    .offset(opts.offset ?? 0);
}

export async function getEntry(
  type: ContentType,
  id: string,
): Promise<ContentEntry | null> {
  const [e] = await db
    .select()
    .from(contentEntries)
    .where(
      and(
        eq(contentEntries.id, id),
        eq(contentEntries.type, type),
        isNull(contentEntries.deletedAt),
      ),
    );
  return e ?? null;
}

// --- writes --------------------------------------------------------------------

function deriveTitle(type: ContentType, data: Record<string, unknown>): string {
  return defForType(type).toListItem(data).title;
}

export async function createEntry(
  type: ContentType,
  input: {
    data: unknown;
    locale?: string;
    slug?: string;
    translationGroupId?: string;
    actorId: string;
  },
): Promise<ServiceResult<ContentEntry>> {
  const v = validateContent(type, input.data);
  if (!v.ok) return { ok: false, errors: v.errors! };
  const data = sanitizeRichText(type, v.data!);
  const locale = input.locale ?? "en";
  const slug = (input.slug?.trim() || slugify(deriveTitle(type, data))).toLowerCase();

  const entry = await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(contentEntries)
      .values({
        type,
        slug,
        locale,
        status: "draft",
        data,
        createdBy: input.actorId,
        updatedBy: input.actorId,
        ...(input.translationGroupId
          ? { translationGroupId: input.translationGroupId }
          : {}),
      })
      .returning();

    const [version] = await tx
      .insert(contentVersions)
      .values({
        entryId: created.id,
        data,
        statusAtSave: "draft",
        authorId: input.actorId,
      })
      .returning();

    const [withVersion] = await tx
      .update(contentEntries)
      .set({ currentVersionId: version.id })
      .where(eq(contentEntries.id, created.id))
      .returning();

    if (type === "case") {
      await tx
        .insert(caseStudyFacets)
        .values({ entryId: created.id, ...extractCaseFacets(data) });
    }
    return withVersion;
  });

  await writeAudit({
    actorId: input.actorId,
    action: "entry.create",
    targetType: "entry",
    targetId: entry.id,
    metadata: { type, slug },
  });
  return { ok: true, entry };
}

export async function updateEntry(
  type: ContentType,
  id: string,
  input: { data: unknown; expectedVersionId?: string; actorId: string },
): Promise<ServiceResult<ContentEntry>> {
  const v = validateContent(type, input.data);
  if (!v.ok) return { ok: false, errors: v.errors! };
  const data = sanitizeRichText(type, v.data!);

  const entry = await db.transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(contentEntries)
      .where(and(eq(contentEntries.id, id), isNull(contentEntries.deletedAt)));
    if (!current) throw new NotFoundError("Entry not found");
    // Concurrency guard: reject stale writes (no silent overwrite).
    if (
      input.expectedVersionId &&
      current.currentVersionId !== input.expectedVersionId
    ) {
      throw new ConflictError();
    }

    const [version] = await tx
      .insert(contentVersions)
      .values({
        entryId: id,
        data,
        statusAtSave: current.status,
        authorId: input.actorId,
      })
      .returning();

    const [updated] = await tx
      .update(contentEntries)
      .set({
        data,
        currentVersionId: version.id,
        updatedBy: input.actorId,
        updatedAt: new Date(),
      })
      .where(eq(contentEntries.id, id))
      .returning();

    if (type === "case") {
      const facets = extractCaseFacets(data);
      await tx
        .insert(caseStudyFacets)
        .values({ entryId: id, ...facets })
        .onConflictDoUpdate({ target: caseStudyFacets.entryId, set: facets });
    }
    return updated;
  });

  await writeAudit({
    actorId: input.actorId,
    action: "entry.update",
    targetType: "entry",
    targetId: id,
    metadata: { type },
  });
  return { ok: true, entry };
}

export async function publishEntry(
  type: ContentType,
  id: string,
  actorId: string,
): Promise<ServiceResult<ContentEntry>> {
  const entry = await getEntry(type, id);
  if (!entry) throw new NotFoundError("Entry not found");

  // Publish gate: required fields + referenced media must exist.
  const v = validateContent(type, entry.data);
  if (!v.ok) return { ok: false, errors: v.errors! };
  const missing = await missingMediaRefs(type, entry.data);
  if (missing.length) {
    return {
      ok: false,
      errors: Object.fromEntries(
        missing.map((m) => [m, "referenced media not found"]),
      ),
    };
  }

  const now = new Date();
  const [updated] = await db
    .update(contentEntries)
    .set({
      status: "published",
      publishedAt: entry.publishedAt ?? now,
      updatedBy: actorId,
      updatedAt: now,
    })
    .where(eq(contentEntries.id, id))
    .returning();

  await writeAudit({
    actorId,
    action: "entry.publish",
    targetType: "entry",
    targetId: id,
    metadata: { type, slug: entry.slug },
  });
  await dispatchRevalidation({
    event: "entry.published",
    type,
    slug: entry.slug,
    locale: entry.locale,
    at: now.toISOString(),
  });
  return { ok: true, entry: updated };
}

export async function unpublishEntry(
  type: ContentType,
  id: string,
  actorId: string,
): Promise<ServiceResult<ContentEntry>> {
  const entry = await getEntry(type, id);
  if (!entry) throw new NotFoundError("Entry not found");

  const now = new Date();
  const [updated] = await db
    .update(contentEntries)
    .set({ status: "draft", updatedBy: actorId, updatedAt: now })
    .where(eq(contentEntries.id, id))
    .returning();

  await writeAudit({
    actorId,
    action: "entry.unpublish",
    targetType: "entry",
    targetId: id,
    metadata: { type },
  });
  await dispatchRevalidation({
    event: "entry.unpublished",
    type,
    slug: entry.slug,
    locale: entry.locale,
    at: now.toISOString(),
  });
  return { ok: true, entry: updated };
}

export async function deleteEntry(
  type: ContentType,
  id: string,
  actorId: string,
): Promise<void> {
  const entry = await getEntry(type, id);
  if (!entry) throw new NotFoundError("Entry not found");
  await db
    .update(contentEntries)
    .set({ deletedAt: new Date(), updatedBy: actorId })
    .where(eq(contentEntries.id, id));
  await writeAudit({
    actorId,
    action: "entry.delete",
    targetType: "entry",
    targetId: id,
    metadata: { type },
  });
}

// --- translations (multilingual-ready, FR-019) ---------------------------------

/**
 * Create a locale variant of an existing entry: a new row sharing the source's
 * translationGroupId. Pure content operation — no schema/code change (SC-007).
 */
export async function addTranslation(
  type: ContentType,
  id: string,
  locale: string,
  actorId: string,
): Promise<ServiceResult<ContentEntry>> {
  const source = await getEntry(type, id);
  if (!source) throw new NotFoundError("Entry not found");

  const [existing] = await db
    .select()
    .from(contentEntries)
    .where(
      and(
        eq(contentEntries.translationGroupId, source.translationGroupId),
        eq(contentEntries.locale, locale),
        isNull(contentEntries.deletedAt),
      ),
    );
  if (existing) {
    return {
      ok: false,
      errors: { locale: "A translation for this locale already exists" },
    };
  }

  return createEntry(type, {
    data: source.data,
    locale,
    slug: source.slug,
    translationGroupId: source.translationGroupId,
    actorId,
  });
}

// --- versions ------------------------------------------------------------------

export async function listVersions(entryId: string) {
  return db
    .select({
      id: contentVersions.id,
      statusAtSave: contentVersions.statusAtSave,
      createdAt: contentVersions.createdAt,
      authorEmail: profiles.email,
    })
    .from(contentVersions)
    .leftJoin(profiles, eq(profiles.id, contentVersions.authorId))
    .where(eq(contentVersions.entryId, entryId))
    .orderBy(desc(contentVersions.createdAt));
}

export async function restoreVersion(
  type: ContentType,
  id: string,
  versionId: string,
  actorId: string,
): Promise<ContentEntry> {
  const entry = await db.transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(contentEntries)
      .where(and(eq(contentEntries.id, id), isNull(contentEntries.deletedAt)));
    if (!current) throw new NotFoundError("Entry not found");

    const [ver] = await tx
      .select()
      .from(contentVersions)
      .where(
        and(
          eq(contentVersions.id, versionId),
          eq(contentVersions.entryId, id),
        ),
      );
    if (!ver) throw new NotFoundError("Version not found");

    // Restore writes a NEW version (the restore is itself recorded).
    const [newVersion] = await tx
      .insert(contentVersions)
      .values({
        entryId: id,
        data: ver.data,
        statusAtSave: current.status,
        authorId: actorId,
      })
      .returning();

    const [updated] = await tx
      .update(contentEntries)
      .set({
        data: ver.data,
        currentVersionId: newVersion.id,
        updatedBy: actorId,
        updatedAt: new Date(),
      })
      .where(eq(contentEntries.id, id))
      .returning();

    if (type === "case") {
      const facets = extractCaseFacets(ver.data);
      await tx
        .insert(caseStudyFacets)
        .values({ entryId: id, ...facets })
        .onConflictDoUpdate({ target: caseStudyFacets.entryId, set: facets });
    }
    return updated;
  });

  await writeAudit({
    actorId,
    action: "version.restore",
    targetType: "entry",
    targetId: id,
    metadata: { type, versionId },
  });
  return entry;
}
