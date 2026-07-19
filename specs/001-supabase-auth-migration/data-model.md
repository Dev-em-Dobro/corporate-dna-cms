# Phase 1 Data Model: Supabase Auth Migration

**Date**: 2026-07-18 | **Spec**: [spec.md](./spec.md) | **Research**: [research.md](./research.md)

---

## Ownership boundary

The migration splits what is today one table across two owners.

| Concern | Owner | Notes |
|---|---|---|
| Email, password, email confirmation, MFA factors, sessions, bans | **`auth.users`** (Supabase) | Never written directly. Managed via `supabase.auth.*` and `supabase.auth.admin.*` |
| Role, status, last sign-in, application relationships | **`public.profiles`** (ours) | Read on every guarded request (research D5) |

Rule, quoted from Supabase's documentation: *"Only use primary keys as foreign key references for
schemas and tables like `auth.users` which are managed by Supabase."* Never reference
`auth.users.email` or any non-PK column — Supabase may change them without notice.

---

## `profiles` (was `users`)

Renamed per research D6 — matches the documented pattern and sidesteps a reported `search_path`
collision between `public.users` and `auth.users`.

| Column | Type | Change | Notes |
|---|---|---|---|
| `id` | `uuid` PK | **Changed** | Now `references auth.users(id) on delete cascade`. No longer `defaultRandom()` — the value originates in `auth.users` |
| `email` | `text not null unique` | **Retained, now denormalized** | Authoritative copy lives in `auth.users`. Kept for display and joins without a cross-schema hop. Must be kept in sync on change |
| `password_hash` | `text` | **Dropped** | Owned by `auth.users.encrypted_password`. Retires `@node-rs/argon2` |
| `totp_secret` | `text` | **Dropped** | Owned by `auth.mfa_factors`. Retires `otplib` |
| `mfa_enabled` | `boolean` | **Dropped** | Derived from `auth.mfa_factors` at runtime via `listFactors()` / the `aal` claim. Storing it would create a second source of truth that can silently drift |
| `role` | `role` enum | Retained | `admin` \| `editor`. Read per request (D5), never trusted from a JWT claim |
| `status` | `user_status` enum | Retained | `invited` \| `active` \| `disabled`. **Now load-bearing** — the per-request status check is what makes FR-006/FR-009 work despite unrevocable access tokens |
| `last_login_at` | `timestamptz` | Retained | Written by the app after a successful full-assurance sign-in |
| `created_at` / `updated_at` | `timestamptz not null` | Retained | — |

**On `status` vs. Supabase's ban mechanism**: Supabase offers `ban_duration` via
`admin.updateUserById()`. Both are used, deliberately and for different reasons — `banned_until`
stops *token refresh* at the platform level, while `profiles.status` is what the guard actually
enforces on each request. Relying on the ban alone leaves a window of up to one token lifetime;
relying on `status` alone leaves the refresh path open. They must be set together, and
`disableUser()` is the single choke-point that does so.

---

## Foreign keys into the user table

Five columns reference the user table today. All are nullable with no `on delete` clause, so the
current effective behaviour is `NO ACTION` — **deleting a user fails outright**. Under the new
cascade from `auth.users`, deletion becomes possible, so each FK needs an explicit, considered rule.

| Table | Column | Current | New | Why |
|---|---|---|---|---|
| `audit_log` | `actor_id` | `NO ACTION` | **`on delete set null`** | Deliberate divergence from Supabase's blanket-cascade guidance. Cascading here would erase audit history on user deletion, violating FR-019 and destroying the "audit on every change" property |
| `content_entries` | `created_by` | `NO ACTION` | `on delete set null` | Content must outlive its author |
| `content_entries` | `updated_by` | `NO ACTION` | `on delete set null` | Same |
| `content_versions` | `author_id` | `NO ACTION` | `on delete set null` | Version history must outlive its author |
| `media_assets` | `uploaded_by` | `NO ACTION` | `on delete set null` | Assets must outlive their uploader |

### `audit_log.actor_email` — new column

`text`, nullable. A denormalized snapshot of the actor's email captured **at write time** by
`writeAudit()`.

