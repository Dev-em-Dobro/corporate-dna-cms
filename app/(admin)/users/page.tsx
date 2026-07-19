import { redirect } from "next/navigation";
import { requireAdmin, AuthError } from "@/lib/auth/guards";
import UsersManager from "@/components/UsersManager";

export default async function UsersPage() {
  // Admin-only screen. This redirect is for UX; the API enforces 403 on its
  // own and is the actual boundary.
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof AuthError) {
      if (e.next === "enrol") redirect("/auth/enrol");
      if (e.next === "mfa") redirect("/login?step=mfa");
      redirect(e.status === 403 ? "/" : "/login");
    }
    throw e;
  }
  return <UsersManager />;
}
