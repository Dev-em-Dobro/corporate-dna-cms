import Link from "next/link";
import { REGISTRY, type ContentType } from "@/lib/content/types";

// Cards shown on the dashboard home, in display order. Excludes the 5H
// Framework and Book pages, which are edited from their own screens.
const DASHBOARD_TYPES: ContentType[] = [
  "case",
  "solution",
  "person",
  "region",
  "insight",
  "page_awards",
  "page_legal",
];

export default function Dashboard() {
  const types = DASHBOARD_TYPES.map((t) => REGISTRY[t]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink">Dashboard</h1>
      <p className="mt-1 text-sm text-muted">
        Content overview. Everything here is editable without a developer.
      </p>
      <ul className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3">
        {types.map((def) => (
          <li key={def.type}>
            <Link
              href={def.segment ? `/${def.segment}` : "/pages"}
              className="flex h-full flex-col rounded-lg border border-line-strong p-4 transition-colors duration-150 hover:border-brand-dark hover:bg-paper"
            >
              <p className="text-sm font-semibold text-ink">{def.label}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
