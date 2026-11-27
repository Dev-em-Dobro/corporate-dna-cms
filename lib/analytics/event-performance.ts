import "server-only";
import { JWT } from "google-auth-library";
import { z } from "zod";

export const periods = [7, 30, 90] as const;
export type Period = (typeof periods)[number];

export function reportPeriod(value?: string | string[]): Period {
  return periods.find(days => String(days) === value) ?? 30;
}

const rowSchema = z.object({
  dimensionValues: z.array(z.object({ value: z.string().optional() })),
  metricValues: z.tuple([z.object({ value: z.string().regex(/^\d+$/) })]),
});
const responseSchema = z.object({
  dimensionHeaders: z.array(z.object({ name: z.string() })),
  rows: z.array(rowSchema).optional(),
  rowCount: z.number().int().nonnegative().optional(),
});
type Row = z.infer<typeof rowSchema>;
const slugDimension = "customEvent:event_slug";
const buttonDimension = "customEvent:link_text";
const typeDimension = "customEvent:link_type";

export type EventPerformance = {
  slug: string;
  views: number;
  clicks: number;
  pdfClicks: number;
  buttons: { label: string; clicks: number }[];
};
export type PerformanceResult =
  | { status: "ready"; listingViews: number; events: EventPerformance[]; clickSource: "buttons" | "downloads"; listingPdfDownloads: number }
  | { status: "unconfigured" | "setup" | "unavailable" };

function dimension(row: Row, index: number, fallback: string) {
  const value = row.dimensionValues[index]?.value;
  return !value || value === "(not set)" ? fallback : value;
}

function summarizePerformance(activity: Row[], clicks: Row[]): PerformanceResult {
  const clickSource = clicks.length ? "buttons" : "downloads";
  const events = new Map<string, EventPerformance>();
  function forSlug(slug: string) {
    const event = events.get(slug) ?? { slug, views: 0, clicks: 0, pdfClicks: 0, buttons: [] };
    events.set(slug, event);
    return event;
  }
  let listingViews = 0;
  let listingPdfDownloads = 0;
  for (const row of activity) {
    const path = dimension(row, 0, "");
    const match = /^\/events(?:\/([^/]+))?\/?$/.exec(path);
    if (!match) continue;
    const slug = match[1];
    const kind = dimension(row, 1, "");
    const count = Number(row.metricValues[0].value);
    if (kind === "page_view") {
      if (slug) forSlug(slug).views += count;
      else listingViews += count;
    } else if (kind === "file_download" && clickSource === "downloads") {
      if (slug) forSlug(slug).pdfClicks += count;
      else listingPdfDownloads += count;
    }
  }
  for (const row of clicks) {
    const event = forSlug(dimension(row, 0, "(unassigned)"));
    const count = Number(row.metricValues[0].value);
    const label = dimension(row, 1, "Unlabelled button");
    event.clicks += count;
    if (dimension(row, 2, "") === "pdf") event.pdfClicks += count;
    const button = event.buttons.find(item => item.label === label);
    if (button) button.clicks += count;
    else event.buttons.push({ label, clicks: count });
  }
  for (const event of events.values()) {
    event.buttons.sort((a, b) => b.clicks - a.clicks || a.label.localeCompare(b.label));
  }
  return { status: "ready", listingViews, listingPdfDownloads, clickSource, events: [...events.values()].sort((a, b) => b.views - a.views || b.clicks - a.clicks || a.slug.localeCompare(b.slug)) };
}

class SetupError extends Error {}

function stringFilter(fieldName: string, value: string, matchType: "EXACT" | "FULL_REGEXP" = "EXACT") {
  return { filter: { fieldName, stringFilter: { matchType, value } } };
}

const productionHost = { filter: { fieldName: "hostName", inListFilter: {
  values: ["corporatednaconsulting.com", "www.corporatednaconsulting.com"],
} } };
const eventPages = stringFilter("pagePath", "/events(/[^/]+)?/?", "FULL_REGEXP");
const eventActivity = { andGroup: { expressions: [
  productionHost, eventPages,
  { orGroup: { expressions: [
    stringFilter("eventName", "page_view"),
    stringFilter("eventName", "event_cta_click"),
    { andGroup: { expressions: [stringFilter("eventName", "file_download"), stringFilter("fileExtension", "pdf")] } },
  ] } },
] } };
const detailedClicks = { andGroup: { expressions: [productionHost, eventPages, stringFilter("eventName", "event_cta_click")] } };

class MissingClickDimension extends Error {}

async function fetchRows(property: string, token: string, days: Period, names: string[], dimensionFilter: typeof eventActivity | typeof detailedClicks) {
  const rows: Row[] = [];
  do {
    const response = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${property}:runReport`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(12000),
      body: JSON.stringify({
        dateRanges: [{ startDate: `${days - 1}daysAgo`, endDate: "today" }],
        dimensions: names.map(name => ({ name })),
        metrics: [{ name: "eventCount" }],
        dimensionFilter,
        orderBys: names.map(dimensionName => ({ dimension: { dimensionName } })),
        limit: "10000", offset: String(rows.length),
      }),
    });
    if (response.status === 400 && names.includes(slugDimension)) {
      const failure = await response.json().catch(() => null);
      if (names.some(name => String(failure?.error?.message).includes(name))) throw new MissingClickDimension();
    }
    if ([400, 401, 403, 404].includes(response.status)) throw new SetupError();
    if (!response.ok) throw new Error("Analytics report unavailable");
    const report = responseSchema.parse(await response.json());
    if (report.dimensionHeaders.map(h => h.name).join() !== names.join()) throw new Error("Unexpected report dimensions");
    const page = report.rows ?? [];
    for (const row of page) {
      if (row.dimensionValues.length !== names.length) throw new Error("Incomplete dimensions");
      rows.push(row);
    }
    if (rows.length >= (report.rowCount ?? 0)) return rows;
    if (!page.length) throw new Error("Incomplete report");
  } while (true);
}

let credentials: JWT | undefined;
export async function loadEventPerformance(days: Period): Promise<PerformanceResult> {
  const property = process.env.GA4_PROPERTY_ID;
  const email = process.env.GA4_CLIENT_EMAIL;
  const key = process.env.GA4_PRIVATE_KEY;
  if (!property || !email || !key) return { status: "unconfigured" };
  if (!/^\d+$/.test(property)) return { status: "setup" };
  try {
    credentials ??= new JWT({ email, key: key.replace(/\\n/g, "\n"), scopes: ["https://www.googleapis.com/auth/analytics.readonly"] });
    const { token } = await credentials.getAccessToken();
    if (!token) return { status: "setup" };
    const activity = await fetchRows(property, token, days, ["pagePath", "eventName"], eventActivity);
    let clicks: Row[] = [];
    if (activity.some(row => dimension(row, 1, "") === "event_cta_click")) {
      try {
        clicks = await fetchRows(property, token, days, [slugDimension, buttonDimension, typeDimension], detailedClicks);
      } catch (error) {
        if (!(error instanceof MissingClickDimension)) throw error;
      }
    }
    return summarizePerformance(activity, clicks);
  } catch (error) {
    return { status: error instanceof SetupError ? "setup" : "unavailable" };
  }
}
