import { redirect } from "next/navigation";
import { readSession } from "@/lib/auth/session";
import UsersManager from "@/components/UsersManager";

export default async function UsersPage() {
  const session = await readSession();
  // Admin-only screen. Editors are redirected; the API also enforces 403.
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/");
  return <UsersManager />;
}
