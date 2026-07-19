# Feature Specification: Supabase Auth Migration

**Feature Branch**: `001-supabase-auth-migration`

**Created**: 2026-07-18

**Status**: Ready for planning — all clarifications resolved

**Input**: Replace the Corporate DNA CMS custom authentication with Supabase Auth, and migrate the database from Neon Postgres to Supabase Postgres. Motivation is long-term maintenance reduction (password reset, email verification, session revocation, account recovery) and enabling SSO later — explicitly *not* cost and *not* "open source", since the current stack (jose, otplib, argon2) is already open source and costs nothing.

> **Numbering note**: Requirements below are numbered fresh (FR-001…). The legacy requirement
> "FR-015" referenced in `lib/auth/session.ts` (mandatory TOTP for admins) is carried forward here
> as **FR-004** and **FR-005**.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Enrol a second factor by scanning a code (Priority: P1)

An admin or editor who needs a second factor is shown a scannable code during enrolment. They open
their authenticator app, scan it, and confirm with a generated code. No copying of long text strings.

**Why this priority**: Today enrolment shows only a raw `otpauth://` text URI that must be copied
and pasted by hand — a known usability gap. Every user must re-enrol after cutover (existing secrets
cannot be carried into the new provider), so this path is on the critical path for *everyone*. It is
also independently valuable and demonstrable before anything else changes.

**Independent Test**: Trigger enrolment for a test account, scan the displayed code with a standard
authenticator app, and confirm the generated code is accepted. Delivers a working second factor
without touching sign-in or data migration.

**Acceptance Scenarios**:

1. **Given** a user without a second factor, **When** they begin enrolment, **Then** a scannable code is displayed along with a manual-entry fallback for users who cannot scan.
2. **Given** the displayed code has been scanned, **When** the user submits a code from their authenticator app, **Then** enrolment completes and the account is marked as having a second factor.
3. **Given** enrolment is in progress, **When** the user abandons it without confirming, **Then** no partial factor is left on the account and enrolment can be restarted cleanly.
4. **Given** a user has completed enrolment, **When** the enrolment screen is revisited, **Then** the secret is not displayed again.

---

### User Story 2 - Sign in with password and mandatory second factor (Priority: P1)

An existing user signs in with their email and password, is challenged for their second factor, and
lands in the admin UI with the same role and permissions they had before.

**Why this priority**: This is the core of the migration. If it does not work, nobody can use the
CMS at all. Mandatory second factor for admins is a pre-existing hard requirement that must survive
the change of provider.

**Independent Test**: With a migrated test account, complete the full sign-in flow and confirm
arrival in the admin UI with correct role. Attempt to reach an admin route with only the first
factor satisfied and confirm it is refused.

**Acceptance Scenarios**:

1. **Given** valid credentials, **When** the user submits them, **Then** they are challenged for a second factor rather than being signed straight in.
2. **Given** an admin has satisfied only the password step, **When** they attempt to reach any admin function, **Then** access is refused until the second factor is satisfied.
3. **Given** an incorrect second-factor code, **When** it is submitted, **Then** access is refused and the attempt is recorded in the audit trail.
4. **Given** repeated failed attempts from one source, **When** a threshold is crossed, **Then** further attempts are throttled.
5. **Given** a disabled account, **When** correct credentials are supplied, **Then** access is refused regardless of second-factor state.
6. **Given** a signed-in session, **When** the user signs out, **Then** the session no longer grants access.
7. **Given** an administrator with no second factor enrolled yet, **When** they sign in with a valid password, **Then** they reach the enrolment screen and nothing else.
8. **Given** that same administrator in the bootstrap state, **When** they attempt to reach any administrative function by direct navigation, **Then** it is refused and they are returned to enrolment.
9. **Given** an administrator who completes enrolment from the bootstrap state, **When** they next act, **Then** normal second-factor enforcement applies with no residual exemption.

---

### ~~User Story 3 - Content, history and audit survive the move intact~~ — **WITHDRAWN**

**Withdrawn 2026-07-18.** The requester confirmed the existing database holds no content worth
keeping — development had only just begun. The new database is therefore **created from scratch**
rather than migrated, and nothing is carried over from Neon.

This removes the highest-risk portion of the work: no data transfer, no identity remapping across
five foreign keys, and no point of no return. Rollback reduces to repointing `DATABASE_URL` at the
untouched Neon database and redeploying.

Retained from this story: the schema must still be correct, and the audit-retention design
(FR-019) still matters going forward — as an ongoing property, not a migration guarantee.

