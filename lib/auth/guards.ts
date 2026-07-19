import "server-only";
import { cache } from "react";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { profiles, type Profile } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";
import { AuthError } from "@/lib/errors";

export { AuthError };

export type Role = "admin" | "editor";

export interface SessionPayload {
  sub: string; // auth.users id — same value as profiles.id
  role: Role;
  email: string;
}

/** Assurance state, derived from the JWT `aal` claim plus enrolled factors. */
export type Assurance =
  | "none" // no factor enrolled yet -> bootstrap (FR-029)
  | "pending" // factor enrolled, not satisfied this session
  | "satisfied";

interface Resolved {
  session: SessionPayload;
  profile: Profile;
  assurance: Assurance;
}

/**
 * Single resolution of "who is this request".
 *
 * Memoized with React `cache()` so a render pass that hits several guards pays
 * for this once. `getClaims()` verifies the JWT against a cached JWKS — this
 * project signs with ES256, so that costs no network round-trip. `getUser()`
 * would contact the Auth server on every call, and `getSession()` is unsafe
 * server-side because it never re-validates.
 */
const resolve = cache(async (): Promise<Resolved | null> => {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (error || !claims?.sub) return null;

  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, claims.sub));
  if (!profile) return null;

  /**
   * Role and status come from the database on every request, never from the
   * JWT. Supabase cannot revoke a live access token, so a JWT-borne value
   * stays stale for up to a full token lifetime after an admin demotes or
   * disables someone. This read is what makes FR-006 and FR-009 hold — and it
   * is not a new cost, the previous implementation did the same.
   */
  const assurance = await resolveAssurance(supabase, claims.aal);

  return {
    session: {
      sub: profile.id,
      role: profile.role as Role,
      email: profile.email,
    },
    profile,
    assurance,
  };
});

/**
 * Pure assurance resolution — exported for unit testing (T080).
 *
 * In `currentLevel`/`nextLevel` terms: aal2/aal2 -> satisfied; aal1/aal2
 * (factor exists, unsatisfied) -> pending; aal1/aal1 (no factor) -> none; a
 * missing/null level is treated as aal1. The stale-JWT aal2/aal1 case — the
 * token still claims aal2 after the factor was deleted — resolves "satisfied"
 * deliberately: an access token cannot be revoked, so this window exists no
 * matter what we do here, and it is bounded by the (shortened) token lifetime.
 */
export function assuranceFromClaims(
  aal: unknown,
  verifiedFactorCount: number,
): Assurance {
  if (aal === "aal2") return "satisfied";
  return verifiedFactorCount > 0 ? "pending" : "none";
}

async function resolveAssurance(
  supabase: Awaited<ReturnType<typeof createClient>>,
  aal: unknown,
): Promise<Assurance> {
  if (aal === "aal2") return "satisfied";

  // aal1 (or a JWT with no aal claim, which defaults to aal1) is ambiguous:
  // the user may have no factor at all, or have one they have not satisfied.
  // Only the enrolled-factor list separates those two, and they need opposite
  // treatment — enrol vs. challenge.
  const { data, error } = await supabase.auth.mfa.listFactors();
  if (error) return "pending"; // fail closed
  const verified = data?.totp?.filter((f) => f.status === "verified") ?? [];
  return assuranceFromClaims(aal, verified.length);
}

/** Require an authenticated, enabled user with a satisfied second factor. */
export async function requireSession(): Promise<SessionPayload> {
  const r = await resolve();
  if (!r) throw new AuthError(401, "Authentication required");

  if (r.profile.status === "disabled") {
    throw new AuthError(403, "Account disabled");
  }

  if (r.assurance === "none") {
    throw new AuthError(403, "Second factor enrolment required", "enrol");
  }
  if (r.assurance === "pending") {
    throw new AuthError(403, "Second factor required", "mfa");
  }

  return r.session;
}

/** Require an administrator. Throws AuthError(403) for editors. */
export async function requireAdmin(): Promise<SessionPayload> {
  const s = await requireSession();
  if (s.role !== "admin") {
    throw new AuthError(403, "Administrator access required");
  }
  return s;
}

/**
 * The inverse guard: succeeds ONLY for an authenticated session that has no
 * verified factor yet, and fails once one exists.
 *
 * This is the single place a password-only session is allowed through, so it
 * is a named export rather than a branch hidden inside requireSession — it
 * should be greppable, individually testable, and obvious in review.
 */
export async function requireEnrolmentBootstrap(): Promise<SessionPayload> {
  const r = await resolve();
  if (!r) throw new AuthError(401, "Authentication required");
  if (r.profile.status === "disabled") {
    throw new AuthError(403, "Account disabled");
  }
  if (r.assurance !== "none") {
    throw new AuthError(403, "A second factor is already enrolled");
  }
  return r.session;
}

/** Load the full profile row for the current session, or null. */
export async function currentUser(): Promise<Profile | null> {
  const r = await resolve();
  return r?.profile ?? null;
}

/** Assurance state without throwing — for UI routing decisions. */
export async function currentAssurance(): Promise<Assurance | null> {
  const r = await resolve();
  return r?.assurance ?? null;
}
