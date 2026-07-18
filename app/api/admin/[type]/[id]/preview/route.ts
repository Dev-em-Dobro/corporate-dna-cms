import { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth/guards";
import { resolveTypeParam } from "@/lib/content/types";
import { createPreviewToken } from "@/lib/auth/session";
import { jsonOk, jsonError, handleError } from "@/lib/http";

type Ctx = { params: Promise<{ type: string; id: string }> };

export async function POST(_req: NextRequest, ctx: Ctx) {
  try {
    await requireSession();
    const { type: param, id } = await ctx.params;
    if (!resolveTypeParam(param)) return jsonError(404, "Unknown content type");
    const token = await createPreviewToken(id);
    return jsonOk({ url: `/preview/${param}/${id}?token=${token}` });
  } catch (e) {
    return handleError(e);
  }
}
