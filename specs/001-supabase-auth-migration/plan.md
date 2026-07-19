# Implementation Plan: Supabase Auth Migration

**Branch**: `001-supabase-auth-migration` | **Date**: 2026-07-18 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-supabase-auth-migration/spec.md`

---

## Summary

Replace the CMS's in-house authentication — jose-signed cookie sessions, otplib TOTP, argon2 password
hashing — with Supabase Auth, and move the database from Neon Postgres to Supabase Postgres. The
motivation is retiring long-term maintenance (password reset, email verification, account recovery)
and keeping SSO reachable later.

**Technical approach**: the enforcement architecture does not change. All 13 admin routes already
call an explicit guard (`requireSession` / `requireAdmin`) and there is no middleware — which is
exactly the pattern Next.js and Supabase both prescribe. The migration therefore rewrites the
*internals* of `lib/auth/guards.ts` over `@supabase/ssr` + `getClaims()`, adds a `proxy.ts` for
cookie refresh only, and leaves the 13 call sites untouched.

Role and status continue to be read from the application database on every guarded request. This is
not a carry-over of habit — it is forced. Supabase cannot revoke an already-issued access token, so
a JWT-carried role or status would be stale by up to the token lifetime, failing FR-006 and FR-009.
The per-request read is what makes those requirements hold, and it is what the code already does.

The user table is keyed so its primary key **is** the `auth.users` UUID, and renamed `users` →
`profiles`. Audit retention deliberately diverges from Supabase's documented blanket
`on delete cascade`, which would erase audit history.

**The database is created from scratch.** The requester confirmed on 2026-07-18 that the existing
database holds nothing worth keeping — development had only just begun. This removes the riskiest
part of the original plan: no data transfer, no identity remapping across five foreign keys, no
write-freeze window, and no point of no return. Rollback is repointing `DATABASE_URL` at the
untouched Neon database and redeploying. The corresponding user story is withdrawn in the spec, and
the affected requirements were rewritten rather than deleted so the reasoning stays on record.

---

## Technical Context

**Language/Version**: TypeScript 5.9, Node.js (Vercel Fluid Compute)

**Framework**: Next.js 16.2 App Router, React 19.2

**Primary Dependencies**:
- Added — `@supabase/supabase-js`, `@supabase/ssr`, `postgres` (postgres.js)
- Removed — `otplib`, `qrcode`, `@types/qrcode`, `@node-rs/argon2`, `@neondatabase/serverless`, and `next-auth` (already dead: declared, imported nowhere)
- Retained — `drizzle-orm` 0.45, `zod`, `resend`, `jose` (preview tokens only)

**Storage**: Supabase Postgres via Drizzle. Supavisor **transaction mode, port 6543**, `prepare: false`. Migrations and `pg_dump` use the direct connection on 5432.

**Testing**: vitest (unit + integration), Playwright (e2e). Existing integration suites authenticate and will need their setup rewritten. **No authentication tests exist today** — the negative tests are new work and are the highest-value output of this migration.

**Target Platform**: Vercel (own project, admin subdomain)

**Project Type**: Web application — Next.js App Router, admin UI + authoring API + published read API in one deployment

**Performance Goals**: no regression in guarded-request latency. Guards resolve once per render pass via React `cache()`. `getClaims()` is network-free **only** if the project uses asymmetric signing keys — unverified (risk R4).

**Constraints**:
- MFA challenge/verify: **15 requests/hour per IP address**, platform-imposed, not configurable, shared across everyone behind one egress IP
- Access tokens cannot be revoked before expiry — mitigated by the per-request status read plus a shortened token lifetime
- Supabase free tier has **no automated backups and no PITR**
- Production deploys require HEAD commit author `impulseaisolutions@gmail.com`

**Scale/Scope**: internal CMS, small editor population, no established user base, **empty database**. 7 tables, 21 API routes (13 admin), ~10 files touched in `lib/auth` and `lib/users`.

---

## Constitution Check

*GATE: must pass before Phase 0 research. Re-check after Phase 1 design.*

**Status: not applicable — no gates evaluated.**

`.specify/memory/constitution.md` is an unfilled template; it contains only placeholder text
(`[PRINCIPLE_1_NAME]`, `[SECTION_2_CONTENT]`). There are no ratified project principles to check
this design against, so no gate can pass or fail.

This is recorded rather than silently skipped. If governance principles matter for a change of this
blast radius — particularly around testing requirements and security review — the constitution
should be filled in via `/speckit-constitution` before implementation, not after.

**Post-Phase-1 re-check**: unchanged. Still no constitution.

---

## Project Structure

### Documentation (this feature)

```text
specs/001-supabase-auth-migration/
├── plan.md              # This file
├── spec.md              # 31 functional requirements, 6 user stories, 10 success criteria
├── research.md          # Phase 0 — 12 decisions, 10 open risks
├── data-model.md        # Phase 1 — ownership split, FK deletion rules, state transitions
├── quickstart.md        # Phase 1 — 7 validation scenarios + prerequisites
├── contracts/
│   ├── auth-routes.md   # HTTP surface: changed, new, retired
│   └── guards.md        # Server-side enforcement API
├── checklists/
│   └── requirements.md  # Spec quality gate — 16/16
└── tasks.md             # Phase 2 — NOT created by /speckit-plan
```

### Source Code (repository root)

```text
app/
├── (admin)/                          # admin UI — layout gating changes
│   ├── layout.tsx                    # readSession -> guard DAL
│   └── users/page.tsx
├── login/page.tsx                    # two-step flow: branch on `next`, not challengeId
├── auth/
│   ├── enrol/                        # NEW — bootstrap enrolment screen (FR-029)
│   └── confirm/                      # NEW — token_hash callback (invite, recovery)
└── api/
    ├── auth/
    │   ├── login/route.ts            # returns `next`, no challengeId
    │   ├── mfa/route.ts              # no challengeId; platform 429 surfaces here
    │   ├── logout/route.ts           # signOut({ scope: 'local' }) — explicit
    │   ├── mfa/enrol/                # NEW
    │   ├── recover/                  # NEW
    │   └── password/                 # NEW
    └── admin/                        # 13 routes — call sites UNCHANGED
        ├── users/                    # invite instead of admin-set password
        └── ...

