# Quickstart: Validating the Supabase Auth Migration

**Spec**: [spec.md](./spec.md) | **Contracts**: [contracts/](./contracts/) | **Research**: [research.md](./research.md)

How to prove the migration works. Scenarios map to the spec's user stories and success criteria.

---

## Prerequisites

Resolve these **before** implementation, not during. Each is a research finding that changes the
approach if it comes back the wrong way.

| # | Check | Where | Why it blocks |
|---|---|---|---|
| P1 | Does the Supabase project use **asymmetric (ECC/RSA) signing keys**? | Dashboard → JWT Keys | Determines whether `getClaims()` costs zero or one network hop per guard call, on every request (risk R4) |
| P2 | Is **custom SMTP** configured to Resend? | Dashboard → Auth → SMTP | Built-in sender is capped at **2 emails/hour project-wide**. Invitation and recovery flows are untestable without this (D10) |
| P3 | Is the **access token lifetime** shortened from the 1-hour default? | Dashboard → Auth → Sessions | Bounds the window in which a banned account can still refresh. 15 min suggested (D5) |
| P4 | Which **plan tier**, and is PITR enabled? | Dashboard → Billing | Free tier has **no backups and no PITR**. No longer blocks cutover (nothing to lose yet) — but settle it before the CMS holds content anyone would miss (R2) |
| P5 | Does the **deploy gate** pass? | `git log -1 --format='%ae'` | Production deploys require author `impulseaisolutions@gmail.com` or the deploy is blocked (R8) |
| P6 | Is the **working tree clean**? | `git status` | Substantial uncommitted changes across auth/UI/config complicate rollback (R10) |

---

## Environment

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=        # server-only, never NEXT_PUBLIC_
DATABASE_URL=                     # Supavisor transaction mode, port 6543
DIRECT_DATABASE_URL=              # direct connection, port 5432 — migrations and pg_dump only
PREVIEW_TOKEN_SECRET=             # retained, out of scope
```

Retired: `AUTH_SECRET`, `CMS_DISABLE_MFA`.

Confirm the publishable-key variable name against the project's API settings — current templates use
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, older ones `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

```bash
npm install && npm run dev      # port 3010
```

---

## Scenario 1 — Enrolment shows a scannable code (US1, SC-003, FR-003)

1. Sign in as an account with no factor. Expect to land on enrolment, not the dashboard.
2. **Expect** a rendered QR image, plus a visible secret for manual entry.
3. Scan with any standard authenticator app; submit the generated code.
4. **Expect** success, and arrival at the dashboard.
5. Revisit the enrolment route. **Expect** refusal — the secret is never shown twice (FR-003).

**Abandonment sub-case (US1 scenario 3, risk R5)** — the one most likely to be skipped:

1. Begin enrolment. Do not confirm. Navigate away.
2. Begin enrolment again.
3. **Expect** exactly one unverified factor on the account, not two. Verify directly:
   `admin.mfa.listFactors({ userId })`.
4. Repeat five times. **Expect** the count to stay at one.

Supabase does not document any expiry or garbage collection of unverified factors, and there is a
10-factor cap. If the count grows, enrolment eventually breaks permanently for that user.

---

## Scenario 2 — Sign-in and mandatory second factor (US2, SC-002)

1. Sign in with a valid password for an account **with** a verified factor.
2. **Expect** a challenge, not a session. Response `next: "mfa"`.
3. Submit a wrong code. **Expect** refusal, and an `auth.mfa_fail` audit row.
4. Submit the correct code. **Expect** access, `last_login_at` updated, `auth.login` audited.
5. Sign out. **Expect** the session to grant nothing — and verify **other devices stay signed in**
   (`scope: 'local'`; Supabase defaults to `global`, risk R9).

### Negative testing — this is SC-002, and it is the point

Enumerate all 13 admin routes and, for each, attempt access with an `aal1`-only session:

```
/api/admin/[type]              /api/admin/[type]/[id]
/api/admin/[type]/[id]/preview /api/admin/[type]/[id]/publish
/api/admin/[type]/[id]/restore /api/admin/[type]/[id]/translate
/api/admin/[type]/[id]/unpublish
/api/admin/[type]/[id]/versions
/api/admin/audit               /api/admin/users
/api/admin/users/[id]          /api/admin/webhooks
/api/admin/webhooks/[id]
```

**Expect 403 on every one. Zero exceptions.** Test the routes directly, not via the UI — the UI
hiding a button is not enforcement.

Repeat for every admin *page* under `app/(admin)/`, and for any Server Action. Server Actions are
POSTs to the route they live in and are **not** reliably covered by proxy matchers; a page-level
check does not extend to them.

---

## Scenario 3 — Bootstrap is bounded (FR-029, FR-030, SC-002a)

The narrow path where a password-only session is allowed through. Test it hardest.

1. Create an admin with no factor. Sign in with the password only.
2. **Expect** to reach enrolment.
3. From that state, attempt **every route in the list above** by direct navigation.
   **Expect 403 on every one.** This is SC-002a.
4. Complete enrolment.
5. **Expect** normal enforcement immediately, with no residual exemption — re-run step 3 with the
   factor enrolled but unsatisfied and expect the challenge, not the bootstrap.
