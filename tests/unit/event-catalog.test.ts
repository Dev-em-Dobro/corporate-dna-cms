import { afterEach, describe, expect, it, vi } from "vitest";
import { loadEventCatalog } from "@/lib/analytics/event-catalog";
import { listPublished } from "@/lib/content/published";

vi.mock("@/lib/content/published", () => ({ listPublished: vi.fn() }));
afterEach(() => { vi.resetAllMocks(); vi.unstubAllGlobals(); });

describe("published event catalog", () => {
  it("combines events from both sources by slug and keeps separate editions of the same event", async () => {
    vi.mocked(listPublished).mockResolvedValue({page: 1, pageSize: 100, total: 2, items: [
      { slug: "annual", title: "CMS title", dateLabel: "June 2026" }, { slug: "new", title: "New event" },
    ]} as Awaited<ReturnType<typeof listPublished>>);
    const scripts = ["annual", "another-edition"].map(slug =>
      '<script type="application/ld+json">' + JSON.stringify({
        "@type": "Event", name: "Public title", url: "https://corporatednaconsulting.com/events/" + slug, startDate: "2026-06-11",
      }) + "</script>").join("");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(scripts)));
    const catalog = await loadEventCatalog();
    expect(catalog.incomplete).toBe(false);
    expect(catalog.events).toHaveLength(3);
    expect(catalog.events).toContainEqual({ slug: "annual", title: "Public title", date: "June 2026" });
    expect(catalog.events).toContainEqual({ slug: "another-edition", title: "Public title", date: "2026-06-11" });
  });
  it("flags a partial catalog when the website is unavailable", async () => {
    vi.mocked(listPublished).mockResolvedValue({page: 1, pageSize: 100, total: 0, items: []});
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, {status: 503})));
    expect(await loadEventCatalog()).toEqual({ events: [], incomplete: true });
  });
});