lib/
├── auth/
│   ├── guards.ts                     # REWRITTEN internals, same exports + one new
│   ├── session.ts                    # gutted — preview tokens only
│   ├── totp.ts                       # DELETED
│   └── password.ts                   # DELETED
├── supabase/                         # NEW
│   ├── client.ts                     # createBrowserClient
│   ├── server.ts                     # createServerClient (async, await cookies())
│   ├── admin.ts                      # service_role client — server-only
│   └── proxy.ts                      # cookie refresh
├── users/service.ts                  # invite/disable/reset over auth.admin.*
└── audit/log.ts                      # + actor_email snapshot

db/
├── index.ts                          # neon-serverless -> postgres-js
├── schema/users.ts                   # -> profiles.ts, PK references authUsers
└── migrations/                       # fresh schema: FK deletion rules + actor_email

proxy.ts                              # NEW — root convention (Next 16; was middleware.ts)
scripts/
└── seed-admin.ts                     # rewritten over auth.admin — now the ONLY way in (FR-022)
```

No migration script: the database is created from scratch, so `drizzle-kit migrate` plus
`seed-admin` is the whole provisioning path.

**Structure Decision**: existing Next.js App Router layout is kept as-is. The only structural
addition is `lib/supabase/` (the vendor-documented client split) and a root `proxy.ts`. Note the
file is `proxy.ts`, not `middleware.ts` — Next.js 16 deprecated and renamed that convention, and
Supabase's own template has already migrated.

---

## Implementation phasing

Ordered so each stage is independently verifiable and the irreversible step comes last.

| Stage | Work | Verified by |
|---|---|---|
| 0 | Prerequisites P1–P6 — signing keys, SMTP, token lifetime, plan tier, deploy gate, clean tree | quickstart Prerequisites |
| 1 | Supabase project, `lib/supabase/*`, `proxy.ts`, driver swap, schema on staging | app boots, DB reachable |
| 2 | Guard rewrite over `getClaims()` + per-request status read | Scenario 2 negative tests across all 13 routes |
| 3 | Enrolment + bootstrap (FR-029/030/031) | Scenarios 1 and 3 — including abandonment |
| 4 | Lifecycle: invite, disable, role, MFA reset | Scenario 6 |
| 5 | Self-service recovery | Scenario 5 |
| 6 | Fresh schema applied; every collection exercised end-to-end; FK deletion rules verified | Scenario 4 |
| 7 | Cutover (env swap + redeploy); runbook rewrite (FR-027) | Scenarios 4 and 7 against production |

Stage 6 must complete before stage 7 is scheduled. **Stage 7 is no longer a point of no return** —
nothing is transferred and Neon is left untouched, so rollback stays open indefinitely.

The one action that would forfeit this: decommissioning the Neon project. Keep it alive and readable
for the whole rollback window (FR-023), and keep `AUTH_SECRET` in the environment until that window
closes — rolling back restores the old auth stack, which needs it.

---

## Complexity Tracking

No constitution exists, so there are no gate violations to justify. Two design choices nevertheless
depart from vendor-recommended defaults and are recorded here deliberately.

| Divergence | Why needed | Simpler alternative rejected because |
|---|---|---|
| `audit_log.actor_id` uses `on delete set null` + a denormalized `actor_email`, instead of Supabase's documented blanket `on delete cascade` | Cascading would erase a deleted user's audit history, violating FR-019 and destroying the "audit on every change" property the handover document names as a core control | The documented cascade guidance is written for a `profiles` table, not an audit trail. No Supabase documentation addresses audit retention under cascade — so following the default here would be following it past the end of its reasoning |
| Role and status read from the database per request, rather than carried as a JWT claim (Supabase's documented RBAC recommendation is a Custom Access Token Hook) | Supabase cannot revoke a live access token. A JWT-carried role or status is stale by up to the token lifetime, which fails FR-006 and FR-009 | The hook approach is cheaper per request but cannot deliver immediate revocation. For a CMS that disables accounts, correctness beats latency — and the code already does a per-request read today, so this is not a new cost |

---

## Requirements needing amendment

Research surfaced two requirements that cannot stand exactly as written. Both need a decision before
`/speckit-tasks`.

- **FR-009** — "MUST invalidate sessions when an account is disabled or has its second factor reset."
  The factor-reset half holds: `admin.mfa.deleteFactor()` terminates all sessions when the factor was
  verified. The disable half **cannot** hold literally — a live access token is not revocable. With
  the per-request status read the *observable* behaviour is immediate refusal, so the requirement
  should be restated in terms of what a user experiences ("a disabled account is refused on its next
  request") rather than in terms of token invalidation.
- **FR-007** — throttling. MFA throttling is imposed by the platform at 15/hour/IP. It is neither
  ours to tune nor ours to bypass, and it is per-IP rather than per-user. The requirement should
  acknowledge platform-imposed limits rather than implying we own them.

---

## Open decision for the requester

**Risk R2 — backups.** The free tier has no automated backups and no PITR. Neon today provides
branch-based point-in-time restore, and the documented recovery runbook depends on it. Moving to the
free tier trades managed PITR for scheduled dumps that someone has to remember to run.

**This no longer blocks cutover** — with an empty database there is nothing to lose, which is why it
moved off the critical path. But it does not go away; it becomes the operating posture the moment
real content exists. The decision point is not cutover day, it is the first day the CMS holds
something anyone would miss. Deferring is fine as long as the deferral is deliberate and dated
rather than forgotten.