Story numbering is preserved rather than compacted so references in `plan.md`, `quickstart.md` and
`contracts/` stay valid.

---

### User Story 4 - Manage users without engineering help (Priority: P2)

An admin invites a new editor, changes someone's role, disables a departing colleague's account, and
resets a second factor for someone who lost their phone — all from the admin UI.

**Why this priority**: These flows exist today and must not regress. Resetting a lost second factor
in particular becomes materially safer when handled by the identity provider.

**Independent Test**: Perform each lifecycle action against test accounts and confirm the affected
user's access changes accordingly on their next sign-in attempt.

**Acceptance Scenarios**:

1. **Given** an admin, **When** they invite a new user, **Then** that user can establish credentials and enrol a second factor without an administrator ever seeing their password.
2. **Given** a user who lost their authenticator, **When** an admin resets their second factor, **Then** the old factor stops working immediately and the user is required to enrol again.
3. **Given** an admin disables an account, **When** the affected user next attempts any action, **Then** access is refused.
4. **Given** a role change, **When** the affected user's permissions are next evaluated, **Then** the new role governs access.
5. **Given** an editor, **When** they attempt any user-management action, **Then** it is refused.

---

### User Story 5 - Self-service account recovery (Priority: P2)

A user who has forgotten their password recovers access on their own, without a developer touching
the database.

**Why this priority**: This is the maintenance burden the migration is being undertaken to remove.
It has no equivalent today — recovery currently requires engineering intervention.

**Independent Test**: From the sign-in screen, complete a full password recovery on a test account
and sign in with the new password, with no administrator or developer action involved.

**Acceptance Scenarios**:

1. **Given** a user at the sign-in screen, **When** they request password recovery, **Then** they receive a means of resetting it at their registered address.
2. **Given** a recovery link, **When** it is used after expiry or a second time, **Then** it is refused.
3. **Given** a completed password reset, **When** the user signs in, **Then** they are still required to satisfy their second factor.
4. **Given** a recovery request for an address that is not registered, **Then** the response does not reveal whether the account exists.

---

### User Story 6 - Cutover and rollback (Priority: P3)

An operator performs the migration during a planned window, verifies the system, and — if
verification fails — returns to the previous state with no data loss.

**Why this priority**: The system is live. This story protects the other five, but is exercised once
rather than continuously.

**Independent Test**: Perform a full rehearsal against a staging copy, including a deliberate
rollback, and confirm the pre-migration state is fully restored.

**Acceptance Scenarios**:

1. **Given** a planned cutover window, **When** migration runs, **Then** the public marketing site continues serving content throughout, unaffected.
2. **Given** post-migration verification fails, **When** rollback is invoked, **Then** the system returns to its pre-migration state with all data intact.
3. **Given** the migration has completed and been accepted, **When** operators consult recovery documentation, **Then** it describes the new backup and restore procedure rather than the retired one.

---

### Edge Cases

- A user is midway through second-factor enrolment when the cutover window begins.
- An account exists in `invited` status and has never signed in — it must not become a way in without credentials being set.
- An account is `disabled` at migration time and must not be silently reactivated by the move.
- Two identities collide on the same email address between the old records and the new provider.
- An admin's own account is the last remaining admin and an action would leave the system with no administrator.
- A user's second factor is reset while they hold an active session.
- The identity provider is unreachable — users must see a clear failure rather than a silent bypass.
- A session established before cutover is presented after cutover.
- Clock drift on a user's device causes valid codes to be rejected.
- A partially completed data migration is interrupted and must not leave a half-populated system reachable.

## Requirements *(mandatory)*

### Functional Requirements

**Authentication**

- **FR-001**: System MUST authenticate users by email and password through a managed identity provider rather than credential logic maintained in this codebase.
- **FR-002**: System MUST require a time-based one-time code as a second factor, presented as a step after the password is accepted.
- **FR-003**: System MUST present the second-factor secret as a scannable code during enrolment, with a manual-entry fallback, and MUST NOT display it again after enrolment completes.
- **FR-004**: System MUST require every administrator to hold an enrolled second factor. An administrator account without one MUST NOT be able to reach administrative functions. *(carries forward legacy FR-015)*
- **FR-005**: System MUST evaluate second-factor satisfaction on every protected request, not only at sign-in, so that an elevated session cannot be obtained by satisfying the password step alone.
- **FR-006**: System MUST refuse access to accounts in a disabled state regardless of credential or second-factor validity.
- **FR-007**: System MUST throttle repeated failed authentication attempts.
- **FR-008**: Users MUST be able to terminate their own session, after which it grants no further access.
- **FR-009**: System MUST invalidate sessions belonging to an account when that account is disabled or has its second factor reset.

