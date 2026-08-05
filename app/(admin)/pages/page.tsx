import Link from "next/link";

const SITE_PAGES: { key: string; label: string }[] = [
  { key: "home", label: "Home statistics" },
];

const LEGAL_PAGES: { key: string; label: string }[] = [
  { key: "privacy", label: "Privacy" },
  { key: "cookies", label: "Cookies" },
  { key: "terms", label: "Terms" },
];

function PageGroup({
  title,
  pages,
}: {
  title: string;
  pages: { key: string; label: string }[];
}) {
  return (
    <section className="mb-8">
      <h2 className="mb-3 text-lg font-semibold text-ink">{title}</h2>
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {pages.map(({ key, label }) => (
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
    </section>
  );
}

export default function PagesList() {
  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-ink">Site pages</h1>
      <p className="mb-5 text-sm text-muted">
        Singleton pages — one entry each.
      </p>
      <PageGroup title="Site" pages={SITE_PAGES} />
      <PageGroup title="Legal" pages={LEGAL_PAGES} />
    </div>
  );
}
