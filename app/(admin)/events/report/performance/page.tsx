import { redirect } from "next/navigation";
import { requireSession, AuthError } from "@/lib/auth/guards";
import { loadEventPerformance, reportPeriod } from "@/lib/analytics/event-performance";
import { listEntries } from "@/lib/content/entries";
import EventPerformanceReport from "@/components/EventPerformanceReport";

export default async function EventPerformancePage({ searchParams }: {
  searchParams: Promise<{ days?: string | string[] }>;
}) {
  try {
    await requireSession();
  } catch (error) {
    if (!(error instanceof AuthError)) throw error;
    if (error.next === "enrol") redirect("/auth/enrol");
    redirect(error.next === "mfa" ? "/login?step=mfa" : "/login");
  }
  const days = reportPeriod((await searchParams).days);
  const report = await loadEventPerformance(days);
  const entries = report.status === "ready" && report.events.length
    ? await listEntries("event", { status: "published", limit: 1000 }).catch(() => [])
    : [];
  const titles = Object.fromEntries(entries.flatMap(entry =>
    typeof entry.data.title === "string" ? [[entry.slug, entry.data.title]] : []));
  return <EventPerformanceReport days={days} report={report} titles={titles} />;
}
