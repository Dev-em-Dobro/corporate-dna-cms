import Link from "next/link";
import { SINGLETON_PAGES } from "@/lib/content/types";

const LABELS: Record<string, string> = {
  "5h": "5H Framework",
  book: "Book",
  awards: "Awards & partnerships",
  privacy: "Legal — Privacy",
  cookies: "Legal — Cookies",
  terms: "Legal — Terms",
};

export default function PagesList() {
  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-[var(--color-ink)]">Pages</h1>
      <p className="mb-5 text-sm text-[var(--color-muted)]">
        Singleton pages — one entry each.
      </p>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {Object.keys(SINGLETON_PAGES).map((key) => (
          <Link
            key={key}
            href={`/pages/${key}`}
            className="rounded-lg border border-[var(--color-line)] p-4 hover:border-[var(--color-brand)]"
          >
            <p className="font-medium text-[var(--color-ink)]">
              {LABELS[key] ?? key}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
