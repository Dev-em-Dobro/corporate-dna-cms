import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/guards";
import { updateUser } from "@/lib/users/service";
import { writeAudit } from "@/lib/audit/log";
import { jsonOk, jsonError, handleError } from "@/lib/http";

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

    const { user, totpUri } = await updateUser(id, patch);
    await writeAudit({
      actorId: admin.sub,
      action: "user.update",
      targetType: "user",
      targetId: id,
      metadata: patch,
    });
    return jsonOk({
      user: { id: user.id, email: user.email, role: user.role, status: user.status },
      totpUri,
    });
  } catch (e) {
    return handleError(e);
  }
}
