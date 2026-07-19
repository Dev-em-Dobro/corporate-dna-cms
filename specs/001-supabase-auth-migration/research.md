# Phase 0 Research: Supabase Auth Migration

**Date**: 2026-07-18 | **Spec**: [spec.md](./spec.md)

All findings verified against live vendor documentation (July 2026). Items that could not be
verified are listed in [Open Risks](#open-risks) rather than silently assumed.

---

## D1 — SSR integration package

**Decision**: `@supabase/ssr` + `@supabase/supabase-js`.

**Rationale**: `@supabase/auth-helpers-nextjs` is deprecated; the repository is titled "now
deprecated" and Supabase states future fixes target `@supabase/ssr` only. The canonical reference
implementation is `vercel/next.js` `examples/with-supabase`.

**Alternatives considered**: `auth-helpers` (deprecated, rejected); hand-rolling cookie handling
(rejected — the cookie-refresh dance is the exact thing that breaks silently).

---

## D2 — Reading identity server-side

**Decision**: `supabase.auth.getClaims()`, wrapped in a `server-only` DAL memoized with React
`cache()`.

**Rationale**: `getSession()` is explicitly untrusted server-side — it reads local storage without
re-validating, and cookies are user-controllable. `getUser()` is trusted but **sends a request to
the Auth server on every call**. `getClaims()` verifies the JWT against a cached JWKS endpoint and
is network-free — **but only when the project uses asymmetric (ECC/RSA) signing keys**. On legacy
symmetric HS256 projects it falls back to a server request.

**Consequence — resolved 2026-07-18**: the project's JWKS endpoint returns a single `ES256` key
(`kty: EC`, curve P-256), so the signing keys **are asymmetric** and `getClaims()` is genuinely
network-free. This was the highest-impact open unknown in the plan and it landed on the favourable
side: the guards can run on all 13 admin routes without a per-call round-trip to the Auth server.
Risk R4 is closed.

**Alternatives considered**: `getUser()` everywhere (correct but a network hop per guard call, and
guards run on every one of 13 admin routes); `getSession()` (rejected outright — unsafe).

---

## D3 — Cookie refresh: `proxy.ts`, not `middleware.ts`

**Decision**: adopt Next.js 16's `proxy.ts` convention for session refresh only.

**Rationale**: Next.js 16 deprecated and renamed the `middleware` convention to `proxy`, which now
defaults to the Node.js runtime. Supabase's template already ships `lib/supabase/proxy.ts`. Server
Components cannot write cookies, so a proxy is what actually persists a refreshed token — without
it, users get randomly signed out.

**Codemod available**: `npx @next/codemod@canary middleware-to-proxy .` (this project has no
middleware today, so it is a clean addition rather than a migration).

**Critical constraint**: the proxy is **not** an authorization boundary. Both vendors document this
explicitly. Next.js is sharper still on Server Actions:

> "Server Functions are not separate routes in this chain… a Proxy matcher that excludes a path will
> also skip Proxy coverage… **Always verify authentication and authorization inside each Server
> Function** rather than relying on Proxy alone."

Also: a page-level check does not extend to Server Actions defined in it, and layout checks are
unreliable because layouts do not re-render on navigation under Partial Rendering.

---

## D4 — Keep the existing guard architecture

**Decision**: retain `requireSession` / `requireAdmin` as the enforcement point. Reimplement their
internals over Supabase; do not replace them with proxy checks.

**Rationale**: this project already does the right thing. There is no middleware, and all 13 admin
routes call a guard explicitly (5 × `requireAdmin`, 8 × `requireSession`). That is precisely the
architecture both Next.js and Supabase documentation prescribe. The migration therefore changes the
*inside* of `lib/auth/guards.ts` and leaves 13 call sites untouched.

This is the single most favourable fact about this migration's blast radius.

---

## D5 — Where the application role lives

**Decision**: role and status are read from the application database inside the DAL on each guard
call. Do **not** rely on a JWT claim for authorization.

**Rationale**: this is forced by FR-009 (sessions must be invalidated when an account is disabled).
Supabase **cannot revoke an already-issued access token before it expires** — admin sign-out and
ban revoke the *refresh* token, but the outstanding access token stays cryptographically valid until
`exp`, up to 1 hour by default. A JWT-carried role or status is therefore stale by up to an hour,
which fails FR-006 and FR-009.

Options compared:

| Approach | In JWT? | Role/status change takes effect | Verdict |
|---|---|---|---|
| `app_metadata` | Yes | Next token issuance (≤1h) | Fails FR-009 |
| Custom Access Token Hook + `user_roles` table | Yes | Next token issuance (≤1h) | Supabase's documented RBAC recommendation, but still ≤1h stale |
| Application table read in the DAL | No | **Immediately** | **Chosen** |
| `user_metadata` | Yes | — | Never — user-editable, unsafe for authorization |

**Cost**: one database read per guarded request. This is **not a regression** — `currentUser()` in
`lib/auth/guards.ts` already does exactly this today.

**Additional mitigation**: shorten the access-token lifetime from the 1-hour default (docs
recommend a shorter expiry precisely because access tokens cannot be revoked). 15 minutes is a
reasonable target; below 5 minutes is discouraged.

**Deferred**: a Custom Access Token Hook becomes worthwhile only if RLS policies later need the role
in-JWT. Not needed for this migration (see D8).

---

## D6 — Identity key strategy *(the decision deferred from the spec)*

**Decision**: adopt Supabase's documented pattern — the application user table's primary key **is**
the `auth.users` UUID — **with a deliberate divergence on audit retention**.

Concretely:

1. Rename `users` → `profiles`. This matches the documented pattern and, for free, sidesteps a
   community-reported `search_path` collision where the auth service resolves `users` to
   `public.users` and fails with "Database error finding user". Reports concentrate on
   local/self-hosted rather than hosted, and Supabase has neither confirmed nor denied it — renaming
   costs nothing and removes the question.
2. `profiles.id uuid primary key references auth.users(id) on delete cascade`.
3. **`audit_log.actor_id` gets `on delete set null`, plus a denormalized `actor_email` snapshot.**

**Rationale for the divergence**: Supabase's documented `on delete cascade` guidance is written for
a profiles table, not an audit trail. Applied blindly, deleting a user would cascade through the FK
graph and **erase their audit history** — directly violating FR-019 and destroying the property the
handover document names as a core security control ("RBAC + audit on every change"). No Supabase
documentation addresses audit-table retention under cascade; this is our call, made explicitly.

**Rejected alternative** — keep the local UUID PK and add a `supabase_user_id` reference column:

| | PK = auth.users.id | Local PK + reference column |
|---|---|---|
| Existing FKs (`audit_log.actor_id`, authorship) | Must be re-keyed via a mapping table | Unchanged |
| Ongoing correctness | Single source of truth; orphans impossible | Two IDs to keep in sync forever |
| Future RLS | `auth.uid() = id` is trivial | Requires a subquery join |
| Migration effort | Higher (one-time remap) | Lower |

The reference-column option is cheaper *once* and worse *forever*. **And with the database created
from scratch (D12), the one-time cost is zero** — the schema is born with the right keys, so there
is no remap at all. This is exactly the condition under which the better long-term shape should be
chosen without hesitation.

**Drizzle support**: first-class. `drizzle-orm/supabase` exports `authUsers` declared as an
*existing* table, so drizzle-kit references it without attempting to create the `auth` schema.

---

## D7 — Database driver and pooling

**Decision**: `postgres.js` via `drizzle-orm/postgres-js`, `{ prepare: false }`, Supavisor
transaction mode on **port 6543**.

**Rationale**: both Supabase's Drizzle guide and Drizzle's Supabase page document `postgres.js` and
nothing else. Transaction mode is required for serverless and **breaks prepared statements**, hence
`prepare: false`. Direct connection (5432) is IPv6-by-default, which is the practical reason
serverless needs the pooler beyond connection count. Migrations and `pg_dump` use the **direct**
connection, not 6543.

**Correction to an earlier assumption**: this project uses the Neon **WebSocket** driver
(`drizzle-orm/neon-serverless` + `Pool`), not the HTTP one. That driver already has real transaction
support, so the swap is behaviourally close — `neon-http` would have been a harder migration.

**Unresolved tension** (risk R7): Vercel's current Fluid Compute guidance is a global-scope pool
plus `attachDatabasePool()` from `@vercel/functions`, and its examples use `pg`, not `postgres.js`.
Meanwhile Supabase's own template comments say *"With Fluid compute, don't put this client in a
global variable."* These two pieces of guidance point in opposite directions. If the documented
Fluid path matters more than vendor alignment, `pg` + `drizzle-orm/node-postgres` is the safer
choice (with `pg`, avoiding prepared statements just means not naming queries — Drizzle's default).

---

## D8 — Enforcing mandatory MFA for administrators

**Decision**: application-level enforcement in the DAL, using the `aal` claim. No RLS in this
migration.

**Rationale**: Supabase's documented MFA-enforcement patterns are RLS policies, but **this project
uses no RLS at all** — Drizzle queries run as a single role and every check is a server-side guard.
Adopting RLS is a separate project of its own, and doing it halfway would be worse than not at all.
The documented application-level route (verify JWT, compare `aal`) is first-class and fits the
existing architecture.

**Important gap**: Supabase's documented RLS template keys on *"has a verified factor"*, **not on
role**. There is no first-party pattern for requiring MFA of a *subset* of users. Composing
"is admin" with "has satisfied aal2" is our own extension either way — so the RLS route would not
have saved work here.

**Consequence**: the DAL is the only line of defense. That is already true today, so it is not a
regression — but it does mean SC-002/SC-002a negative testing carries the full weight.

### The bootstrap state (FR-029), resolved

`getAuthenticatorAssuranceLevel()` returns `currentLevel` and `nextLevel`, and the pair distinguishes
the two cases cleanly:

| currentLevel | nextLevel | Meaning | Guard behaviour |
|---|---|---|---|
| `aal1` | `aal1` | **No factor enrolled** | Bootstrap: allow enrolment screen only |
| `aal1` | `aal2` | Factor enrolled, not satisfied this session | Show challenge screen |
| `aal2` | `aal2` | Factor satisfied | Normal access |
| `aal2` | `aal1` | Factor was removed (stale JWT) | Force refresh |

`currentLevel` may also be `null`, equivalent to `aal1`. The `aal` claim is present in the JWT
itself; JWTs without it default to `aal1`.

This is exactly the distinction FR-030 requires — an account property, not a time-boxed exception.

**No documented primitive exists** for "block everything except the enrolment route". That routing
is entirely ours.

---

## D9 — MFA enrolment and the QR code

**Decision**: `supabase.auth.mfa.enroll({ factorType: 'totp' })`, render `totp.qr_code` directly.

The call returns all three of `totp.qr_code` (an **SVG**, to be wrapped as a data URL for an
`<img>`), `totp.secret` (manual-entry fallback), and `totp.uri`. This satisfies FR-003 natively.

**Consequence**: the `qrcode` and `@types/qrcode` dependencies — installed but never imported — are
removed rather than finally used. `otplib` goes too.

**Abandoned enrolment (US1 scenario 3)**: `enroll()` creates an **unverified** factor immediately.
The lifecycle of unverified factors is **undocumented** — no stated expiry, garbage collection, or
dedup — and there is a documented cap of 10 factors per user. Abandoned enrolments therefore
plausibly accumulate toward that cap.

**Mitigation**: call `listFactors()` and `unenroll()` any pre-existing unverified factor before
enrolling a new one.

**Verified empirically 2026-07-18**: calling the enrolment endpoint twice in a row leaves exactly
one factor on the account, and a distinct `factorId` each time — confirming both that stale factors
would otherwise persist and that the unenroll-first mitigation works. Risk R5 closed.

### Two undocumented behaviours, settled by running it

The documentation was wrong or silent on both of these, and both were caught only by exercising the
real endpoint:

1. **`totp.qr_code` is already a `data:image/svg+xml;utf-8,...` URI**, not raw SVG. The TOTP guide
   describes it as SVG and shows converting it to a data URL — following that literally
   double-encodes the value and renders a broken image, which fails silently and only surfaces when
   a person tries to scan it. Handle both forms.
2. **The `issuer` parameter on `enroll()` works**, and matters. Without it the issuer is derived
   from the project's Site URL, so authenticator apps list the account as `localhost:3000` —
   meaningless to the user and liable to collide across environments. Passing
   `issuer: "Corporate DNA CMS"` produces
   `otpauth://totp/Corporate%20DNA%20CMS:user@example.com?...&issuer=Corporate%20DNA%20CMS`.

---

## D10 — Transactional email

**Decision**: configure custom SMTP pointing at Resend before any recovery flow ships.

**Rationale**: Supabase's built-in sender is capped at **2 emails per hour, project-wide**, and the
docs call it "best-effort only… non-production". Custom SMTP raises this to 30/hour (configurable).
Resend is an explicitly supported provider and is **already a dependency of this project**.

**Limitation**: this routes Supabase's own templates through Resend's SMTP relay. It does not send
via the Resend API or React Email templates — that would require an auth send-email hook. Templates
remain Supabase's, customizable in the dashboard.

---

## D11 — Backup, restore and rollback

**Decision**: keep the Neon project alive and writable across the rollback window; treat
`DATABASE_URL` as a swappable Vercel environment variable so reverting is an env change plus a
redeploy, not a data restore. Schedule `supabase db dump` from day one.

**Rationale**: this is the weakest part of the move and it must be stated plainly.

| | Neon (today) | Supabase Free | Supabase Pro |
|---|---|---|---|
| Automated backups | Yes | **None** | 7 days |
| PITR | Yes (branch-based) | **No** | Paid add-on |

Supabase's free tier has **no automatic backups at all**; the documented answer is to export
regularly yourself and keep off-site copies. PITR is a paid add-on that additionally requires at
least a Small compute add-on. Supabase preview branches are **not** a Neon-branching equivalent —
they start with no production data by design, and require Pro.

**Point of no return — eliminated** *(revised 2026-07-18)*: since nothing is transferred and Neon is
left untouched, there is no write-freeze window and no irreversible step. Rollback is repointing
`DATABASE_URL` and redeploying, at any time, with nothing to restore.

The one condition that would undo this: decommissioning the Neon project during the rollback window.
FR-023 exists to prevent exactly that.

**This still materially affects FR-027**, just not the cutover. The replacement runbook is
meaningfully weaker than the one it retires unless the project moves to Pro. Today that costs
nothing because there is nothing to lose — but it becomes the operating reality the moment the CMS
holds content anyone would miss. It is a cost decision, not a technical one, and deferring it is
fine only as long as the deferral is deliberate.

---

## D12 — Database provisioning *(revised 2026-07-18 — no data transfer)*

**Decision**: create the schema fresh on Supabase from the Drizzle definitions. **No `pg_dump`, no
data transfer, no identity remapping.**

**Rationale**: the requester confirmed the existing database holds no content worth keeping —
development had only just begun. This removes the highest-risk portion of the plan outright.

Superseded by this decision:

| Was | Now |
|---|---|
| `pg_dump` → `psql` per Supabase's Neon guide | `drizzle-kit migrate` against the new database |
| Mapping table + `UPDATE` across five FK columns | Nothing — the schema is born with the right keys |
| Row-count and orphan verification | Exercise each collection once through the application |
| A point of no return at first write | None — Neon is untouched, so rollback stays open |

**What still applies from the original research**: `gen_random_uuid()` is built into Postgres 13+
with no extension needed; custom enums (`role`, `user_status`) have no Supabase-specific
restriction; and RLS status and roles are not carried by any mechanism — irrelevant here, since
nothing is carried at all.

**Retained as a contingency**: if this decision is ever reversed, the documented path is a
single-file `pg_dump --clean --if-exists --quote-all-identifiers --no-owner --no-privileges` from
the **unpooled** Neon string into `psql`, with `--no-owner --no-privileges` applied at *dump* time.
There is no migration wizard. All primary keys are UUIDs with `defaultRandom()`, so there would be
no sequences to resync.

**Orphaned media**: media binaries live with Bunny.net; only metadata rows are discarded. Those
files persist in storage with nothing referencing them. FR-028a exists so the volume is measured
rather than discovered later as an unexplained bill.

**drizzle-kit configuration** for Supabase:

```ts
export default defineConfig({
  dialect: 'postgresql',
  schemaFilter: ['public'],                          // never introspect `auth`
  entities: { roles: { provider: 'supabase' } },     // ignore Supabase's built-in roles
  dbCredentials: { url: process.env.DIRECT_URL! },  // direct, not 6543
});
```

Known friction: `drizzle-kit pull` against the `auth` schema is broken (emits uncompilable
TypeScript); avoid it by using `authUsers` from `drizzle-orm/supabase` instead. Generated migrations
may contain `CREATE SCHEMA "auth"`, which will fail — review and strip. Leave the migrations table
on its default `drizzle` schema.

---

## Open Risks

| ID | Risk | Impact | Disposition |
|---|---|---|---|
| **R1** | MFA challenge/verify is rate-limited to **15 requests/hour per IP address**, not per user, and is **not configurable** | Users behind one office NAT share the budget; a few mistyped codes can lock out everyone | Design constraint. Surface remaining attempts in the UI; document the failure mode. No technical fix exists |
| **R2** | Supabase free tier has no backups and no PITR | DR posture regresses versus Neon | **No longer blocks cutover** (nothing to lose yet). Becomes real the moment content exists — decide before the CMS carries anything anyone would miss: accept scheduled dumps, or budget Pro + PITR |
| **R3** | Access tokens cannot be revoked before expiry | FR-006/FR-009 unsatisfiable by Supabase alone | Mitigated by D5 (DB status check per request) + shortened token lifetime |
| ~~**R4**~~ | ~~Signing key mode unknown~~ | — | **CLOSED 2026-07-18 — asymmetric confirmed.** JWKS returns a single `ES256` key (`kty: EC`, P-256). `getClaims()` is network-free; D2 holds as written |
| ~~**R5**~~ | ~~Unverified-factor lifecycle~~ | — | **CLOSED 2026-07-18.** Verified against the live project: enrolling twice leaves exactly one factor. The unenroll-first mitigation works |
| **R6** | `drizzle-kit pull` bug against the `auth` schema; fix status in 0.45 unknown | Broken introspection | Avoided by design (`schemaFilter: ['public']` + `authUsers`) |
| **R7** | `attachDatabasePool()` compatibility with `postgres.js` unverified; Vercel and Supabase guidance conflict on global-scope clients | Connection exhaustion under Fluid Compute | Test under load; fall back to `pg` + `node-postgres` if needed |
| **R8** | ~~Deploy gate~~ | — | **RESOLVED 2026-07-18.** Initially recorded as "current identity does not match" — that was wrong. HEAD and all prior commits were already authored `impulseaisolutions@gmail.com`; the gate was passing. Only the repo's `user.email` config diverged, which would have broken the *next* commit. Repo-local identity now set to match |
| **R9** | `signOut()` defaults to `scope: 'global'` — signs out every device | Surprising UX regression versus today's per-session logout | Pass `{ scope: 'local' }` explicitly |
| **R10** | Uncommitted working-tree changes across auth, UI and config | Complicates rollback and review | Resolve before implementation begins |

---

## Requirements affected by research

Two spec requirements need amendment in light of the above:

- **FR-009** ("MUST invalidate sessions when an account is disabled or has its factor reset") is
  **not achievable as absolutely stated**. Factor reset *does* invalidate immediately —
  `admin.mfa.deleteFactor()` logs the user out of all sessions when the factor was verified. But
  disabling an account cannot revoke a live access token. With D5's per-request status check the
  *practical* effect is immediate, because the guard rejects the request regardless of token
  validity. The requirement should be restated in terms of observable behaviour ("a disabled
  account is refused on its next request") rather than token invalidation.
- **FR-007** (throttling) should acknowledge that MFA throttling is imposed by the platform at
  15/hour/IP and is neither ours to tune nor ours to bypass (R1).
