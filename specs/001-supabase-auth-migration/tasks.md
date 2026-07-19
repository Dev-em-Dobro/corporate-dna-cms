---

description: "Task list for Supabase Auth Migration"
---

# Tasks: Supabase Auth Migration

**Input**: Design documents from `specs/001-supabase-auth-migration/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: **Included and non-negotiable.** SC-002 and SC-002a are stated as negative-testing
criteria, and `quickstart.md` records that no authentication tests exist today. The negative tests
are the highest-value output of this migration, not an optional extra.

**Organization**: Tasks are grouped by user story. **User Story 3 is withdrawn** (the database is
created from scratch) — there is no phase for it, and the numbering of the remaining stories is
preserved so cross-references stay valid.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to
- Exact file paths are given in every task

---

## Phase 1: Setup

**Purpose**: Resolve the unknowns that change the approach, then get dependencies in place.

**⚠️ T001–T006 are gates.** Each is a research finding that alters design if it comes back the wrong
way. Do not begin Phase 2 with any of them unresolved.

- [x] T001 ~~Confirm asymmetric signing keys~~ **DONE 2026-07-18 — confirmed asymmetric.** The project's JWKS endpoint returns a single `ES256` key (`kty: EC`, curve P-256). `getClaims()` therefore verifies JWTs against the cached JWKS with **zero network round-trips**, and the guard design in research D2 holds as written. The only per-request cost is the `profiles` read, which the codebase already pays today. Risk R4 closed
- [ ] T002 [P] Configure custom SMTP to Resend in Dashboard → Auth → SMTP. The built-in sender is capped at **2 emails/hour project-wide**, which makes US5 and the invitation flow untestable
- [ ] T003 [P] Shorten the access-token lifetime from the 1-hour default to 15 minutes in Dashboard → Auth → Sessions. Bounds the window in which a banned account can still refresh (research D5/R3)
- [ ] T004 [P] Record the Supabase plan tier and PITR status in `research.md` risk R2. Does not block cutover with an empty database, but must be a dated decision rather than an omission
- [x] T005 [P] ~~Resolve the deploy gate~~ **DONE 2026-07-18.** The gate was never failing: HEAD and both prior commits are authored `impulseaisolutions@gmail.com`. What did not match was the repo's `user.email` config (`roberto.rhd@gmail.com`), so the *next* commit would have broken it. Fixed by setting repo-local `user.name`/`user.email` to the Impulse identity, matching existing history
- [x] T006 ~~Commit or revert the uncommitted working-tree changes~~ **DONE 2026-07-18.** Typecheck passed clean, so the work was checkpointed rather than discarded, in two commits by authorship: `65c4d88` (pre-existing admin UI overhaul + `components/ui` primitives) and `685341f` (Spec Kit tooling + this feature's design record). Working tree is clean
- [x] T007 ~~Create the Supabase project and capture both connection strings~~ **DONE 2026-07-18.** Project exists; `DATABASE_URL` on Supavisor transaction mode (6543) and `DIRECT_URL` on 5432 are both set. Note `DIRECT_URL` targets the **pooler in session mode** (`...pooler.supabase.com:5432`), not the true direct host (`db.<ref>.supabase.co:5432`). This is deliberate and probably necessary — the true direct connection is IPv6-only without the paid IPv4 add-on, whereas session mode is IPv4 on all tiers and still supports prepared statements, so drizzle-kit migrations work through it. Revisit only if migrations behave oddly
- [x] T008 Install dependencies in `package.json`: add `@supabase/supabase-js`, `@supabase/ssr`, `postgres`
- [x] T009 Remove dead and superseded dependencies from `package.json`: `otplib`, `qrcode`, `@types/qrcode`, `@node-rs/argon2`, `@neondatabase/serverless`, and `next-auth` (the last is already dead — declared but imported nowhere)
- [x] T010 [P] ~~Update `.env.example`~~ **DONE 2026-07-19.** Supabase vars present, `AUTH_SECRET` and `CMS_DISABLE_MFA` removed, rollback-window note added in the preview-token comment

**Checkpoint**: unknowns resolved, dependencies aligned, clean tree.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Supabase clients, the database swap, the fresh schema, and the guard rewrite. Every
user story depends on all of it.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

### Supabase clients

- [x] T011 [P] Create `lib/supabase/client.ts` exporting `createBrowserClient` per the `vercel/next.js` `examples/with-supabase` template
- [x] T012 [P] Create `lib/supabase/server.ts` exporting an **async** `createClient()` that awaits `cookies()` and uses the `getAll`/`setAll` cookie adapter. The `setAll` call must be wrapped in try/catch for Server Component contexts. Do not store the client in a module-level variable — Fluid Compute reuses instances
- [x] T013 [P] Create `lib/supabase/admin.ts` exporting a `service_role` client marked `server-only`. This key must never reach the browser
- [x] T014 Create `lib/supabase/proxy.ts` exporting `updateSession(request)` per the template. **Do not place any code between `createServerClient` and `getClaims()`** — doing so causes intermittent random sign-outs that are very hard to debug
- [x] T015 Create root `proxy.ts` (Next.js 16 convention — **not** `middleware.ts`) delegating to `updateSession`, with a matcher excluding `_next/static`, `_next/image`, `favicon.ico` and image extensions

### Database

- [x] T016 Rewrite `db/index.ts` from `drizzle-orm/neon-serverless` to `drizzle-orm/postgres-js`, using `postgres(DATABASE_URL, { prepare: false })`. `prepare: false` is mandatory — Supavisor transaction mode breaks prepared statements
- [x] T017 Update `drizzle.config.ts`: set `schemaFilter: ['public']`, `entities: { roles: { provider: 'supabase' } }`, and point `dbCredentials.url` at `DIRECT_URL` (not the pooled 6543 string)
- [x] T018 Rename `db/schema/users.ts` to `db/schema/profiles.ts`. Set `id` as `uuid` primary key referencing `authUsers.id` from `drizzle-orm/supabase` with `onDelete: 'cascade'`; drop `passwordHash`, `totpSecret` and `mfaEnabled`; keep `email`, `role`, `status`, `lastLoginAt`, `createdAt`, `updatedAt`. Renaming away from `users` also sidesteps a reported `search_path` collision with `auth.users`
- [x] T019 Add `actorEmail` (`text`, nullable) to `db/schema/audit.ts`, and set `actorId` to `onDelete: 'set null'`. **This deliberately diverges from Supabase's documented blanket cascade**, which would erase audit history on user deletion (FR-019)
- [x] T020 [P] Set `onDelete: 'set null'` on `createdBy` and `updatedBy` in `db/schema/content.ts` (`contentEntries`) and on `authorId` (`contentVersions`). Content must outlive its author
- [x] T021 [P] Set `onDelete: 'set null'` on `uploadedBy` in `db/schema/media.ts`
- [x] T022 Update `db/schema/index.ts` exports for the `users` → `profiles` rename
- [x] T023 Generate and apply the fresh schema: `npm run db:generate` then `npm run db:migrate` against `DIRECT_URL`. Review the generated SQL and **strip any `CREATE SCHEMA "auth"` statement** — that schema is Supabase-owned and the statement will fail

### Guards — the enforcement point

- [x] T024 Rewrite `lib/auth/guards.ts` internals over `getClaims()` in a `server-only` module wrapped in React `cache()`. Preserve the exported signatures of `requireSession`, `requireAdmin` and `currentUser` so the 13 admin route call sites need no changes. Read `role` and `status` from `profiles` on every call — **never** from a JWT claim, because access tokens cannot be revoked before expiry. `getSession()` must not appear anywhere in server code
- [x] T025 Gut `lib/auth/session.ts` down to `createPreviewToken` / `verifyPreviewToken` only, and delete `lib/auth/totp.ts` and `lib/auth/password.ts`. Preview tokens keep using `PREVIEW_TOKEN_SECRET` and stay out of scope

**Checkpoint**: the app boots, the database is reachable, and guards resolve identity. User stories can now begin.

---

## Phase 3: User Story 1 - Enrol a second factor by scanning a code (Priority: P1) 🎯 MVP

**Goal**: A user reaches enrolment, scans a code, and ends up with a working second factor.

**Independent Test**: Trigger enrolment for a test account, scan the code with a standard
authenticator app, confirm the generated code is accepted.

**Why MVP**: every user must enrol before anything else works, and this closes the original QR gap
that started this whole effort.

### Tests for User Story 1 ⚠️

> Write these first and confirm they fail before implementing.

- [x] T026 [P] [US1] Integration test in `tests/integration/auth-enrolment.test.ts` — **note 2026-07-19: was checked with no file on disk; the test now actually exists and passes.** Enrolment returns QR + manual-entry secret; after verification the enrol endpoint 403s and a fresh sign-in routes to the challenge with no secret in the body
- [x] T027 [P] [US1] **DONE 2026-07-19, passing.** Five enrolment starts leave exactly one unverified factor (the latest), verified server-side via the admin API
- [x] T028 [P] [US1] **DONE 2026-07-19, passing.** Bootstrap (admin-role account, no factor) reaches enrolment; all guarded handlers return 403 (SC-002a)

### Implementation for User Story 1

- [x] T029 [US1] Add `requireEnrolmentBootstrap()` to `lib/auth/guards.ts`: succeeds only for an authenticated session with **no verified factor**, fails once one exists. Keep it a separate named export rather than a branch inside `requireSession` — this is the one place a password-only session is allowed through, and it should be greppable and individually testable
- [x] T030 [US1] Implement `POST /api/auth/mfa/enrol` in `app/api/auth/mfa/enrol/route.ts`: guard with `requireEnrolmentBootstrap`, call `listFactors()` and `unenroll()` any pre-existing **unverified** factor, then `mfa.enroll({ factorType: 'totp' })`. Return `qrCodeSvg`, `secret`, `uri`, `factorId`. The unenroll step is what makes T027 pass
- [x] T031 [US1] Implement `POST /api/auth/mfa/enrol/confirm` in `app/api/auth/mfa/enrol/confirm/route.ts` calling `mfa.challengeAndVerify`. On success the session becomes `aal2` and Supabase signs out all other sessions — expected, not a bug
- [x] T032 [US1] Create the enrolment screen at `app/auth/enrol/page.tsx`: render `qrCodeSvg` as a data URL in an `<img>`, show the secret as manual-entry fallback (FR-003), and accept the confirmation code
- [x] T033 [US1] Route the bootstrap state from `app/(admin)/layout.tsx` to `/auth/enrol`, and refuse every other admin surface from that state
- [x] T034 [US1] Add `auth.mfa_enrolled`, `auth.bootstrap_enter` and `auth.bootstrap_exit` audit actions through `lib/audit/log.ts` (FR-031)
- [x] T035 [US1] Add `actorEmail` capture to `writeAudit()` in `lib/audit/log.ts` so audit rows stay human-readable after the referenced profile is deleted
- [x] T036 [US1] Rewrite `scripts/seed-admin.ts` over `auth.admin.createUser()`. It can no longer generate a TOTP secret — Supabase has no API to enrol a factor on another user's behalf. The seeded admin lands in the bootstrap state and enrols on first sign-in (FR-022)
- [x] T037 [US1] Surface the platform rate limit in the enrolment UI: MFA challenge/verify is capped at **15/hour per IP address**, shared by everyone behind the same egress IP and not configurable. A generic "try again later" is actively misleading here

**Checkpoint**: a user can enrol a factor by scanning. US1 is independently demonstrable.

---

## Phase 4: User Story 2 - Sign in with password and mandatory second factor (Priority: P1)

**Goal**: Sign-in works end to end, and no administrative surface is reachable without a satisfied
second factor.

**Independent Test**: complete the full sign-in flow with a migrated test account; attempt an admin
route with only the password step satisfied and confirm refusal.

### Tests for User Story 2 ⚠️

- [x] T038 [P] [US2] **DONE 2026-07-19, passing.** Password yields a challenge (guarded probe 403 at aal1); wrong code 401 + `auth.mfa_fail` audited; correct code grants access, stamps `lastLoginAt`, audits `auth.login`
- [x] T039 [US2] **DONE 2026-07-19, passing.** Sweep covers the 13 admin route files (19 handlers, count-asserted so new routes can't dodge it) plus the guarded media handlers, called directly: 403 for (a) aal1-only, (b) bootstrap, (c) disabled-mid-session, (d) editor at aal2 on every admin-only route — with a positive probe proving (d)'s session is real. SC-002/SC-002a now have evidence
- [x] T040 [P] [US2] **DONE 2026-07-19, passing.** Same still-valid token flips 200 → 403 across a single `disableUser` call
- [x] T041 [P] [US2] **DONE 2026-07-19, passing.** Two cookie jars as two devices; local sign-out kills A (401) and leaves B signed in (200)

### Implementation for User Story 2

- [x] T042 [US2] Rewrite `app/api/auth/login/route.ts`: sign in with password, then return `next: 'mfa' | 'enrol' | 'done'` derived from the `currentLevel`/`nextLevel` pair. **Remove `challengeId`** — the custom 5-minute challenge JWT is retired. Refuse disabled accounts indistinguishably from bad credentials (FR-006)
- [x] T043 [US2] Rewrite `app/api/auth/mfa/route.ts` to accept `{ code }` only, resolving the pending challenge from the `aal1` session. Map Supabase's 429 to a message that names the per-IP limit rather than a generic retry hint
- [x] T044 [US2] Rewrite `app/api/auth/logout/route.ts` to call `signOut({ scope: 'local' })` **explicitly**. Supabase defaults to `global`, which would sign the user out of every device — a silent regression
- [x] T045 [US2] Update `app/login/page.tsx` to branch on `next` instead of on the presence of a `challengeId`, routing to the challenge or to enrolment
- [x] T046 [US2] Enforce the assurance level in `requireSession` / `requireAdmin` in `lib/auth/guards.ts`, throwing `AuthError(403)` carrying `next` so callers can redirect to challenge or enrolment rather than dead-ending. Supabase's guidance is to redirect to re-authentication, not to reject outright
- [x] T047 [US2] Update `app/(admin)/layout.tsx` from `readSession` to the guard DAL
- [x] T048 [US2] Audit `auth.login`, `auth.mfa_fail` and `auth.logout` through `lib/audit/log.ts`, and write `lastLoginAt` on full-assurance sign-in
- [x] T049 [US2] **DONE 2026-07-19.** Swept: the codebase contains **zero Server Actions** (`"use server"` appears nowhere in app/, components/, lib/). All 23 route handlers accounted for: 13 admin files + media (guarded, and enforced by the T039 sweep table), auth routes (public or bootstrap-guarded by design), content read API (published-only + `READ_API_KEY` by design)
- [x] T050 [US2] **DONE 2026-07-19.** Turned out already-rewritten: the four suites authenticate via `tests/helpers/db.ts` over `auth.admin.createUser`, no retired-session usage remained. All four run green against the new stack (vitest now loads `.env.local` the way `next dev` does, so they no longer silently skip)

**Checkpoint**: sign-in and enforcement both work. Combined with US1, the system is usable.

---

## Phase 5: User Story 4 - Manage users without engineering help (Priority: P2)

**Goal**: Invite, role change, disable, and MFA reset all work from the admin UI.

**Independent Test**: perform each lifecycle action against test accounts and confirm the affected
user's access changes on their next request.

### Tests for User Story 4 ⚠️

- [x] T051 [P] [US4] **DONE 2026-07-19, passing.** Invite → `invited` profile, and NO password signs the account in; role change flips a live session's admin access on its very next request; disable refuses immediately. Caveat: the invite case sends a real email (hosted Supabase rejects `example.com`, so it targets a disposable inbox) and self-skips on the built-in sender's 2/hour cap — deterministic once T002 lands
- [x] T052 [P] [US4] **DONE 2026-07-19, passing — with an empirical correction.** The platform does NOT terminate sessions on `admin.mfa.deleteFactor` (contra T055's research): the session survives but its next refresh downgrades it to aal1, where the guard 403s. Asserted: factors gone, refreshed session demoted + refused, fresh sign-in lands in bootstrap. Residual access-token window bounded by T003's 15-minute lifetime. `resetMfa` docstring corrected to match
- [x] T053 [P] [US4] **DONE 2026-07-19, passing.** All three paths refused (`ConflictError`) with the target left intact. The test temporarily parks other active admins to make the scenario real and restores them in `finally` — one reason integration files now run sequentially

### Implementation for User Story 4

- [x] T054 [US4] Rewrite `createUser` in `lib/users/service.ts` as an invitation over `auth.admin.inviteUserByEmail()`. **Remove the `password` parameter entirely** — administrators must never set another user's password (FR-014). Create the `profiles` row with `status: 'invited'`, making that status real for the first time
- [x] T055 [US4] Add `resetMfa(userId)` to `lib/users/service.ts` over `auth.admin.mfa.deleteFactor()`, which terminates all the user's sessions when the factor was verified. Verify the exact argument shape against the installed `@supabase/supabase-js` typings — the reference page for this method 404s and the signature is corroborated only indirectly
- [x] T056 [US4] Add `disableUser(userId)` to `lib/users/service.ts` as the **single choke-point** that sets `profiles.status = 'disabled'` **and** applies a Supabase ban together. Neither alone is sufficient: the ban stops token refresh, the status is what the guard enforces per request
- [x] T057 [US4] Update `updateUser` in `lib/users/service.ts` to drop the auto-TOTP-enrolment-on-promotion branch. Promoting someone to administrator now leaves them in the bootstrap state to enrol for themselves — there is no API to enrol a factor on another user's behalf
- [x] T058 [US4] Extend the last-admin safeguard in `lib/users/service.ts` to cover deletion and Supabase-side bans, not only role and status changes (FR-012)
- [x] T059 [US4] Update `app/api/admin/users/route.ts` and `app/api/admin/users/[id]/route.ts` for the new service surface: no `password` in, no `totpUri`/`totpSecret` out
- [x] T060 [US4] Rewrite the enrolment panel in `components/UsersManager.tsx`. The "share this securely" `otpauth://` block is removed entirely — administrators no longer receive a secret to hand over. Replace with invitation status and an MFA-reset action
- [x] T061 [US4] Audit `user.invited`, `user.mfa_reset`, `user.disabled` and `user.role_changed` through `lib/audit/log.ts`
- [x] T062 [US4] **DONE 2026-07-19.** `GET /auth/confirm` in `app/auth/confirm/route.ts` over `verifyOtp({ type, token_hash })`; invite/recovery default to `/auth/update-password`, `next` honoured for relative paths only (no open redirect), failures land on `/login?error=invalid-link`

