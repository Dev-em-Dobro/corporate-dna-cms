import { redirect } from "next/navigation";
import { requireEnrolmentBootstrap, AuthError } from "@/lib/auth/guards";
import EnrolForm from "./EnrolForm";

/**
 * Second-factor enrolment. Reachable only from the bootstrap state — signed in
 * with a password, no verified factor yet.
 *
 * Anyone who already has a factor is bounced away: this page must not be a
 * route back into enrolment for an account that is already protected.
 */
export default async function EnrolPage() {
  try {
    await requireEnrolmentBootstrap();
  } catch (e) {
    if (e instanceof AuthError) {
      redirect(e.status === 401 ? "/login" : "/");
    }
    throw e;
  }
  return <EnrolForm />;
}
