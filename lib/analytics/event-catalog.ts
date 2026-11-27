import "server-only";
import { listPublished } from "@/lib/content/published";

export type CatalogEvent = { slug: string; title: string; date?: string };
const site = "https://corporatednaconsulting.com";

// The public listing also includes events bundled with the marketing site.
export function readWebsiteEvents(html: string): CatalogEvent[] {
  const events: CatalogEvent[] = [];
  for (const match of html.matchAll(/<script\b[^>]*\btype=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    const schema = JSON.parse(match[1]);
    if (schema?.["@type"] !== "Event" || typeof schema.name !== "string" || typeof schema.url !== "string") continue;
    const url = new URL(schema.url, site);
    const slug = /^\/events\/([^/]+)\/?$/.exec(url.pathname)?.[1];
    if (url.origin === site && slug) {
      events.push({ slug, title: schema.name, date: typeof schema.startDate === "string" ? schema.startDate.slice(0, 10) : undefined });
    }
  }
  return events;
}

async function websiteEvents() {
  const response = await fetch(site + "/events", { next: { revalidate: 300 }, signal: AbortSignal.timeout(5000) });
  if (!response.ok) throw new Error("Event listing unavailable");
  return readWebsiteEvents(await response.text());
}

async function cmsEvents() {
  const events: CatalogEvent[] = [];
  for (let page = 1; ; page++) {
    const result = await listPublished("event", { page, pageSize: 100 });
    for (const item of result.items) {
      events.push({ slug: item.slug, title: item.title, date: "dateLabel" in item && typeof item.dateLabel === "string" ? item.dateLabel : undefined });
    }
    if (!result.items.length || page * result.pageSize >= result.total) return events;
  }
}

export async function loadEventCatalog() {
  const [cms, website] = await Promise.allSettled([cmsEvents(), websiteEvents()]);
  const bySlug = new Map<string, CatalogEvent>();
  if (cms.status === "fulfilled") for (const event of cms.value) bySlug.set(event.slug, event);
  if (website.status === "fulfilled") {
    for (const event of website.value) {
      bySlug.set(event.slug, { ...event, date: bySlug.get(event.slug)?.date || event.date });
    }
  }
  return {
    events: [...bySlug.values()].sort((a, b) => a.title.localeCompare(b.title) || a.slug.localeCompare(b.slug)),
    incomplete: cms.status === "rejected" || website.status === "rejected",
  };
}
