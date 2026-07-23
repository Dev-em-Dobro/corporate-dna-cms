import { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth/guards";
import { resolveTypeParam } from "@/lib/content/types";
import { reorderEntries } from "@/lib/content/entries";
import { jsonOk, jsonError, handleError } from "@/lib/http";

type Ctx = { params: Promise<{ type: string }> };

/**
 * Persist a drag-and-drop ordering for a collection. Body: `{ order: string[] }`
 * — translationGroupIds in the desired order. Static `reorder` segment sits
 * beside `[id]`, so Next routes /api/admin/people/reorder here, not to [id].
 */
export async function POST(req: NextRequest, ctx: Ctx) {
  try {
    const session = await requireSession();
    const { type: param } = await ctx.params;
    const type = resolveTypeParam(param);
    if (!type) return jsonError(404, "Unknown content type");

    const body = await req.json().catch(() => ({}));
    const order = body.order;
    if (
      !Array.isArray(order) ||
      !order.every((id) => typeof id === "string")
    ) {
      return jsonError(400, "Expected { order: string[] }");
    }

    await reorderEntries(type, order, session.sub);
    return jsonOk({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}
