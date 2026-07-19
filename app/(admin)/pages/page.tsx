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
      <h1 className="mb-1 text-2xl font-bold text-ink">Pages</h1>
      <p className="mb-5 text-sm text-muted">
        Singleton pages — one entry each.
      </p>
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {Object.keys(SINGLETON_PAGES).map((key) => (
          <li key={key}>
            <Link
              href={`/pages/${key}`}
              className="flex min-h-16 items-center rounded-lg border border-line-strong p-4 transition-colors duration-150 hover:border-brand-dark hover:bg-paper"
            >
              <span className="font-medium text-ink">{LABELS[key] ?? key}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