Without it, `on delete set null` degrades a deleted user's history to anonymous rows — technically
retained, practically useless, and arguably still a violation of FR-019's intent. The snapshot keeps
the trail human-readable after the referenced profile is gone. Deliberate denormalization: an audit
record is a historical fact and should not change when a user later changes their email.

---

## Tables unaffected in shape

`content_entries`, `content_versions`, `media_assets`, `case_study_facets`, `webhook_endpoints`
change only in the FK rules above. `case_study_facets` and `webhook_endpoints` have no user
reference at all and move as pure data.

The internal `content_versions.entry_id → content_entries.id on delete cascade` relationship is
correct as-is and is not touched.

---

## ~~Identity remapping~~ — **not required** *(revised 2026-07-18)*

The original plan re-keyed every existing user identifier and remapped all five foreign key columns
through a mapping table — the riskiest and least reversible step in the migration.

**None of it is needed.** The database is created from scratch (research D12), so the schema is born
with `profiles.id` already equal to the `auth.users` UUID. There is no mapping table, no `UPDATE`
across five columns, no orphan verification, and no point of no return.

What replaces it:

1. Apply the schema to the new database with `drizzle-kit migrate`.
2. Provision the first administrator through `auth.admin` (FR-022) — no accounts are carried over,
   so one must be created deliberately.
3. Exercise each collection once through the application to confirm relationships resolve (FR-024).

**Passwords are not carried over** (FR-028). No password-hash import is attempted, and no reliance
is placed on `auth.users.encrypted_password` accepting foreign hashes — a capability that could not
be confirmed in official documentation. That uncertainty is now moot.

**Rollback stays open indefinitely**, since Neon is untouched — provided it is not decommissioned
during the rollback window (FR-023).

---

## Entities with no table

Two spec entities exist entirely inside Supabase and have no local representation. Recorded here so
the absence is understood as intentional rather than overlooked.

| Entity | Lives in | Accessed via |
|---|---|---|
| Second factor | `auth.mfa_factors` | `mfa.enroll` / `challenge` / `verify` / `unenroll`; `admin.mfa.listFactors` / `deleteFactor` |
| Session | Supabase-managed cookies + `auth.sessions` | `@supabase/ssr` cookie adapter; `getClaims()` for the `aal` claim |

Neither is mirrored locally. Mirroring MFA state in particular was considered and rejected — the
`mfa_enabled` boolean is dropped for exactly this reason.

---

## State transitions

### Account status

```
invited ──(accepts invitation, sets own password)──> active
active  ──(admin disables)──────────────────────────> disabled
disabled ──(admin re-enables)───────────────────────> active
```

`invited` is currently vestigial — `createUser()` writes `active` directly and takes an
admin-supplied password. FR-013/FR-014 make this transition real for the first time: the invitation
flow must exist, and administrators must never handle another user's password.

### Assurance level, per session

```
unauthenticated ──(password)──> aal1 ──(TOTP verified)──> aal2
```

Guard behaviour keys on the `currentLevel` / `nextLevel` pair (research D8):

| currentLevel | nextLevel | Meaning | Guard action |
|---|---|---|---|
| `aal1` | `aal1` | No factor enrolled | **Bootstrap** — enrolment route only (FR-029) |
| `aal1` | `aal2` | Enrolled, not satisfied this session | Redirect to challenge |
| `aal2` | `aal2` | Satisfied | Normal access |
| `aal2` | `aal1` | Factor removed; stale JWT | Force refresh |

The bootstrap state is a property of the account — "has no verified factor" — not a timed exception,
which is what FR-030 requires.

---

## Validation rules

- `profiles.id` must exist in `auth.users`. Enforced by the FK.
- `profiles.email` must match `auth.users.email`. **Not enforceable by a constraint across schemas** — maintained by routing every email change through a single service function. A drift-detection check belongs in the post-migration verification script.
- At least one `active` `admin` must exist at all times (FR-012). Currently enforced in `updateUser()`; must additionally cover deletion and Supabase-side bans, which are new paths to the same failure.
- `audit_log.actor_email` is written at insert time and never updated afterwards.
