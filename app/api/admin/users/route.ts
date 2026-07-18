import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/guards";
import { listUsers, createUser } from "@/lib/users/service";
import { writeAudit } from "@/lib/audit/log";
import { sendEmail } from "@/lib/email/resend";
import { jsonOk, jsonError, handleError } from "@/lib/http";

export async function GET() {
  try {
    await requireAdmin(); // editors -> 403 (FR-014)
    const items = await listUsers();
    return jsonOk({ items });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();
    const { email, role, password, enableMfa } = body ?? {};

    if (typeof email !== "string" || !email.includes("@"))
      return jsonError(422, "Valid email required");
    if (role !== "admin" && role !== "editor")
      return jsonError(422, "role must be admin or editor");
    if (typeof password !== "string" || password.length < 8)
      return jsonError(422, "Password must be at least 8 characters");

    const { user, totpUri } = await createUser({
      email,
      role,
      password,
      enableMfa,
    });

    await writeAudit({
      actorId: admin.sub,
      action: "user.create",
      targetType: "user",
      targetId: user.id,
      metadata: { email: user.email, role: user.role },
    });

    await sendEmail({
      to: user.email,
      subject: "Your Corporate DNA CMS account",
      html: `<p>An account was created for you on the Corporate DNA CMS.</p>
             <p>Sign in and change your password.${totpUri ? " Set up your authenticator app to complete MFA." : ""}</p>`,
    });

    return jsonOk(
      { user: { id: user.id, email: user.email, role: user.role }, totpUri },
      201,
    );
  } catch (e) {
    return handleError(e);
  }
}
