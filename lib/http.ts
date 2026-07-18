import { NextResponse } from "next/server";
import { AuthError, ConflictError, NotFoundError } from "@/lib/errors";

export { AuthError, ConflictError, NotFoundError };

export function jsonOk(data: unknown, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}

export function jsonError(
  status: number,
  message: string,
  extra?: Record<string, unknown>,
): NextResponse {
  return NextResponse.json({ error: message, ...extra }, { status });
}

/** 422 with field-level validation detail (matches contracts/admin-api.md). */
export function jsonValidationError(
  errors: Record<string, string>,
): NextResponse {
  return NextResponse.json(
    { error: "Validation failed", fields: errors },
    { status: 422 },
  );
}

/** Map thrown errors (AuthError, edit conflicts, not-found) to responses. */
export function handleError(e: unknown): NextResponse {
  if (e instanceof AuthError) return jsonError(e.status, e.message);
  if (e instanceof ConflictError) return jsonError(409, e.message);
  if (e instanceof NotFoundError) return jsonError(404, e.message);
  console.error("[api] unhandled error:", e);
  return jsonError(500, "Internal error");
}

/**
 * Validate the read API key. If READ_API_KEY is unset the read API is treated as
 * public (still published-only). If set, callers must send a matching x-api-key.
 */
export function readKeyValid(req: Request): boolean {
  const expected = process.env.READ_API_KEY;
  if (!expected) return true;
  return req.headers.get("x-api-key") === expected;
}

// --- Best-effort in-memory rate limiter ---------------------------------------
// NOTE: per-instance only (Fluid Compute reuses instances but does not share
// state globally). Adequate as a baseline for login/MFA throttling; a durable
// store (e.g. Neon/Upstash) can replace it later without changing call sites.
const buckets = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  key: string,
  max: number,
  windowMs: number,
): boolean {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || now > b.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (b.count >= max) return false;
  b.count += 1;
  return true;
}
