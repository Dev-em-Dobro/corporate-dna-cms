import { inArray } from "drizzle-orm";
import { db } from "@/db";
import { mediaAssets } from "@/db/schema";

/**
 * Resolve media references (the `*MediaId` fields carried in published content)
 * to ready-to-use delivery URLs for the site-facing read API.
 *
 * Additive & backward-compatible: helpers only ADD sibling `*Url` fields and
 * never touch the original `*MediaId` values, so existing consumers keep working.
 */

/** Media id -> absolute delivery URL. */
export type MediaUrlMap = Map<string, string>;

type UrlRow = { deliveryUrl: string | null; bunnyPath: string | null };

/**
 * Absolute URL for one asset: prefer the stored `delivery_url`, else derive it
 * from `${BUNNY_CDN_URL}/${bunny_path}`. Returns undefined when neither is
 * usable (e.g. CDN not configured) so the caller simply omits the field.
 */
export function assetDeliveryUrl(row: UrlRow): string | undefined {
  if (row.deliveryUrl) return row.deliveryUrl;
  const cdn = process.env.BUNNY_CDN_URL?.replace(/\/$/, "");
  if (cdn && row.bunnyPath) return `${cdn}/${row.bunnyPath}`;
  return undefined;
}

/** Media ids referenced by a content `data` payload (cover / banner / photo / logo / file / attachment and awards logos). */
export function collectDataMediaIds(data: Record<string, unknown>): string[] {
  const ids: string[] = [];
  if (typeof data.coverMediaId === "string") ids.push(data.coverMediaId);
  if (typeof data.bannerMediaId === "string") ids.push(data.bannerMediaId);
  if (typeof data.photoMediaId === "string") ids.push(data.photoMediaId);
  if (typeof data.logoMediaId === "string") ids.push(data.logoMediaId);
  if (typeof data.fileMediaId === "string") ids.push(data.fileMediaId);
  if (typeof data.attachmentMediaId === "string")
    ids.push(data.attachmentMediaId);
  if (Array.isArray(data.items)) {
    for (const it of data.items as Array<Record<string, unknown>>) {
      if (it && typeof it.logoMediaId === "string") ids.push(it.logoMediaId);
    }
  }
  return ids;
}

/** Batch-resolve a set of media ids to URLs in a single query (deduped). */
export async function resolveMediaUrls(
  ids: Iterable<string>,
): Promise<MediaUrlMap> {
  const unique = [...new Set([...ids].filter(Boolean))];
  const map: MediaUrlMap = new Map();
  if (!unique.length) return map;
  const rows = await db
    .select({
      id: mediaAssets.id,
      deliveryUrl: mediaAssets.deliveryUrl,
      bunnyPath: mediaAssets.bunnyPath,
    })
    .from(mediaAssets)
    .where(inArray(mediaAssets.id, unique));
  for (const r of rows) {
    const url = assetDeliveryUrl(r);
    if (url) map.set(r.id, url);
  }
  return map;
}

/**
 * Return a shallow copy of a read-API list item with `coverUrl` added when its
 * `coverMediaId` resolves. (List items normalise every type's cover/photo into
 * a single `coverMediaId` field.)
 */
export function attachListItemMediaUrl<T extends { coverMediaId?: string }>(
  item: T,
  urls: MediaUrlMap,
): T & { coverUrl?: string } {
  const url = item.coverMediaId ? urls.get(item.coverMediaId) : undefined;
  return url ? { ...item, coverUrl: url } : item;
}

/**
 * Return a shallow copy of a content `data` payload with resolved URLs added
 * alongside their id fields: `coverUrl`, `bannerUrl`, `photoUrl`, `logoUrl`,
 * `fileUrl`, `attachmentUrl`, and `items[].logoUrl`.
 */
export function attachDataMediaUrls(
  data: Record<string, unknown>,
  urls: MediaUrlMap,
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...data };

  if (typeof data.coverMediaId === "string") {
    const url = urls.get(data.coverMediaId);
    if (url) out.coverUrl = url;
  }
  if (typeof data.bannerMediaId === "string") {
    const url = urls.get(data.bannerMediaId);
    if (url) out.bannerUrl = url;
  }
  if (typeof data.photoMediaId === "string") {
    const url = urls.get(data.photoMediaId);
    if (url) out.photoUrl = url;
  }
  if (typeof data.logoMediaId === "string") {
    const url = urls.get(data.logoMediaId);
    if (url) out.logoUrl = url;
  }
  if (typeof data.fileMediaId === "string") {
    const url = urls.get(data.fileMediaId);
    if (url) out.fileUrl = url;
  }
  if (typeof data.attachmentMediaId === "string") {
    const url = urls.get(data.attachmentMediaId);
    if (url) out.attachmentUrl = url;
  }
  if (Array.isArray(data.items)) {
    out.items = (data.items as Array<Record<string, unknown>>).map((it) => {
      if (it && typeof it.logoMediaId === "string") {
        const url = urls.get(it.logoMediaId);
        if (url) return { ...it, logoUrl: url };
      }
      return it;
    });
  }
  return out;
}
