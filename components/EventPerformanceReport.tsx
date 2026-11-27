import type { CatalogEvent } from "@/lib/analytics/event-catalog";
import Link from "next/link";
import { buttonDark, buttonSecondary } from "@/components/ui/styles";
import { periods, type PerformanceResult, type Period } from "@/lib/analytics/event-performance";

const format = new Intl.NumberFormat("en");
const reportPath = "/events/report/performance";

function eventLabel(slug: string) {
  if (slug === "(unassigned)") return "Event not identified";
  if (slug === "(other)") return "Other events grouped by Google Analytics";
  return slug.replace(/-/g, " ");
}

export default function EventPerformanceReport({ days, report, catalog }: {
  days: Period;
  report: PerformanceResult;
  catalog?: { events: CatalogEvent[]; incomplete: boolean };
}) {
  const showButtons = report.status === "ready" && report.clickSource === "buttons";
  const labels = new Map(catalog?.events.map(event => [event.slug, event]));
  const measured = report.status === "ready" ? report.events : [];
  const measuredSlugs = new Set(measured.map(event => event.slug));
  const rows = [...measured];
  if (report.status === "ready") {
    for (const slug of labels.keys()) {
      if (!measuredSlugs.has(slug)) rows.push({ slug, views: 0, clicks: 0, pdfClicks: 0, buttons: [] });
    }
  }
  return <div className="mx-auto max-w-6xl space-y-6">
    <Link href="/events" className="text-sm font-semibold text-brand-dark underline">Back to Events</Link>
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div><h1 className="text-2xl font-bold text-ink">Event performance</h1>
        <p className="mt-1 text-sm text-muted">Google Analytics typically updates these counts within 2–6 hours.</p></div>
      <nav aria-label="Reporting period" className="flex flex-wrap gap-2">{periods.map(period =>
        <Link key={period} href={reportPath + "?days=" + period} aria-current={period === days ? "page" : undefined}
          className={period === days ? buttonDark : buttonSecondary}>{period} days</Link>)}</nav>
    </header>
    {report.status !== "ready" ? <section className="rounded-lg border border-line-strong bg-paper p-5" aria-label="Report status">
      <h2 className="font-semibold">{report.status === "unconfigured" ? "Analytics is not connected yet" : "Analytics data is unavailable"}</h2>
      <p className="mt-2 text-sm">{report.status === "unconfigured"
        ? "Ask your CMS administrator to connect the website’s Google Analytics property."
        : report.status === "setup" ? "Ask your CMS administrator to check the property, read access and event dimensions."
        : "Try again in a few minutes. If this continues, contact your CMS administrator."}</p>
    </section> : <>
      <dl className="grid gap-3 sm:grid-cols-3">{[
        ["Events listing views", report.listingViews],
        ["Event page views", report.events.reduce((sum, event) => sum + event.views, 0)],
        showButtons
          ? ["Event button clicks", report.events.reduce((sum, event) => sum + event.clicks, 0)]
          : ["Recorded PDF downloads", report.events.reduce((sum, event) => sum + event.pdfClicks, report.listingPdfDownloads)],
      ].map(([label, value]) => <div key={label} className="rounded-lg border border-line-strong p-4">
        <dt className="text-sm text-muted">{label}</dt><dd className="mt-1 text-3xl font-bold tabular-nums">{format.format(Number(value))}</dd>
      </div>)}</dl>
      <section aria-labelledby="event-breakdown"><h2 id="event-breakdown" className="mb-3 text-lg font-semibold">By event</h2>
        <p className="mb-3 text-sm text-muted">A zero means Google Analytics has recorded no activity for that metric in the selected period.</p>
        {catalog?.incomplete && <p className="mb-3 text-sm" role="status">Part of the event list could not be loaded. Some events may be missing.</p>}
        {rows.length === 0 ? <p className="rounded-lg border border-line-strong p-5 text-sm">No individual event activity was reported for the last {days} days.</p> :
          <div className="overflow-x-auto rounded-lg border border-line-strong">
            <table className="w-full min-w-[32rem] text-left text-sm"><thead className="bg-paper">
              <tr><th scope="col" className="p-3">Event</th>{(showButtons ? ["Page views", "Button clicks", "PDF clicks"] : ["Page views", "Recorded PDF downloads"]).map(label => <th key={label} scope="col" className="p-3 text-right">{label}</th>)}</tr>
            </thead><tbody>{rows.map(event => <tr key={event.slug} className="border-t border-line align-top">
              <th scope="row" className="p-3 font-medium"><span>{labels.get(event.slug)?.title ?? eventLabel(event.slug)}</span>
                {labels.get(event.slug)?.date && <span className="block text-xs font-normal text-muted">{labels.get(event.slug)?.date}</span>}
                {event.buttons.length > 0 && <details className="mt-1"><summary className="w-fit cursor-pointer font-medium text-brand-dark">Clicks by button</summary>
                  <dl className="mt-2 max-w-xs space-y-1">{event.buttons.map(button => <div key={button.label} className="flex justify-between gap-4"><dt className="font-normal">{button.label}</dt><dd className="tabular-nums">{format.format(button.clicks)}</dd></div>)}</dl></details>}
              </th>{(showButtons ? [event.views, event.clicks, event.pdfClicks] : [event.views, event.pdfClicks]).map((n, index) => <td key={index} className="p-3 text-right tabular-nums">{format.format(n)}</td>)}
            </tr>)}</tbody></table>
          </div>}
        <p className="mt-3 text-sm text-muted">{showButtons ? "PDF clicks are included in button clicks. They count requests to open a file." : "Recorded PDF downloads count clicks on PDF links captured by Google Analytics on the listing and individual event pages. Button-level data is unavailable for this period."} Page views include repeat visits.</p>
      </section>
    </>}
  </div>;
}
