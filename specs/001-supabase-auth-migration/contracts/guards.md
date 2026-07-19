# Contract: Server-Side Guard API

**Spec**: [../spec.md](../spec.md) | **Research**: [../research.md](../research.md)

`lib/auth/guards.ts` is the enforcement point for this system. It is called explicitly by all 13
admin routes today (5 × `requireAdmin`, 8 × `requireSession`) and there is no middleware.

**This architecture is already what both Next.js and Supabase documentation prescribe.** The
migration changes the internals of this module and leaves the 13 call sites untouched.

---

## Why the guards are not replaced by the proxy

`proxy.ts` refreshes the session cookie. It is **not** an authorization boundary, and this is
documented, not inferred:

> "While Proxy can be useful for initial checks, it should not be your only line of defense…"

> "Server Functions are not separate routes in this chain… a Proxy matcher that excludes a path will
> also skip Proxy coverage… **Always verify authentication and authorization inside each Server
> Function** rather than relying on Proxy alone."

Also: page-level checks do not extend to Server Actions defined within them, and layouts do not
re-render on navigation under Partial Rendering, so checks placed there are unreliable.

Since this project has no RLS (research D8), the guards are the *only* line of defense. That is
already true today and is not a regression — but it means the negative tests behind SC-002 and
SC-002a carry the full weight of the security property.

---

## Exported surface

Signatures are preserved wherever possible so call sites do not change.

### `requireSession(): Promise<SessionPayload>`

Unchanged signature. Now throws `AuthError(403)` in two new cases:

| Condition | Throws | Reason |
|---|---|---|
| No session | `401` | Unchanged |
| `profiles.status = 'disabled'` | `403` | FR-006. Checked per request, because a live access token cannot be revoked (research D5/R3) |
| Second factor enrolled but not satisfied (`aal1`/`aal2`) | `403 { next: 'mfa' }` | FR-005 |
| No factor enrolled and role requires one (`aal1`/`aal1`) | `403 { next: 'enrol' }` | FR-029 bootstrap |

The thrown error carries `next` so route handlers and pages can route to the challenge or the
enrolment screen rather than dead-ending. Supabase's guidance is to **redirect to re-authentication
rather than reject outright**.

### `requireAdmin(): Promise<SessionPayload>`

Everything `requireSession` enforces, plus `role === 'admin'`, else `403`.

For administrators the bootstrap check is mandatory (FR-004): an admin without a verified factor
reaches enrolment and nothing else.

### `requireEnrolmentBootstrap(): Promise<SessionPayload>`

**New.** The inverse guard, used only by the enrolment routes. Succeeds *only* when the session is
authenticated and has **no verified factor**. Fails once a factor exists.

Splitting this out is deliberate: it makes "the one place where a password-only session is allowed
through" a single named, greppable, individually testable function rather than a conditional buried
inside `requireSession`.

### `currentUser(): Promise<Profile | null>`

Unchanged signature. Reads the `profiles` row for the current session.

---

## Internals

```
getClaims()  ──> claims { sub, aal, ... }        (cryptographic verification, no network
     │                                            IF the project uses asymmetric signing keys)
     ├──> profiles row by id                     (role + status — the authority for both)
     └──> aal claim + listFactors() as needed    (assurance level)
```

**Memoization**: the whole resolution is wrapped in React `cache()` inside a `server-only` module,
so a single render pass resolves it once regardless of how many guards run. Next.js's own
recommended DAL pattern.

**Per-request database read**: required, not incidental. It is what makes FR-006 and FR-009 work
despite unrevocable access tokens, and it is what makes a role change take effect immediately
instead of after up to an hour. It is also **not a regression** — `currentUser()` already does this
today.

**`getClaims()` vs `getUser()`**: `getUser()` contacts the Auth server on every call, which would
mean a network round-trip per guard on every one of 13 routes. `getClaims()` verifies against a
cached JWKS endpoint instead — which is only cheaper if the project uses asymmetric signing keys.
**Confirmed 2026-07-18**: this project signs with `ES256` (`kty: EC`, P-256), so `getClaims()` is
network-free and this design holds as written.

`getSession()` must never appear in server code. It reads local storage without re-validating and
is user-controllable.

---

## Retired

| Symbol | Fate |
|---|---|
| `createSession` / `readSession` / `destroySession` | Replaced by `@supabase/ssr` cookie handling |
| `createMfaChallenge` / `verifyMfaChallenge` | Replaced by `mfa.challenge` / `mfa.verify` |
| `hashPassword` / `verifyPassword` (`lib/auth/password.ts`) | Owned by Supabase. Retires `@node-rs/argon2` |
| `generateTotpSecret` / `totpKeyUri` / `verifyTotp` (`lib/auth/totp.ts`) | Owned by Supabase. Retires `otplib` |
| `AUTH_SECRET` | Retired |
| `CMS_DISABLE_MFA` | Retired. A local-dev MFA bypass is a second code path through the guard — exactly the surface FR-004 exists to close |

**Retained**: `createPreviewToken` / `verifyPreviewToken` and `PREVIEW_TOKEN_SECRET`. Preview
tokens are not user authentication and are explicitly out of scope.

---

## Dependencies removed

`otplib`, `qrcode`, `@types/qrcode`, `@node-rs/argon2`, `jose` (if no other consumer remains after
preview tokens are checked), `@neondatabase/serverless`.

Also `next-auth` (`^5.0.0-beta.31`) — **already dead**: it is declared in `package.json` and
imported nowhere in the codebase. Unrelated to this migration, but this is the right moment.
