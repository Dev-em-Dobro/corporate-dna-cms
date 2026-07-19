/**
 * Announcement + status primitives.
 *
 * Every async result in the CMS routes through StatusMessage so screen readers
 * hear it: `role="alert"` for errors (interrupts), `role="status"` for
 * confirmations (waits for a pause).
 */

export function StatusMessage({
  tone,
  children,
  className = "",
}: {
  tone: "error" | "success" | "info";
  children: React.ReactNode;
  className?: string;
}) {
  const toneClass =
    tone === "error"
      ? "bg-danger-surface text-danger"
      : tone === "success"
        ? "bg-success-surface text-success"
        : "bg-paper text-ink";

  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      aria-live={tone === "error" ? "assertive" : "polite"}
      className={`rounded px-3 py-2 text-sm ${toneClass} ${className}`}
    >
      {children}
    </p>
  );
}

/**
 * Always-mounted live region. Use where the message sits inline (next to a
 * button) and mounting a whole element would be visually noisy — the region
 * must already exist in the DOM for the announcement to fire reliably.
 */
export function LiveRegion({
  message,
  tone = "info",
  className = "",
}: {
  message: string;
  tone?: "error" | "info";
  className?: string;
}) {
  return (
    <span
      role={tone === "error" ? "alert" : "status"}
      aria-live={tone === "error" ? "assertive" : "polite"}
      className={`text-sm ${tone === "error" ? "text-danger" : "text-muted"} ${className}`}
    >
      {message}
    </span>
  );
}

const BADGE: Record<string, string> = {
  published: "bg-success-surface text-success",
  draft: "bg-draft-surface text-draft",
  active: "bg-success-surface text-success",
  disabled: "bg-danger-surface text-danger",
  invited: "bg-paper text-muted",
};

/** Status pill. Carries a text label, never colour alone (WCAG 1.4.1). */
export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
        BADGE[status] ?? "bg-paper text-muted"
      }`}
    >
      {status}
    </span>
  );
}

/** Placeholder rows so "loading" never renders as "empty". */
export function Skeleton({
  rows = 3,
  className = "",
}: {
  rows?: number;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-2 ${className}`} aria-hidden="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-11 animate-pulse rounded bg-paper" />
      ))}
    </div>
  );
}
