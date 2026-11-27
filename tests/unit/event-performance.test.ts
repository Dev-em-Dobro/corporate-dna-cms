import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { loadEventPerformance, reportPeriod } from "@/lib/analytics/event-performance";
import EventPerformanceReport from "@/components/EventPerformanceReport";

vi.mock("google-auth-library", () => ({
  JWT: class { async getAccessToken() { return { token: "test-only" }; } },
}));

const views = ["pagePath", "eventName"];
const clicks = ["customEvent:event_slug", "customEvent:link_text", "customEvent:link_type"];
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
      if (req.dimensions[0].name === "pagePath") {
        return req.offset === "0" ? page(views, [[["/events", "page_view"], 19]], 3) : page(views, [[["/events/conference", "page_view"], 11], [["/events/conference", "event_cta_click"], 7]], 3);
      }
      expect(req.dimensionFilter.andGroup.expressions).toContainEqual({filter:{fieldName:"eventName",stringFilter:{matchType:"EXACT",value:"event_cta_click"}}});
      return page(clicks, [[["conference", "Prospectus", "pdf"], 5], [["conference", "Prospectus", "link"], 2], [["new-event", "Apply", "link"], 1]]);
    });
    vi.stubGlobal("fetch", get);
    expect(await loadEventPerformance(30)).toEqual({ status: "ready", clickSource: "buttons", listingPdfDownloads: 0, listingViews: 19, events: [
      { slug: "conference", views: 11, clicks: 7, pdfClicks: 5, buttons: [{ label: "Prospectus", clicks: 7 }] },
      { slug: "new-event", views: 0, clicks: 1, pdfClicks: 0, buttons: [{ label: "Apply", clicks: 1 }] },
    ] });
    expect(get).toHaveBeenCalledTimes(3);
  });
  it("uses standard GA4 activity when the property has no custom tracking", async () => {
    const get = vi.fn(async (_url, init) => {
      const query = JSON.parse(init.body);
      expect(query.dimensions.map((d: {name: string}) => d.name)).toEqual(views);
      const filters = JSON.stringify(query.dimensionFilter);
      for (const field of ["hostName", "corporatednaconsulting.com", "pagePath", "fileExtension", "pdf"]) expect(filters).toContain(field);
      return page(views, [
        [["/events/", "page_view"], 20], [["/events/conference/", "page_view"], 4],
        [["/events/conference", "page_view"], 3], [["/events", "file_download"], 1],
        [["/events/conference", "file_download"], 2],
      ]);
    });
    vi.stubGlobal("fetch", get);
    const report = await loadEventPerformance(90);
    expect(report).toMatchObject({ status: "ready", listingViews: 20, listingPdfDownloads: 1, clickSource: "downloads",
      events: [{ slug: "conference", views: 7, pdfClicks: 2 }] });
    expect(get).toHaveBeenCalledTimes(1);
    const html = renderToStaticMarkup(createElement(EventPerformanceReport, { days: 90, report }));
    expect(html).toContain("Recorded PDF downloads");
    expect(html).not.toContain("Event button clicks");
  });
  it("retains recorded downloads and views if a button dimension is missing", async () => {
    const get = vi.fn().mockResolvedValueOnce(page(views, [
      [["/events/a", "event_cta_click"], 10], [["/events/a", "file_download"], 2],
    ])).mockResolvedValueOnce(Response.json({error: {message: "Field customEvent:event_slug is not a valid dimension."}}, {status: 400}));
    vi.stubGlobal("fetch", get);
    expect(await loadEventPerformance(7)).toMatchObject({ status: "ready", clickSource: "downloads", events: [{slug: "a", pdfClicks: 2}] });
  });
  it("renders an empty period only after successful reports", async () => {
    vi.stubGlobal("fetch", vi.fn(async (_url, init) => page(JSON.parse(init.body).dimensions.map((d: {name: string}) => d.name), [])));
    const report = await loadEventPerformance(7);
    expect(report).toEqual({ status: "ready", clickSource: "downloads", listingPdfDownloads: 0, listingViews: 0, events: [] });
    expect(renderToStaticMarkup(createElement(EventPerformanceReport, { days: 7, report }))).toContain("No individual event activity");
  });
  it.each([[400,"setup"],[403,"setup"],[429,"unavailable"],[503,"unavailable"]])("distinguishes GA response %s from zero activity", async (code, status) => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: Number(code) })));
    expect(await loadEventPerformance(30)).toEqual({ status });
  });
});
