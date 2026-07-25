import { NextRequest } from "next/server";
import { SEGMENT_TO_TYPE } from "@/lib/content/types";
import { listPublished, listPublishedCases } from "@/lib/content/published";
import { jsonOk, jsonError, readKeyValid, handleError } from "@/lib/http";

type Ctx = { params: Promise<{ type: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  try {
    if (!readKeyValid(req)) return jsonError(401, "Invalid API key");
    const { type: segment } = await ctx.params;
    const type = SEGMENT_TO_TYPE[segment];
    if (!type) return jsonError(404, "Unknown content type");

    const sp = new URL(req.url).searchParams;
    const locale = sp.get("locale") ?? "en";
    const page = Number(sp.get("page") ?? 1);
    const pageSize = Number(sp.get("pageSize") ?? 20);
    const tags = sp.getAll("tag");

    if (type === "case") {
      const result = await listPublishedCases({
        locale,
        page,
        pageSize,
        tags,
        industry: sp.getAll("industry"),
        service: sp.getAll("service"),
        region: sp.getAll("region"),
        outcome: sp.getAll("outcome"),
      });
      return jsonOk(result);
    }

    const result = await listPublished(type, { locale, page, pageSize, tags });
    return jsonOk(result);
  } catch (e) {
    return handleError(e);
  }
}
