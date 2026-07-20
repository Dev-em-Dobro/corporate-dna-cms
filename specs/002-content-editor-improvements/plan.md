# Implementation Plan: Content Editor Improvements

**Branch**: `002-content-editor-improvements` | **Date**: 2026-07-20 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/002-content-editor-improvements/spec.md`

## Summary

Three improvements to the shared admin content editor (`components/ContentEditor.tsx`), applied across all content types:

1. **Version restore UI** — surface the already-existing version history/restore backend inside the edit screen. When the screen has unsaved changes, save the current draft as a new version first, then restore (no on-screen loss).
2. **Auto-save** — persist the draft automatically ~10s after the last edit (debounced) and on field blur, coordinated with the manual "Save draft" button and the existing optimistic-concurrency token.
3. **Taller rich-text editors** — increase the default editable height of the Quill (WYSIWYG) fields.

The backend already provides everything needed (`listVersions`, `restoreVersion`, `updateEntry` and their routes). This feature is almost entirely client-side wiring plus UI, with **no schema or API changes**.

## Technical Context

**Language/Version**: TypeScript 5, React 19, Next.js 16 (App Router)

**Primary Dependencies**: React client components; existing admin API routes; Quill 2 (`components/RichTextEditor.tsx`, already added); Drizzle ORM (backend, unchanged)

**Storage**: PostgreSQL via Drizzle — `content_entries`, `content_versions` (both already exist; no migration)

**Testing**: Vitest (unit + integration). Unit tests for the auto-save scheduling logic and the restore-orchestration helper; existing integration tests remain DB-gated.

**Target Platform**: Web (admin CMS), modern browsers

**Project Type**: Web application (Next.js full-stack, single repo)

**Performance Goals**: Auto-save debounce ≈10s after last change; blur flush is immediate; UI stays responsive during saves (no blocking)

**Constraints**: Reuse the existing optimistic-concurrency mechanism (`expectedVersionId`); no new DB tables/columns; preserve current accessibility (labels, error summary, focus handling); auto-save must not publish, only save drafts

**Scale/Scope**: Small internal admin tool; a handful of concurrent editors; ~9 content types through one shared editor

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

The project constitution (`.specify/memory/constitution.md`) is an unratified template with no active principles, so there are no binding gates. Applying default good practice:

- **Simplicity / YAGNI**: PASS — reuses existing backend; adds only a small hook + one component; no new persistence.
- **No breaking changes**: PASS — manual save, publish, and the read API are untouched.
- **Test-first where it counts**: PASS — the pure scheduling/orchestration logic is extracted so it can be unit-tested without a DOM/DB.

No violations → Complexity Tracking left empty.

## Project Structure

### Documentation (this feature)

```text
specs/002-content-editor-improvements/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (consumed API contracts + client behaviors)
└── checklists/
    └── requirements.md  # From /speckit-specify
```

### Source Code (repository root)

```text
components/
├── ContentEditor.tsx        # MODIFY: integrate auto-save, restore flow, taller editors
├── RichTextEditor.tsx       # MODIFY: accept a height/min-height; remount-on-restore via key
└── VersionHistory.tsx       # NEW: modal/panel listing versions + restore action

lib/content/
├── autosave.ts              # NEW: pure debounce/scheduler + "should save" logic (unit-testable)
└── entries.ts               # UNCHANGED (listVersions/restoreVersion/updateEntry already exist)

app/api/admin/[type]/[id]/
├── route.ts                 # UNCHANGED (PUT update with expectedVersionId)
├── versions/route.ts        # UNCHANGED (GET versions)
└── restore/route.ts         # UNCHANGED (POST restore { versionId })

tests/unit/
├── autosave.test.ts         # NEW: scheduler triggers on timer/blur, coalescing, in-flight guard
└── ...                      # existing tests untouched
```

**Structure Decision**: Single Next.js app. The feature is delivered as client-side changes to the shared editor plus one new component and one small pure module. All server endpoints already exist and are reused as-is.

## Key implementation notes (carried into tasks)

- **Restore re-seeding**: `RichTextEditor` seeds content only on mount. After a restore replaces `data`, bump a `revision`/`key` on the field container so Quill (and any controlled inputs) re-initialize with the restored values. The restore response returns the full entry (including `currentVersionId`), so update the concurrency token from it.
- **Restore-with-unsaved (FR-004)**: orchestrate on the client — if `dirty`, run the normal save (PUT with `expectedVersionId`) to capture the on-screen draft as a version, then POST restore, then apply the restored entry + new token + revision bump.
- **Auto-save coordination (FR-011/FR-012)**: a single in-flight `saving` guard shared by manual save, auto-save, and restore. Auto-save is skipped when: not `dirty`, no entry `id` yet (new entry), a save is already in flight, or the payload is invalid (e.g. bad JSON field). On 409/422/network error, surface the existing message and stop the timer until the next explicit change.
- **Concurrency**: every write path sends `expectedVersionId` and updates it from the response, so auto-save/manual/restore never issue a false-conflict against each other.

## Complexity Tracking

> No constitution violations — not applicable.
