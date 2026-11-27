import { redirect } from "next/navigation";
import { requireSession, AuthError } from "@/lib/auth/guards";
import { loadEventPerformance, reportPeriod } from "@/lib/analytics/event-performance";
import { loadEventCatalog } from "@/lib/analytics/event-catalog";
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
  const catalog = report.status === "ready" ? await loadEventCatalog() : undefined;
  return <EventPerformanceReport days={days} report={report} catalog={catalog} />;
}
