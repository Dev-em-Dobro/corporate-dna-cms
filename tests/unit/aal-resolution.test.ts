import { describe, it, expect } from "vitest";
import { assuranceFromClaims } from "@/lib/auth/guards";

/**
 * T080 — assurance resolution across all four currentLevel/nextLevel
 * combinations. The implementation reads the JWT `aal` claim plus the
 * verified-factor count, which maps onto Supabase's
 * getAuthenticatorAssuranceLevel() pairs as follows:
 *
 *   currentLevel / nextLevel   ->  aal claim + factors    ->  Assurance
 *   aal1 / aal1  (no factor)       "aal1", 0 verified         "none"
 *   aal1 / aal2  (unsatisfied)     "aal1", 1+ verified        "pending"
 *   aal2 / aal2  (satisfied)       "aal2", 1+ verified        "satisfied"
 *   null / *     (no session)      missing aal claim          treated as aal1
 */
describe("assuranceFromClaims", () => {
  it("aal1/aal1 — no factor enrolled: bootstrap ('none' -> enrol)", () => {
    expect(assuranceFromClaims("aal1", 0)).toBe("none");
  });

  it("aal1/aal2 — factor enrolled, not satisfied: 'pending' -> challenge", () => {
    expect(assuranceFromClaims("aal1", 1)).toBe("pending");
    expect(assuranceFromClaims("aal1", 3)).toBe("pending");
  });

  it("aal2/aal2 — factor satisfied this session: 'satisfied'", () => {
    expect(assuranceFromClaims("aal2", 1)).toBe("satisfied");
  });

  it("null/undefined current level defaults to aal1 semantics", () => {
    expect(assuranceFromClaims(null, 0)).toBe("none");
    expect(assuranceFromClaims(undefined, 0)).toBe("none");
    expect(assuranceFromClaims(null, 1)).toBe("pending");
  });

  it("unknown claim values fail toward the challenge, never toward access", () => {
    expect(assuranceFromClaims("aal3", 1)).toBe("pending");
    expect(assuranceFromClaims("", 1)).toBe("pending");
    expect(assuranceFromClaims(42, 0)).toBe("none");
  });

  it("stale-JWT aal2/aal1 — factor deleted, token still claims aal2: 'satisfied' by design", () => {
    /**
     * Documented, deliberate: an issued access token cannot be revoked, so a
     * session whose factor was just reset keeps aal2 until the token expires.
     * The mitigation is the shortened token lifetime (T003) plus session
     * termination on factor deletion — not this function. If this asserts
     * anything else, the implementation grew a check that silently depends on
     * a network call this pure function must not make.
     */
    expect(assuranceFromClaims("aal2", 0)).toBe("satisfied");
  });
});
