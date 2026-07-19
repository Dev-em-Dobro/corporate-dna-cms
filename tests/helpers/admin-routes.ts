import { NextRequest } from "next/server";
import { jsonRequest } from "./auth";

/**
 * Every guarded route handler in the application, enumerated for the negative
 * sweep (T039 / SC-002 / SC-002a). The sweep calls HANDLERS, not URLs — a
 * hidden UI button is not enforcement, and neither is the proxy matcher.
 *
 * If a new admin route is added and this table is not updated, the count
 * assertion in auth-route-enforcement.test.ts fails, which is the point:
 * forgetting to extend the sweep should be loud.
 */

export interface GuardedRoute {
  /** Human-readable id, e.g. "GET /api/admin/users" */
  name: string;
  /** Admin-only routes 403 for editors even at full assurance. */
  adminOnly: boolean;
  call: () => Promise<Response>;
}

const ctx = <T extends Record<string, string>>(params: T) => ({
  params: Promise.resolve(params),
});
const get = (url: string) => new NextRequest(`http://localhost:3010${url}`);

// A syntactically valid id that will never exist — guards must fire BEFORE
// any lookup, so a 404 here would itself be a finding.
const NIL = "00000000-0000-0000-0000-000000000000";

export async function guardedRoutes(): Promise<GuardedRoute[]> {
  const audit = await import("@/app/api/admin/audit/route");
  const users = await import("@/app/api/admin/users/route");
  const usersId = await import("@/app/api/admin/users/[id]/route");
  const webhooks = await import("@/app/api/admin/webhooks/route");
  const webhooksId = await import("@/app/api/admin/webhooks/[id]/route");
  const type = await import("@/app/api/admin/[type]/route");
  const typeId = await import("@/app/api/admin/[type]/[id]/route");
  const preview = await import("@/app/api/admin/[type]/[id]/preview/route");
  const publish = await import("@/app/api/admin/[type]/[id]/publish/route");
  const restore = await import("@/app/api/admin/[type]/[id]/restore/route");
  const translate = await import("@/app/api/admin/[type]/[id]/translate/route");
  const unpublish = await import("@/app/api/admin/[type]/[id]/unpublish/route");
  const versions = await import("@/app/api/admin/[type]/[id]/versions/route");
  const media = await import("@/app/api/media/route");
  const mediaId = await import("@/app/api/media/[id]/route");

  const t = { type: "case" };
  const tid = { type: "case", id: NIL };

  return [
    // --- the 13 admin route files -------------------------------------------
    { name: "GET /api/admin/audit", adminOnly: true, call: () => audit.GET(get("/api/admin/audit")) },
    { name: "GET /api/admin/users", adminOnly: true, call: () => users.GET() },
    { name: "POST /api/admin/users", adminOnly: true, call: () => users.POST(jsonRequest("/api/admin/users", { email: "x@example.com", role: "editor" })) },
    { name: "PUT /api/admin/users/[id]", adminOnly: true, call: () => usersId.PUT(jsonRequest(`/api/admin/users/${NIL}`, { role: "editor" }, "PUT"), ctx({ id: NIL })) },
    { name: "POST /api/admin/users/[id]", adminOnly: true, call: () => usersId.POST(jsonRequest(`/api/admin/users/${NIL}`, { action: "reset-mfa" }), ctx({ id: NIL })) },
    { name: "GET /api/admin/webhooks", adminOnly: true, call: () => webhooks.GET() },
    { name: "POST /api/admin/webhooks", adminOnly: true, call: () => webhooks.POST(jsonRequest("/api/admin/webhooks", { url: "https://example.com" })) },
    { name: "PUT /api/admin/webhooks/[id]", adminOnly: true, call: () => webhooksId.PUT(jsonRequest(`/api/admin/webhooks/${NIL}`, { active: false }, "PUT"), ctx({ id: NIL })) },
    { name: "GET /api/admin/[type]", adminOnly: false, call: () => type.GET(get("/api/admin/case"), ctx(t)) },
    { name: "POST /api/admin/[type]", adminOnly: false, call: () => type.POST(jsonRequest("/api/admin/case", { data: {} }), ctx(t)) },
    { name: "GET /api/admin/[type]/[id]", adminOnly: false, call: () => typeId.GET(get(`/api/admin/case/${NIL}`), ctx(tid)) },
    { name: "PUT /api/admin/[type]/[id]", adminOnly: false, call: () => typeId.PUT(jsonRequest(`/api/admin/case/${NIL}`, { data: {} }, "PUT"), ctx(tid)) },
    { name: "DELETE /api/admin/[type]/[id]", adminOnly: false, call: () => typeId.DELETE(get(`/api/admin/case/${NIL}`), ctx(tid)) },
    { name: "POST /api/admin/[type]/[id]/preview", adminOnly: false, call: () => preview.POST(jsonRequest(`/api/admin/case/${NIL}/preview`, {}), ctx(tid)) },
    { name: "POST /api/admin/[type]/[id]/publish", adminOnly: false, call: () => publish.POST(jsonRequest(`/api/admin/case/${NIL}/publish`, {}), ctx(tid)) },
    { name: "POST /api/admin/[type]/[id]/restore", adminOnly: false, call: () => restore.POST(jsonRequest(`/api/admin/case/${NIL}/restore`, { versionId: NIL }), ctx(tid)) },
    { name: "POST /api/admin/[type]/[id]/translate", adminOnly: false, call: () => translate.POST(jsonRequest(`/api/admin/case/${NIL}/translate`, { locale: "pt" }), ctx(tid)) },
    { name: "POST /api/admin/[type]/[id]/unpublish", adminOnly: false, call: () => unpublish.POST(jsonRequest(`/api/admin/case/${NIL}/unpublish`, {}), ctx(tid)) },
    { name: "GET /api/admin/[type]/[id]/versions", adminOnly: false, call: () => versions.GET(get(`/api/admin/case/${NIL}/versions`), ctx(tid)) },
    // --- guarded routes outside /api/admin (same enforcement bar) -----------
    { name: "GET /api/media", adminOnly: false, call: () => media.GET(get("/api/media")) },
    { name: "POST /api/media", adminOnly: false, call: () => media.POST(new NextRequest("http://localhost:3010/api/media", { method: "POST", body: new FormData() })) },
    { name: "DELETE /api/media/[id]", adminOnly: false, call: () => mediaId.DELETE(get(`/api/media/${NIL}`), ctx({ id: NIL })) },
  ];
}

/** The 13 admin route files tasks.md and SC-002 talk about. */
export const ADMIN_ROUTE_FILE_COUNT = 13;
/** Handlers across those 13 files (audited by the sweep's count assertion). */
export const ADMIN_HANDLER_COUNT = 19;
