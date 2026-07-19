# Specification Quality Checklist: Supabase Auth Migration

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-07-18
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

## Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Success criteria are technology-agnostic (no implementation details)
- [x] All acceptance scenarios are defined
- [x] Edge cases are identified
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

## Feature Readiness

- [x] All functional requirements have clear acceptance criteria
- [x] User scenarios cover primary flows
- [x] Feature meets measurable outcomes defined in Success Criteria
- [x] No implementation details leak into specification

**All 16 items pass.** Specification is ready for `/speckit-plan`.

## Notes

### Resolved clarifications

- **FR-028** — forced password reset at cutover; existing credentials are not carried over. Chosen
  because there is no established user population, making credential preservation near-worthless.
  Cutover is a single disruption: set password + enrol second factor.
- **FR-029** — account-level bootstrap state. An administrator with no factor enrolled may sign in
  with a password *solely* to reach enrolment. Expanded into FR-030 (must be an account property,
  not a time-boxed or environment-wide exception, so it serves future admins too) and FR-031
  (bootstrap entry/exit is audited).

### Requirements added during resolution

FR-030, FR-031, US2 scenarios 7–9, and SC-002a were not in the original draft. They exist because
FR-029 deliberately opens a narrow password-only path — the one place this design relaxes the
mandatory-second-factor property. That path needs to be bounded (FR-030), observable (FR-031), and
verified closed on every other surface (SC-002a, US2 scenarios 8–9).

### Deliberate omissions

- **Identity key strategy** (re-key to provider identifier vs. retain current identifier with a
  reference) was not raised as a clarification. It is a technical decision belonging to the planning
  phase; the spec instead binds the outcomes that must hold either way — FR-019 and FR-021, audit
  attribution and relationship integrity.
- **Provider naming** is confined to the Input line. Requirements are written against "a managed
  identity provider" so they remain testable if the provider choice is revisited during planning.

### Revision 2026-07-18 — database created from scratch

The requester confirmed the existing database holds no content worth keeping (development had only
just begun) and authorised creating the new database from scratch rather than migrating.

Consequences recorded across the artifacts:

- **User Story 3 withdrawn** (content/audit survive the move). Numbering preserved rather than
  compacted so cross-references stay valid.
- **FR-020…FR-023 rewritten** from data-migration guarantees into provisioning requirements.
  FR-023 now protects the *old* database instead: it must stay alive and readable for the rollback
  window, because that is what keeps rollback reversible.
- **FR-019 reframed** from "preserve audit across the migration" to ongoing retention when a user is
  deleted. The design it anchors — `on delete set null` plus an `actor_email` snapshot — still
  matters, and is now the most important assertion in quickstart Scenario 4.
- **FR-028a added** — orphaned media. Binaries live with the CDN, so discarding metadata rows leaves
  files in storage with nothing referencing them.
- **SC-004 and SC-008 rewritten**; **research D11, D12 and risk R2 revised**; **data-model identity
  remapping removed**; **quickstart Scenarios 4 and 7 rewritten**.

This is the largest single reduction in risk across the whole plan: no data transfer, no remap
across five foreign keys, no write-freeze, no point of no return.

**The assumption this all rests on**: that the discarded database truly holds nothing of value. It
was confirmed verbally, not verified against the database. If any authored content, media metadata
or audit history turns out to matter, stop — the plan discards all of it.

### Constitution

`.specify/memory/constitution.md` is an unfilled template — no project principles were available to
check this specification against. No governance gates were evaluated.