**Checkpoint**: the full user lifecycle works without engineering involvement.

---

## Phase 6: User Story 5 - Self-service account recovery (Priority: P2)

**Goal**: A user recovers a forgotten password alone. This is the maintenance burden the whole
migration exists to remove.

**Independent Test**: complete a full password recovery on a test account from the sign-in screen,
with no administrator or developer action.

### Tests for User Story 5 ⚠️

- [x] T063 [P] [US5] **DONE 2026-07-19, passing.** Registered/unregistered → byte-identical 200s; a recovery link (minted via `generateLink`, no SMTP dependency) works once and is refused on reuse; malformed tokens refused. True expiry is untestable without the clock — it exits through the same `verifyOtp` rejection asserted here
- [x] T064 [P] [US5] **DONE 2026-07-19, passing.** Recovery link → aal1 session; password change refused 403 `next:"mfa"`; after the challenge it succeeds; the new password still lands on the challenge at next sign-in. Enforced in our route (verified factors + aal1 → refuse), not delegated to a GoTrue project setting

### Implementation for User Story 5

- [x] T065 [US5] **DONE 2026-07-19.** Always-200 with identical body; the send itself is deferred past the response (`after()`, with a fire-and-forget fallback outside a request scope) so timing does not vary with address existence either; errors swallowed to kill the enumeration channel; per-IP rate limit on the endpoint
- [x] T066 [US5] **DONE 2026-07-19.** Over `updateUser`, passing `current_password` through when supplied; additionally refuses at aal1 when a verified factor exists (`next:"mfa"`) so recovery can never sidestep MFA regardless of GoTrue settings
- [x] T067 [P] [US5] **DONE 2026-07-19.** `app/auth/recover/page.tsx` + `RecoverForm` — same success message whether or not the address exists
- [x] T068 [P] [US5] **DONE 2026-07-19.** `app/auth/update-password/page.tsx` + form with an inline MFA-challenge phase for the 403 `next:"mfa"` case, so recovery stays on one screen
- [x] T069 [US5] **DONE 2026-07-19.** "Forgot your password?" link on the password step of `LoginForm`
- [x] T070 [US5] **DONE 2026-07-19.** `auth.password_reset_requested` (in the deferred send) and `auth.password_changed` both write through `writeAudit`

