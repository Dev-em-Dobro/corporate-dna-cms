import "server-only";
import { cache } from "react";
import { count, eq } from "drizzle-orm";
import { db } from "@/db";
import { locales as localesTable, contentEntries, type Locale } from "@/db/schema";
import { writeAudit } from "@/lib/audit/log";
import { resolveDefault, sortLocales, canDisable, canDelete } from "./locale-rules";

/**
 * Admin-managed language registry (the single source of truth). Reads feed the
 * content pickers; mutations power the Settings → Languages screen. The
 * `content_entries.locale` column stays free-form; this table curates what the
 * admin offers.
 */

export type { Locale };
const FALLBACK_DEFAULT = "en";

// --- reads ---------------------------------------------------------------------

/**
 * Memoized per request (React `cache`): the registry is read on nearly every
 * page (create picker, translation bar, list grouping, fallback), often several
 * times. Without this each derived read would be its own round-trip to the
 * remote database; with it they all share one query per request.
 */
export const getLocales = cache(async (): Promise<Locale[]> => {
  return sortLocales(await db.select().from(localesTable));
});

export async function activeLocales(): Promise<Locale[]> {
  return (await getLocales()).filter((l) => l.enabled);
}

export async function getDefaultLocale(): Promise<string> {
  const rows = await getLocales();
  return rows.length ? resolveDefault(rows) : FALLBACK_DEFAULT;
}

/** A code if it is active, otherwise the default. */
export async function resolveLocale(
  code: string | null | undefined,
): Promise<string> {
  const rows = await getLocales();
  const active = rows.filter((l) => l.enabled);
  if (code && active.some((l) => l.code === code)) return code;
  return rows.length ? resolveDefault(rows) : FALLBACK_DEFAULT;
}

// --- mutations (admin only — callers must requireAdmin) -------------------------

export type ServiceResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

export async function createLocale(
  input: { code: string; label: string },
  actorId: string,
): Promise<ServiceResult<Locale>> {
  const code = input.code.trim();
  const label = input.label.trim();
  if (!code || !label) return { ok: false, error: "Code and name are required." };

  const all = await db.select().from(localesTable);
  if (all.some((l) => l.code === code))
    return { ok: false, error: "That language code already exists." };

  const [row] = await db
    .insert(localesTable)
    .values({
      code,
      label,
      isDefault: all.length === 0, // the very first language becomes default
      enabled: true,
      sortOrder: all.length,
    })
    .returning();
  await writeAudit({
    actorId,
    action: "locale.create",
    targetType: "locale",
    metadata: { code, label },
  });
  return { ok: true, value: row };
}

export async function updateLocale(
  code: string,
  patch: { label?: string; sortOrder?: number },
  actorId: string,
): Promise<ServiceResult<Locale>> {
  const set: Record<string, unknown> = { updatedAt: new Date() };
  if (typeof patch.label === "string") set.label = patch.label.trim();
  if (typeof patch.sortOrder === "number") set.sortOrder = patch.sortOrder;
  const [row] = await db
    .update(localesTable)
    .set(set)
    .where(eq(localesTable.code, code))
    .returning();
  if (!row) return { ok: false, error: "Language not found." };
  await writeAudit({
    actorId,
    action: "locale.update",
    targetType: "locale",
    metadata: { code },
  });
  return { ok: true, value: row };
}

export async function setDefaultLocale(
  code: string,
  actorId: string,
): Promise<ServiceResult<Locale>> {
  const rows = await db.select().from(localesTable);
  const target = rows.find((l) => l.code === code);
  if (!target) return { ok: false, error: "Language not found." };
  if (!target.enabled)
    return { ok: false, error: "Enable the language before making it the default." };

  await db.transaction(async (tx) => {
    await tx
      .update(localesTable)
      .set({ isDefault: false, updatedAt: new Date() })
      .where(eq(localesTable.isDefault, true));
    await tx
      .update(localesTable)
      .set({ isDefault: true, updatedAt: new Date() })
      .where(eq(localesTable.code, code));
  });
  await writeAudit({
    actorId,
    action: "locale.set_default",
    targetType: "locale",
    metadata: { code },
  });
  const [row] = await db
    .select()
    .from(localesTable)
    .where(eq(localesTable.code, code));
  return { ok: true, value: row };
}

export async function setLocaleEnabled(
  code: string,
  enabled: boolean,
  actorId: string,
): Promise<ServiceResult<Locale>> {
  const rows = await db.select().from(localesTable);
  const target = rows.find((l) => l.code === code);
  if (!target) return { ok: false, error: "Language not found." };
  if (!enabled && !canDisable(code, rows))
    return {
      ok: false,
      error: "Set another language as the default before disabling this one.",
    };

  const [row] = await db
    .update(localesTable)
    .set({ enabled, updatedAt: new Date() })
    .where(eq(localesTable.code, code))
    .returning();
  await writeAudit({
    actorId,
    action: enabled ? "locale.enable" : "locale.disable",
    targetType: "locale",
    metadata: { code },
  });
  return { ok: true, value: row };
}

/** How many content entries currently use this language. */
export async function localeInUse(code: string): Promise<number> {
  const [{ n }] = await db
    .select({ n: count() })
    .from(contentEntries)
    .where(eq(contentEntries.locale, code));
  return Number(n);
}

export async function deleteLocale(
  code: string,
  actorId: string,
): Promise<ServiceResult<null>> {
  const rows = await db.select().from(localesTable);
  const target = rows.find((l) => l.code === code);
  if (!target) return { ok: false, error: "Language not found." };
  const inUse = await localeInUse(code);
  if (!canDelete(target, inUse)) {
    return {
      ok: false,
      error: target.isDefault
        ? "Can't delete the default language."
        : `Can't delete: ${inUse} item(s) use it. Disable it instead.`,
    };
  }
  await db.delete(localesTable).where(eq(localesTable.code, code));
  await writeAudit({
    actorId,
    action: "locale.delete",
    targetType: "locale",
    metadata: { code },
  });
  return { ok: true, value: null };
}
