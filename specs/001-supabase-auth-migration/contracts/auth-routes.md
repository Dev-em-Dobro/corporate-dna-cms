# Contract: Authentication HTTP Routes

**Spec**: [../spec.md](../spec.md) | **Research**: [../research.md](../research.md)

Existing routes keep their paths so the client surface changes as little as possible. New routes
cover flows that do not exist today.

---

## Existing routes — behaviour changes

### `POST /api/auth/login`

Unchanged request shape. What changes is what comes back and why.

**Request**: `{ email: string, password: string }`

**Responses**:

| Status | Body | When |
|---|---|---|
| 200 | `{ ok: true, next: "mfa" }` | Password accepted, a verified factor exists — client must complete the challenge |
| 200 | `{ ok: true, next: "enrol" }` | Password accepted, **no factor enrolled** — bootstrap state (FR-029) |
| 200 | `{ ok: true, next: "done" }` | Password accepted, no second factor required for this account and role |
| 401 | `{ error }` | Invalid credentials, or account disabled (FR-006). Indistinguishable by design |
| 422 | `{ error }` | Malformed request |
| 429 | `{ error }` | Rate limited |

**Breaking change**: the response no longer carries a `challengeId`. The custom 5-minute MFA
challenge JWT is retired; Supabase issues an `aal1` session at this point and the challenge is
established separately. Callers must branch on `next` rather than on the presence of a challenge.

The `next` value is derived from the `currentLevel` / `nextLevel` pair, never from a stored
`mfa_enabled` flag.

---

### `POST /api/auth/mfa`

**Request**: `{ code: string }` — `challengeId` is **removed**; the pending challenge is resolved
server-side from the `aal1` session.

**Responses**:

| Status | Body | When |
|---|---|---|
| 200 | `{ ok: true }` | Code accepted; session elevated to `aal2`. Writes `last_login_at`, audits `auth.login` |
| 401 | `{ error }` | Wrong code, or no `aal1` session. Audits `auth.mfa_fail` |
| 429 | `{ error }` | **Platform limit: 15/hour per IP, not per user, not configurable** (risk R1) |

The 429 here is materially different from every other 429 in this API: it is imposed by Supabase,
shared across all users behind one egress IP, and cannot be raised. The response should say so in
terms an editor can act on, not just "try again later".

---

### `POST /api/auth/logout`

**Request**: empty.

**Response**: `200 { ok: true }`.

**Behaviour change**: must call `signOut({ scope: 'local' })` **explicitly**. Supabase's default
scope is `global`, which signs the user out of every device — a silent regression from today's
per-session logout if left unspecified (risk R9).

---

## New routes

### `POST /api/auth/mfa/enrol`

Begins enrolment. Callable only by an authenticated session with **no verified factor**
(the bootstrap state). Returns `403` otherwise.

**Response**: `200 { qrCodeSvg: string, secret: string, uri: string, factorId: string }`

`qrCodeSvg` is the SVG returned by Supabase, for wrapping as a data URL. `secret` is the
manual-entry fallback required by FR-003.

**Precondition enforced server-side**: call `listFactors()` and `unenroll()` any pre-existing
*unverified* factor before enrolling. Without this, abandoned enrolments accumulate toward the
10-factor cap (research D9 / risk R5). This is what makes US1 scenario 3 pass.

---

### `POST /api/auth/mfa/enrol/confirm`

**Request**: `{ factorId: string, code: string }`

**Response**: `200 { ok: true }` — factor verified, session elevated to `aal2`, audits
`auth.mfa_enrolled` and the bootstrap exit (FR-031).

Supabase logs out all other sessions on successful verification. This is expected, not a bug.

---

### `GET /api/auth/confirm`

Callback for email-delivered links — invitation acceptance, password recovery, email confirmation.

**Query**: `token_hash`, `type` (`EmailOtpType`), optional `next`

Verifies via `verifyOtp({ type, token_hash })` and redirects to `next`, or to an error page on
failure. Note this is the `token_hash` flow, not `exchangeCodeForSession`.

---

### `POST /api/auth/recover`

**Request**: `{ email: string }`

**Response**: **always** `200 { ok: true }`, regardless of whether the address is registered
(FR-017). The response must not vary in body, status, or observable timing.

---

### `POST /api/auth/password`

**Request**: `{ password: string, currentPassword?: string }`

Passes `current_password` through to `updateUser()` when present, so an authenticated password
change re-verifies the old one. Recommended for an admin surface; recovery-link flows omit it.

---

## Admin routes — unchanged paths, new mechanics

`/api/admin/users` and `/api/admin/users/[id]` keep their shapes with these changes:

| Operation | Change |
|---|---|
| Create user | No longer accepts a `password` field. Sends an invitation via `admin.inviteUserByEmail()`; the user sets their own password (FR-014). Status starts at `invited` — a transition that is real for the first time |
| Response on create | No longer returns `totpUri` / `totpSecret`. **An administrator can no longer enrol a factor on another user's behalf** — Supabase has no such API. This is the mechanical reason FR-029's bootstrap state exists |
| Reset MFA | New. `admin.mfa.deleteFactor()`, which logs the user out of all sessions when the factor was verified. Satisfies FR-015 and the factor-reset half of FR-009 immediately |
| Disable user | Sets `profiles.status = 'disabled'` **and** applies a Supabase ban, together, through one service function (see data-model). Neither alone is sufficient |
| Change role | Writes `profiles.role`. Takes effect on the next request because the guard reads it from the database, not from a JWT claim (research D5) |

---

## Cross-cutting

**Audit**: every route above writes through `writeAudit()`. New actions: `auth.mfa_enrolled`,
`auth.bootstrap_enter`, `auth.bootstrap_exit` (FR-031), `user.invited`, `user.mfa_reset`.

**Error envelope**: unchanged — `{ error: string }` with the existing `jsonError` / `jsonOk` /
`handleError` helpers in `lib/http.ts`.

**Preview tokens** (`createPreviewToken` / `verifyPreviewToken`) are explicitly out of scope and
keep using `PREVIEW_TOKEN_SECRET`. `AUTH_SECRET` is retired; `PREVIEW_TOKEN_SECRET` is not.
