import Link from "next/link";

// Only the legal singletons are managed here.
const LEGAL_PAGES: { key: string; label: string }[] = [
  { key: "privacy", label: "Privacy" },
  { key: "cookies", label: "Cookies" },
  { key: "terms", label: "Terms" },
];

export default function PagesList() {
  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-ink">Legal pages</h1>
      <p className="mb-5 text-sm text-muted">
        Singleton pages — one entry each.
      </p>
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {LEGAL_PAGES.map(({ key, label }) => (
          <li key={key}>
            <Link
              href={`/pages/${key}`}
              className="flex min-h-16 items-center rounded-lg border border-line-strong p-4 transition-colors duration-150 hover:border-brand-dark hover:bg-paper"
            >
              <span className="font-medium text-ink">{label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
