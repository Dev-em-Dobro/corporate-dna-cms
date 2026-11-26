import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { loadEventPerformance, reportPeriod } from "@/lib/analytics/event-performance";
import EventPerformanceReport from "@/components/EventPerformanceReport";

vi.mock("google-auth-library", () => ({
  JWT: class { async getAccessToken() { return { token: "test-only" }; } },
}));

const views = ["customEvent:event_slug"];
const clicks = [...views, "customEvent:link_text", "customEvent:link_type"];
function page(names: string[], rows: [string[], number][], total = rows.length) {
  return Response.json({
    dimensionHeaders: names.map(name => ({ name })), rowCount: total,
    rows: rows.map(([values, count]) => ({
      dimensionValues: values.map(value => ({ value })), metricValues: [{ value: String(count) }],
    })),
  });
}

describe("event performance", () => {
  beforeEach(() => {
    vi.stubEnv("GA4_PROPERTY_ID", "123");
    vi.stubEnv("GA4_CLIENT_EMAIL", "report@example.test");
    vi.stubEnv("GA4_PRIVATE_KEY", "test-only");
  });
  afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
  it("uses a bounded inclusive period and defaults to thirty days", () => {
    expect(["7", "90", "365", undefined, ["7"]].map(reportPeriod)).toEqual([7, 90, 30, 30, 30]);
  });
  it("shows a connection message without a Google request when unconfigured", async () => {
    vi.stubEnv("GA4_PROPERTY_ID", "");
    const get = vi.fn(); vi.stubGlobal("fetch", get);
    const report = await loadEventPerformance(30);
    expect(report.status).toBe("unconfigured");
    expect(get).not.toHaveBeenCalled();
    expect(renderToStaticMarkup(createElement(EventPerformanceReport, { days: 30, report }))).toContain("not connected yet");
  });
  it("separates listing views, counts clicks from all pages, keeps PDF clicks a subset and reads later pages", async () => {
    const get = vi.fn(async (url: string, init: RequestInit) => {
      expect(url).toBe("https://analyticsdata.googleapis.com/v1beta/properties/123:runReport");
      const req = JSON.parse(String(init.body));
      expect(req.dateRanges).toEqual([{ startDate: "29daysAgo", endDate: "today" }]);
      if (req.dimensionFilter.filter.stringFilter.value === "event_page_view") {
        return req.offset === "0" ? page(views, [[["events_index"], 19]], 2) : page(views, [[["conference"], 11]], 2);
      }
      expect(req.dimensionFilter.filter.stringFilter.value).toBe("event_cta_click");
      return page(clicks, [[["conference", "Prospectus", "pdf"], 5], [["conference", "Prospectus", "link"], 2], [["new-event", "Apply", "link"], 1]]);
    });
    vi.stubGlobal("fetch", get);
    expect(await loadEventPerformance(30)).toEqual({ status: "ready", listingViews: 19, events: [
      { slug: "conference", views: 11, clicks: 7, pdfClicks: 5, buttons: [{ label: "Prospectus", clicks: 7 }] },
      { slug: "new-event", views: 0, clicks: 1, pdfClicks: 0, buttons: [{ label: "Apply", clicks: 1 }] },
    ] });
    expect(get).toHaveBeenCalledTimes(3);
  });
  it("renders an empty period only after successful reports", async () => {
    vi.stubGlobal("fetch", vi.fn(async (_url, init) => page(JSON.parse(init.body).dimensions.map((d: {name: string}) => d.name), [])));
    const report = await loadEventPerformance(7);
    expect(report).toEqual({ status: "ready", listingViews: 0, events: [] });
    expect(renderToStaticMarkup(createElement(EventPerformanceReport, { days: 7, report }))).toContain("No individual event activity");
  });
  it.each([[400,"setup"],[403,"setup"],[429,"unavailable"],[503,"unavailable"]])("distinguishes GA response %s from zero activity", async (code, status) => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: Number(code) })));
    expect(await loadEventPerformance(30)).toEqual({ status });
  });
});
