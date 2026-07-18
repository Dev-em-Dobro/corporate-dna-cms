import Link from "next/link";
import { redirect } from "next/navigation";
import { readSession } from "@/lib/auth/session";

const NAV: { href: string; label: string; adminOnly?: boolean }[] = [
  { href: "/", label: "Dashboard" },
  { href: "/cases", label: "Case studies" },
  { href: "/solutions", label: "Solutions" },
  { href: "/people", label: "People" },
  { href: "/regions", label: "Regions" },
  { href: "/insights", label: "Insights" },
  { href: "/pages", label: "Pages" },
  { href: "/media", label: "Media" },
  { href: "/users", label: "Users & audit", adminOnly: true },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await readSession();
  if (!session) redirect("/login");

  const items = NAV.filter((n) => !n.adminOnly || session.role === "admin");

  return (
    <div className="flex min-h-screen">
      <aside className="w-60 shrink-0 border-r border-[var(--color-line)] bg-[var(--color-paper)] p-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-brand)]">
          Corporate DNA
        </p>
        <p className="mb-6 text-sm font-semibold text-[var(--color-ink)]">CMS</p>
        <nav className="flex flex-col gap-1">
          {items.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="rounded px-3 py-2 text-sm text-[var(--color-ink)] hover:bg-white"
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <form action="/api/auth/logout" method="post" className="mt-8">
          <button className="text-xs text-[var(--color-muted)] underline">
            Sign out ({session.email})
          </button>
        </form>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