**Authorisation**

- **FR-010**: System MUST preserve the existing two-role model, distinguishing administrators from editors.
- **FR-011**: System MUST restrict user-management functions to administrators.
- **FR-012**: System MUST prevent an action that would leave the system with no enabled administrator.

**User lifecycle**

- **FR-013**: Administrators MUST be able to invite a user, change a user's role, and disable a user.
- **FR-014**: System MUST allow a user to establish their own password during invitation acceptance, such that no administrator handles another user's password.
- **FR-015**: Administrators MUST be able to reset a user's second factor, after which the previous factor stops working immediately and re-enrolment is required.
- **FR-016**: Users MUST be able to recover access to their own account without administrator or developer intervention.
- **FR-017**: System MUST NOT reveal whether an email address is registered in response to a recovery request.

**Audit**

- **FR-018**: System MUST record sign-in successes, second-factor failures, and every user-management action in the audit trail.
- **FR-019**: System MUST retain audit records when the user they attribute an action to is deleted, including enough identifying information to remain human-readable after that user no longer exists.

**Database provisioning** *(revised — no data is carried over; see withdrawn User Story 3)*

- **FR-020**: System MUST create all seven data collections — user profiles, content entries, content versions, media assets, case study facets, audit records, and webhook endpoints — on the new database from schema definitions, with no data transferred from the previous database.
- **FR-021**: System MUST establish every relationship between collections on the new schema, including content authorship, version lineage, and audit attribution, such that the application behaves identically to a correctly migrated system.
- **FR-022**: System MUST provision at least one administrator account on the new database, since no accounts are carried over.
- **FR-023**: The previous database MUST be left untouched and readable for the duration of the rollback window.

**Operations**

- **FR-024**: The new schema MUST be verifiable against the application before cutover — every route exercised, every collection written to and read back.
- **FR-025**: System MUST support returning to the previous database if verification fails, by configuration change and redeployment alone, with no data restore step.
- **FR-026**: The public marketing site MUST continue serving content for the full duration of the cutover.
- **FR-027**: Backup and recovery documentation MUST be updated to describe the new procedure, replacing the retired provider-specific instructions.
- **FR-028a**: Media files already stored with the CDN provider that have no corresponding metadata record on the new database MUST be identified, so that orphaned storage is a known quantity rather than an unbounded cost.

**Cutover**

- **FR-028**: System MUST require every user to establish a new password at cutover; existing password credentials are NOT carried over. Cutover is therefore a single one-time disruption in which a user sets a new password and enrols a second factor together.
- **FR-029**: System MUST provide a bootstrap path for administrators who have no second factor yet: an account in this state MUST be permitted to sign in with its password *solely* to reach the second-factor enrolment screen, and MUST be refused every other administrative function until enrolment completes.
- **FR-030**: The bootstrap state of FR-029 MUST be a property of the account (no factor enrolled yet) rather than a time-boxed or environment-wide exception, so that it applies identically to administrators created long after cutover.
- **FR-031**: System MUST record entry into and exit from the bootstrap state in the audit trail.

### Key Entities

- **User account**: A person who can sign into the CMS. Carries an email address, a role (administrator or editor), a status (invited, active, or disabled), a record of last sign-in, and an association to credentials and second-factor enrolment held by the identity provider. Referenced as the actor on audit records and as the author on content.
- **Second factor**: A time-based one-time code generator bound to a single user account. Enrolled once, resettable by an administrator, and required for administrators on every protected request.
- **Session**: A signed-in state bound to a user account, carrying that account's role and whether the second factor has been satisfied. Terminable by the user and invalidated when the underlying account is disabled or has its factor reset.
- **Audit record**: An immutable record of a security-relevant or content-changing action, attributing it to a user account at a point in time. Must survive migration with attribution intact.
- **Content entry, content version, media asset, case study facet, webhook endpoint**: Existing collections carrying no authentication concern but participating in the database migration, and related to user accounts through authorship and audit attribution.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of accounts successfully sign in after cutover by completing the documented one-time step — set a new password, enrol a second factor — with no individual engineering assistance.
- **SC-002**: Zero paths exist by which an administrator function can be reached without a satisfied second factor, verified by explicit negative testing of every administrative route.
- **SC-002a**: From the bootstrap state of FR-029, every administrative route other than enrolment is verified unreachable, including by direct navigation. Zero exceptions.
- **SC-003**: A user completes second-factor enrolment in under two minutes by scanning a code, with no manual transcription of a secret required.
- **SC-004**: Every one of the seven collections can be written to and read back through the application on the new database, with all relationships resolving correctly — verified by exercising each collection at least once before cutover.
- **SC-005**: The public marketing site serves content with zero downtime across the cutover window.
- **SC-006**: Account recovery requests consume zero engineering time, down from requiring direct database intervention today.
- **SC-007**: The team no longer maintains in-house password hashing, session issuance, or one-time-code verification logic.
- **SC-008**: Rollback is demonstrated at least once and completes by configuration change and redeployment alone, with no data restore step and no data loss.
- **SC-009**: Recovery documentation is accurate — an operator unfamiliar with the change can restore the system by following it, with no references to the retired procedure remaining.