**Checkpoint**: account recovery requires zero engineering time (SC-006).

---

## Phase 7: User Story 6 - Cutover and rollback (Priority: P3)

**Goal**: Move production to the new database and prove the way back works.

**Independent Test**: exercise every collection on the new database, then roll back and forward again.

**Note**: with nothing transferred and Neon untouched, this phase is far smaller than originally
planned. There is no migration script, no write-freeze window and no point of no return.

- [ ] T071 [US6] Exercise all seven collections end-to-end through the application on the new database — create a case study, edit it to produce a version, publish it, upload a media asset, register a webhook — and confirm every relationship resolves (FR-024, SC-004). **Script ready 2026-07-19**: `npx tsx scripts/verify-cutover.ts --yes` — covers all seven tables (profile, media via real Bunny upload, entry, versions incl. restore, facets, inactive webhook, audit), prints PASS/FAIL per check, self-cleans (audit rows deliberately kept), and refuses to run without `--yes` after printing the target DB. Consumes no MFA/SMTP quota. Awaiting a run against the intended target
- [ ] T072 [US6] Verify the FK deletion rules behave as designed: delete a throwaway user via `auth.admin` and confirm `audit_log` rows **survive** with `actorId` nulled and `actorEmail` populated, and that content, versions and media survive their author's deletion. This is the assertion Supabase's documented default would get wrong. **Covered by the same `scripts/verify-cutover.ts` run** — it deletes the throwaway author and asserts: profile cascades away, audit survives anonymised-but-readable, entry/versions/media survive with author refs nulled
- [ ] T073 [US6] Rehearse rollback on staging: repoint `DATABASE_URL` and `DIRECT_URL` at Neon, redeploy, confirm the previous system returns intact, then repoint forward (SC-008)
- [ ] T074 [US6] Perform cutover: swap the environment variables and redeploy. Keep `AUTH_SECRET` in the environment until the rollback window closes — rolling back restores the old auth stack, which needs it
- [ ] T075 [US6] **Do not decommission the Neon project.** Keep it alive and readable for the full rollback window (FR-023). This is the single action that would convert a reversible cutover into an irreversible one
- [x] T076 [US6] **DONE 2026-07-19.** Backup & recovery rewritten: free-tier no-backups reality stated with the `pg_dump`/`pg_restore` procedure over `DIRECT_URL` (and the `auth`-schema caveat), Pro-tier verify-don't-assume note, and the Neon rollback path + AUTH_SECRET retention. Final tier statement still hinges on T004 recording the actual tier
- [x] T077 [US6] **DONE 2026-07-19.** Architecture/Auth/env/setup sections rewritten: Supabase Postgres via Supavisor + `DIRECT_URL`, Supabase Auth over `getClaims()`, invitation flow, bootstrap-state seeding, env var list updated (jose/argon2/otplib description gone)
- [ ] T078 [US6] Inventory media files in Bunny.net with no corresponding `media_assets` row and record the count and storage volume (FR-028a). Discarding the old metadata leaves these orphaned

