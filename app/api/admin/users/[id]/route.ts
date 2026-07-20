import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/guards";
import { updateUser, resetMfa } from "@/lib/users/service";
import { writeAudit } from "@/lib/audit/log";
import { jsonOk, jsonError, clientMeta, handleError } from "@/lib/http";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, ctx: Ctx) {
  try {
    const admin = await requireAdmin();
    const { id } = await ctx.params;
    const body = await req.json();
    const patch: { role?: "admin" | "editor"; status?: "active" | "invited" | "disabled" } =
      {};
    if (body.role === "admin" || body.role === "editor") patch.role = body.role;
    if (
      body.status === "active" ||
      body.status === "invited" ||
      body.status === "disabled"
    )
      patch.status = body.status;
    if (patch.role === undefined && patch.status === undefined)
      return jsonError(422, "Nothing to update");

    const user = await updateUser(id, patch);
    await writeAudit({
      actorId: admin.sub,
      actorEmail: admin.email,
      action: patch.status === "disabled" ? "user.disabled" : "user.update",
      targetType: "user",
      targetId: id,
      metadata: patch,
    });
    return jsonOk({
      user: { id: user.id, email: user.email, role: user.role, status: user.status },
    });
  } catch (e) {
    return handleError(e);
  }
}

/**
 * Reset a user's second factor — for a lost or replaced phone.
 *
 * Deleting a verified factor signs the user out of every active session, so
 * the old factor stops working immediately rather than at the end of their
 * current session. They land in the bootstrap state and enrol again.
 */
export async function POST(req: NextRequest, ctx: Ctx) {
  try {
    const admin = await requireAdmin();
    const { id } = await ctx.params;
    const body = await req.json().catch(() => ({}));
    if (body?.action !== "reset-mfa") {
      return jsonError(422, "Unsupported action");
    }

    await resetMfa(id);
    await writeAudit({
      actorId: admin.sub,
      actorEmail: admin.email,
      action: "user.mfa_reset",
      targetType: "user",
      targetId: id,
    });
    // Resetting the factor signs the user out of every active session.
    await writeAudit({
      actorId: admin.sub,
      actorEmail: admin.email,
      action: "auth.session_revoked",
      targetType: "user",
      targetId: id,
      metadata: { reason: "mfa_reset", ...clientMeta(req) },
    });
    return jsonOk({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}