## Assumptions

- **Nothing is carried over — the new database is created from scratch**: Confirmed by the requester on 2026-07-18: the existing database holds no content worth keeping, as development had only just begun. This is the single most consequential assumption in this specification. It is why FR-028 (forced password reset) is cheap, why User Story 3 is withdrawn, why there is no identity remapping, and why rollback needs no data restore. *If this turns out to be inaccurate — if any authored content, media metadata or audit history matters — stop and revisit, because the plan discards all of it.*
- **Media files outlive their metadata**: Media binaries live with the CDN provider, not in the database; only metadata rows are discarded. Those files therefore survive as orphans with no reference. FR-028a exists so this is a measured quantity rather than an unbounded surprise.
- **Scope of SSO**: Single sign-on is a future motivation, not part of this work. The chosen approach must not preclude it, but no SSO capability is delivered here.
- **Preview tokens are out of scope**: Signed preview-link tokens are not user authentication and remain as they are, unchanged by this migration.
- **Cutover downtime is acceptable**: A planned CMS maintenance window is tolerable because the public marketing site serves pre-built content independently (`docs/handover.md`: *"The site keeps serving its last-built content while the CMS is briefly unavailable"*). The CMS has a small internal editor population, so a stop-the-world cutover is preferred over a dual-running arrangement.
- **Second factors cannot be carried over**: One-time-code secrets cannot be transferred into the new provider. Moot in practice now that no accounts are carried over at all, but recorded because it would bind if this decision were ever revisited.
- **Identity key strategy is resolved**: User records are keyed on the identity provider's identifier, per the provider's documented pattern. Deciding this was cheap precisely because there is no existing data to remap — the condition under which the better long-term shape should be chosen over the cheaper one.
- **Existing roles map directly**: The current administrator/editor split maps one-to-one onto the new model; no new roles are introduced.
- **Email delivery already exists**: A transactional email provider is already a dependency of this project and is assumed available for invitations and recovery messages.
- **Verification environment**: The new schema can be exercised against a non-production project before cutover. With no data to copy, this is a fresh empty database rather than a restored replica.

## Dependencies & Risks

- **Deploy gate**: Production deploys for this project require the HEAD commit author to be a specific address (`docs/handover.md`), or the deploy is blocked. The current repository git identity does not match. This must be resolved before cutover or the migration cannot ship.
- **Recovery runbook is provider-specific**: The documented restore procedure depends on the outgoing database provider's branching feature. Until FR-027 is satisfied, the system is in a window where the written recovery procedure does not match reality.
- **Uncommitted work in progress**: The working tree currently carries substantial uncommitted modifications across authentication, UI and configuration files. These should be resolved before a migration of this blast radius begins.
- **The discard is irreversible in one direction only**: Creating the new database from scratch is safe *because* the old one is left untouched — that is what makes rollback a configuration change. This holds only as long as the previous database is not decommissioned during the rollback window (FR-023). Decommissioning it early converts a reversible cutover into an irreversible one.
- **Backup posture regresses on the free tier**: The outgoing provider supplies managed point-in-time restore; the incoming one supplies none at all on its free tier. This does not block cutover now that no data is at stake, but it becomes the operating reality the moment real content exists. It should be settled before the CMS carries anything anyone would miss.
- **The bootstrap state is the sharpest edge**: FR-029 deliberately opens a narrow path that permits a password-only sign-in. It is the one place in this design where the mandatory-second-factor property is intentionally relaxed, so it warrants the most rigorous negative testing (US2 scenarios 7–9) — every administrative surface must be verified unreachable from that state, not just the obvious ones.