**Checkpoint**: production runs on the new stack with a proven way back.

---

## Phase 8: Polish & Cross-Cutting Concerns

- [x] T079 [P] **DONE 2026-07-19.** Editor guide covers MFA-for-everyone, invitation-based first sign-in with enrolment, self-service recovery, lost-authenticator reset, the shared 15/h rate limit, and the last-admin refusal
- [x] T080 [P] **DONE 2026-07-19, passing.** `assuranceFromClaims` extracted as a pure export from `lib/auth/guards.ts`; unit test covers all four level combinations, null/undefined current level, unknown-value fail-closed, and the stale-JWT aal2/aal1 case (asserted "satisfied" BY DESIGN, with the reasoning in the test)
- [x] T081 [P] **DONE 2026-07-19.** Smoke spec gains recovery-link navigation and unauthenticated-enrolment-redirect checks (still gated on `E2E_BASE_URL`)
- [x] T082 **DONE 2026-07-19.** `jose` imported only by `lib/auth/session.ts` for preview tokens — retained, correctly
- [x] T083 **DONE 2026-07-19.** Typecheck clean. Lint required repair first: `next lint` was removed in Next 16 (script errored) and no ESLint existed — installed ESLint 9 + `eslint-config-next` flat config, script now `eslint .`. Zero errors; 6 warnings (5 pre-existing `set-state-in-effect` in the admin UI, downgraded to warn deliberately + 1 QR `<img>`)
- [x] T084 **DONE 2026-07-19.** All 13 vitest files green: 31 passed, 1 conditional skip (invite test on the built-in sender's 2/h cap — deterministic after T002). e2e suite runs and self-skips without `E2E_BASE_URL`, as designed. **Amended same day per requester direction: tests must not consume shared/production environment quotas.** Integration suites are now gated on a dedicated test environment (`.env.test.local` from `.env.test.example`, with `SUPABASE_TEST_PROJECT="true"`); vitest loads `.env.test*` only, never `.env.local`, so `npm test` skips all integration suites until a disposable test project is provisioned. The green run above was executed against the pre-cutover project before this gate existed. **Re-verified 2026-07-19 against the local Supabase stack** (`npx supabase start`, config in `supabase/config.toml`): **39/39 passing, zero skips** — the invite test now runs for real because local email lands in Mailpit. One platform difference surfaced: local gotrue v2.192 does NOT demote an MFA-reset session to aal1 on refresh (hosted did); the T052 test now asserts only the version-independent invariants, with the residual window bounded by the 15-minute token lifetime either way
- [ ] T085 Load-test connection handling under Fluid Compute. Vercel's documented guidance is a global-scope pool with `attachDatabasePool()`, but its examples use `pg` and Supabase's template says the opposite about global clients. If Supavisor client counts grow unbounded, fall back to `pg` + `drizzle-orm/node-postgres` (risk R7)
- [x] T086 **DONE 2026-07-19.** Grep over app/ and lib/: the only `getSession` occurrence is the guards.ts docstring explaining why it must not be used. No call sites
- [x] T087 **DONE 2026-07-19.** `SUPABASE_SERVICE_ROLE_KEY` referenced only in `lib/supabase/admin.ts` (`server-only`); no client component imports it; no `NEXT_PUBLIC_` variant anywhere. Bonus fix: the `server-only` package was imported in 3 modules but never installed — `next build` would have failed; now a real dependency
- [ ] T088 Walk the full `quickstart.md` — all seven scenarios plus the prerequisites table — against production

---

## Dependencies & Execution Order

### Phase dependencies

- **Phase 1 (Setup)**: no dependencies. T001–T006 are gates for everything after
- **Phase 2 (Foundational)**: depends on Phase 1. **Blocks every user story**
- **Phase 3 (US1)** and **Phase 4 (US2)**: both depend on Phase 2. US1 first — nobody can complete sign-in without enrolling, so enrolment is the shorter path to a demonstrable system
- **Phase 5 (US4)** and **Phase 6 (US5)**: depend on Phase 2; independent of each other
- **Phase 7 (US6)**: depends on all preceding stories being verified
- **Phase 8 (Polish)**: last

### Notable within-phase dependencies

- T024 (guard rewrite) blocks T029, T046 and every route task
- T018–T022 (schema) block T023 (apply), which blocks everything touching the database
- T029 (`requireEnrolmentBootstrap`) blocks T030 and T033
- T035 (`actorEmail` capture) should land before T072 verifies the deletion behaviour
- T050 (rewriting existing test setup) is easy to forget and will otherwise fail the whole suite

### Parallel opportunities

- T002, T003, T004, T005 — independent dashboard and repo checks
- T011, T012, T013 — three separate new files
- T020, T021 — different schema files
- T026, T027, T028 — three separate test files
- T038, T040, T041 — separate test files (T039 is the large sweep and is better done alone)
- T051, T052, T053 — separate test files
- T067, T068 — separate page files
- T079, T080, T081 — docs and tests

---

## Parallel Example: Phase 2 clients

```bash
Task: "Create lib/supabase/client.ts with createBrowserClient"
Task: "Create lib/supabase/server.ts with async createClient"
Task: "Create lib/supabase/admin.ts with the service_role client"
```

## Parallel Example: User Story 1 tests

```bash
Task: "Integration test for enrolment QR payload in tests/integration/auth-enrolment.test.ts"
Task: "Integration test for abandoned enrolment in tests/integration/auth-enrolment-abandon.test.ts"
Task: "Integration test for bootstrap containment in tests/integration/auth-bootstrap.test.ts"
```

---

## Implementation Strategy

### MVP scope

**Phase 1 + Phase 2 + Phase 3 (US1)** — a user can sign in with a password and enrol a second factor
by scanning a code. This is the smallest slice that demonstrates the migration works end to end, and
it closes the original QR gap that prompted the whole effort.

Add **Phase 4 (US2)** immediately after. US1 alone is demonstrable but not safe to run in production:
until T039's negative sweep passes, there is no evidence that admin routes are actually protected.

### Incremental delivery

1. Phases 1–2 → foundation
2. Phase 3 → enrolment works (MVP, demoable)
3. Phase 4 → enforcement proven (**first point at which production is defensible**)
4. Phase 5 → lifecycle without engineering help
5. Phase 6 → recovery without engineering help (the original motivation, delivered)
6. Phase 7 → cutover
7. Phase 8 → polish

### Where the risk actually is

Three tasks carry most of the risk in this plan. Give them disproportionate attention:

- **T039** — the negative sweep across all 13 admin routes. It is the only evidence for SC-002 and SC-002a, and the guards are the sole line of defense since this project uses no RLS
- **T030** — the unenroll-before-enroll step. The unverified-factor lifecycle is undocumented and the factor cap is 10; get this wrong and enrolment breaks permanently for a user, with no error message that points at the cause
- **T056** — `disableUser` must set both the status and the ban. Setting only one leaves a real gap: status alone leaves refresh open, ban alone leaves up to a full token lifetime of continued access

### Notes

- Commit after each task or logical group
- Verify tests fail before implementing
- The MFA endpoint is rate-limited to **15 requests/hour per IP** — iterating on Phase 3 and 4 tests will exhaust it. Plan test runs accordingly, and remember this is a production constraint too, not just a development nuisance
