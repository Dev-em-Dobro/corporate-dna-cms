import { redirect } from "next/navigation";
import { readSession } from "@/lib/auth/session";
import AdminNav, { type NavItem } from "@/components/AdminNav";

const NAV: (NavItem & { adminOnly?: boolean })[] = [
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
    <div className="min-h-screen md:flex">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Skip to main content
      </a>
      <AdminNav items={items} email={session.email} />
      <main id="main" className="min-w-0 flex-1 p-4 sm:p-6 md:p-8">
        {children}
      </main>
    </div>
  );
}