6. **Expect** `auth.bootstrap_enter` and `auth.bootstrap_exit` audit rows (FR-031).
7. Create a **second** admin months-equivalent later and confirm the same path works — the state is
   an account property, not a cutover-time exception (FR-030).

---

## Scenario 4 — Fresh schema is correct (SC-004, FR-020, FR-021, FR-024)

**Revised**: nothing is migrated, so there is nothing to compare. The question is no longer "did the
data survive" but "does the new schema actually work". Exercise it, don't just inspect it — a schema
can look right and still have a wrong `on delete` rule.

1. Apply the schema: `npm run db:migrate` against the new database (direct connection, not 6543).
2. Provision the first administrator (FR-022). **Expect** a usable `auth.users` row with a matching
   `profiles` row.
3. Write and read back at least one row in **each** of the seven collections through the
   application — not by hand in SQL. Create a case study, edit it to produce a version, publish it,
   upload a media asset, register a webhook.
4. **Expect** every relationship to resolve: authorship on the entry, lineage on the version,
   uploader on the asset, actor on the audit rows.

Then verify the FK rules behave as designed — this is the part most likely to be wrong, because it
diverges deliberately from the vendor default:

```sql
-- Delete a throwaway user via auth.admin, then:
select count(*) from audit_log where actor_id is null and actor_email is not null;
```

**Expect** the audit rows to still exist with `actor_id` nulled and `actor_email` populated. If they
vanished, the cascade is wrong and FR-019 is broken — the single most important assertion in this
scenario, because it is the one Supabase's documented default would get wrong.

Repeat for `content_entries`, `content_versions` and `media_assets`: the rows must survive their
author's deletion.

---

## Scenario 5 — Self-service recovery (US5, FR-016, FR-017)

1. Request recovery for a **registered** address. **Expect** an email (requires P2).
2. Request recovery for an **unregistered** address. **Expect** an identical `200` — same body, same
   status, and no observable timing difference (FR-017).
3. Use the link. Set a new password. Sign in.
4. **Expect** the second factor still to be required — resetting a password must not bypass MFA.
5. Reuse the same link. **Expect** refusal.

---

## Scenario 6 — Lifecycle (US4)

1. Invite a user. **Expect** no `password` field accepted anywhere, and no administrator ever seeing
   their password (FR-014).
2. **Expect** the new user to start at `invited` and reach `active` only after accepting.
3. Reset a user's factor while they hold an active session. **Expect** immediate sign-out
   (`deleteFactor` terminates sessions when the factor was verified) and re-enrolment required.
4. Disable an account. **Expect** refusal on its **very next request** — not after the token expires.
   This is the check that proves the per-request status read is actually wired up (research D5).
5. Change a role. **Expect** the new role to govern on the next request, not up to an hour later.
6. As an editor, attempt every user-management action. **Expect 403**.
7. Attempt to remove or disable the last active administrator. **Expect** refusal (FR-012) — test
   via role change, via disable, **and** via deletion, since deletion is a new path to the same
   failure.

---

## Scenario 7 — Rollback (US6, SC-008, FR-025)

**Revised**: with nothing transferred and Neon untouched, rollback is a configuration change. There
is no restore step and no point of no return. Still verify it — an untested rollback is not a
rollback.

1. With the new database live, repoint `DATABASE_URL` (and `DIRECT_DATABASE_URL`) at Neon.
2. Redeploy.
3. **Expect** the previous system to come back intact, because it was never modified.
4. Repoint forward again and confirm the new system returns.

**The one way to lose this property**: decommissioning the Neon project. FR-023 requires it stay
alive and readable for the whole rollback window. Do not delete it as cleanup on cutover day — that
is the single action that converts a reversible cutover into an irreversible one.

**Note on `AUTH_SECRET`**: rolling back restores the old auth stack, which needs it. Do not remove
it from the environment until the rollback window closes, even though the new system ignores it.

---

## Rate limits during testing

You will hit these before real users do. They are platform-imposed and mostly not configurable.

| Endpoint | Limit | Configurable |
|---|---|---|
| MFA challenge / verify | **15/hour per IP** | **No** |
| Built-in email sender | 2/hour project-wide | No — use custom SMTP |
| Custom SMTP | 30/hour default | Yes |
| Token refresh | 1,800/hour per IP | No |

**The MFA limit is per IP, not per user.** Iterating on the enrolment flow will exhaust it in
minutes, and everyone sharing your egress IP is locked out for the remainder of the hour. Plan test
runs accordingly — and note this is a **production** constraint too, not just a testing nuisance:
an office behind one NAT shares the same 15/hour (risk R1).

---

## Existing test suites

```bash
npm run test          # vitest — unit + integration
npm run test:e2e      # playwright
npm run typecheck
npm run lint
```

The existing integration tests (`us1-publish-flow`, `us2-no-draft-leak`, `us4-version-restore`,
`us-conflict`) exercise content flows that require an authenticated session. **They will need
their auth setup rewritten** — budget for this; it is not incidental.

There are currently **no tests covering authentication itself**. The negative tests in Scenarios 2
and 3 are new work and are the highest-value tests in this migration.
