---
description: "Task list for Content Editor Improvements"
---

# Tasks: Content Editor Improvements

**Input**: Design documents from `specs/002-content-editor-improvements/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/editor-contracts.md, quickstart.md

**Tests**: Only one unit test is included — the pure auto-save scheduler (`lib/content/autosave.ts`), as called out in the plan. The rest is validated via `quickstart.md` (backend is unchanged, so no contract/integration tests are added).

**Organization**: Tasks grouped by user story. All three stories touch the same shared file `components/ContentEditor.tsx`, so they are **not** file-parallel with each other despite being independently testable — see Dependencies.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: US1 / US2 / US3

## Path Conventions

Next.js single app at repo root: `components/`, `lib/content/`, `tests/unit/`. API routes under `app/api/admin/[type]/[id]/` are reused unchanged.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm baseline; no new dependencies are required (Quill already added in a prior feature).

- [x] T001 Verify baseline is green before starting: run `npx tsc --noEmit`, `npx vitest run`, and `npm run build`; note no new npm dependencies are needed for this feature.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: A reusable draft-save path used by BOTH the restore flow (US1) and auto-save (US2).

**⚠️ CRITICAL**: US1 and US2 depend on this. US3 does not.

- [x] T002 Refactor `save()` in `components/ContentEditor.tsx` into a reusable `saveDraft(): Promise<{ ok: boolean; conflict?: boolean }>` that: builds/validates the payload, respects a single shared in-flight guard (generalize the existing `busy`), sends the PUT with `expectedVersionId`, and on success updates `versionId`/`status`/`dirty` and returns the outcome. The existing "Save draft" button calls this; behavior for the manual path must be unchanged.
- [x] T003 In `components/ContentEditor.tsx`, ensure every write reads and refreshes the concurrency token (`versionId`) from the response so manual save, auto-save, and restore never raise a false 409 against each other (contract C3).

**Checkpoint**: Manual save still works exactly as before, now via `saveDraft()`.

---

## Phase 3: User Story 1 - Restore a previous version (Priority: P1) 🎯 MVP

**Goal**: From the edit screen, list saved versions and restore one; if there are unsaved changes, save them first so nothing on screen is lost.

**Independent Test**: On an entry with ≥2 versions, open history and restore an older one; content updates and a new version is recorded. With unsaved edits present, restoring first saves them as a version (quickstart Scenario 1 / 1b).

### Implementation for User Story 1

- [x] T004 [P] [US1] Create `components/VersionHistory.tsx`: a modal/panel that fetches `GET /api/admin/{type}/{id}/versions`, renders versions newest-first (save time, author email, status-at-save), shows loading/empty/error states, and exposes an `onRestore(versionId)` callback and an `onClose`. Reuse the existing `Modal`/`Feedback` UI primitives.
- [x] T005 [US1] In `components/ContentEditor.tsx`, add a `revision` counter to state and use it as part of the React `key` on each rendered field wrapper so uncontrolled editors (Quill) and inputs re-initialize when it changes (per research R1).
- [x] T006 [US1] In `components/ContentEditor.tsx`, implement `restoreVersion(versionId)`: if `dirty`, call `saveDraft()` first and abort on failure (surface the error, keep on-screen work); then `POST /api/admin/{type}/{id}/restore` with `{ versionId }`; on success apply the returned entry's `data`, set `versionId` from `currentVersionId`, bump `revision`, clear `dirty`, and show a success message (contract C1).
- [x] T007 [US1] In `components/ContentEditor.tsx`, add a "Version history" button in the editor header (only when an `id` exists) that opens `VersionHistory`, wiring its `onRestore` to `restoreVersion` and closing the panel on success.
- [x] T008 [US1] Handle restore edge cases in `components/ContentEditor.tsx`/`VersionHistory.tsx`: entry with no versions shows an empty state; restore honoring the concurrency guard surfaces the existing conflict message; disable the restore/save controls while a write is in flight.

**Checkpoint**: Version restore is fully usable and safe with unsaved changes. **MVP deliverable.**

---

## Phase 4: User Story 2 - Automatic draft saving (Priority: P2)

**Goal**: Save the draft automatically ~10s after the last change and on field blur, coordinated with manual save.

**Independent Test**: Edit and pause ~10s → auto-saves; edit and blur → saves immediately; rapid typing coalesces to one save; manual save during a pending debounce yields a single write (quickstart Scenario 2).

### Tests for User Story 2

- [x] T009 [P] [US2] Write `tests/unit/autosave.test.ts` (Vitest, fake timers): a change schedules a save after the debounce; further changes coalesce/reset the window; blur flushes immediately; no save fires when not dirty, when there is no entry id, or when a save is already in flight.

### Implementation for User Story 2

- [x] T010 [P] [US2] Create `lib/content/autosave.ts`: a framework-agnostic scheduler holding the debounce delay (~10s), a coalescing timer, and a `shouldSave({ dirty, hasId, inFlight, payloadValid })` predicate. No DOM/network access, so it is unit-testable. (Satisfies T009.)
- [x] T011 [US2] Integrate auto-save into `components/ContentEditor.tsx`: on `set()` (field change) start/reset the debounce; call `saveDraft()` when the timer elapses and `shouldSave(...)` is true (skip for new/unsaved entries and invalid payloads).
- [x] T012 [US2] Add blur-triggered flush in `components/ContentEditor.tsx`: when focus leaves an edited field (including the rich-text editors), flush a pending save immediately via `saveDraft()`.
- [x] T013 [US2] Auto-save failure handling in `components/ContentEditor.tsx`: on 409/422/network, surface the existing message, keep on-screen work, and pause the timer until the next change (contract C2); confirm the "unsaved changes" indicator clears on success and reappears on new edits (FR-013).
- [x] T014 [US2] Clear any pending auto-save timer on unmount and before manual save/restore to guarantee a single coherent write (FR-011/FR-012).

**Checkpoint**: Auto-save works alongside manual save and restore with no duplicate/conflicting writes.

---

## Phase 5: User Story 3 - Taller rich-text editors (Priority: P3)

**Goal**: Give the WYSIWYG editors more default editable height.

**Independent Test**: Open a form with rich-text fields; the editable area is visibly taller, still grows with content, and layout/action bar stay intact on a narrow window (quickstart Scenario 3).

### Implementation for User Story 3

- [x] T015 [P] [US3] In `components/RichTextEditor.tsx`, increase the default editable min-height (e.g. a `min-h-*` on the Quill container / `.ql-editor`), keeping it a min-height so content still auto-grows and small viewports remain usable (research R5, FR-016/FR-017).

**Checkpoint**: Editors are more comfortable to write in; no layout regressions.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [x] T016 Run `tests/unit/autosave.test.ts` and the full `npx vitest run`; ensure green.
- [x] T017 Run `npx tsc --noEmit`, `npx eslint components/ContentEditor.tsx components/RichTextEditor.tsx components/VersionHistory.tsx lib/content/autosave.ts`, and `npm run build`; fix any issues.
- [ ] T018 Execute `quickstart.md` Scenarios 1, 1b, 2, and 3 manually against `npm run dev` and confirm expected outcomes.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: no dependencies.
- **Foundational (Phase 2)**: after Setup. **Blocks US1 and US2** (both use `saveDraft()`). Does **not** block US3.
- **US1 (Phase 3)**: after Foundational.
- **US2 (Phase 4)**: after Foundational.
- **US3 (Phase 5)**: after Setup only — independent of everything else.
- **Polish (Phase 6)**: after the stories you intend to ship.

### User Story Dependencies

- **US1 (P1)**: needs T002/T003. Independently testable.
- **US2 (P2)**: needs T002/T003. Independently testable. Independent of US1.
- **US3 (P3)**: no dependency on US1/US2. Independently testable.

### File-contention note (important)

US1, US2, and US3 all edit `components/ContentEditor.tsx` (US3 also `RichTextEditor.tsx`). Tasks that touch the same file are **sequential**, not parallel, even across stories. The `[P]` markers reflect this: only new/separate files are marked `[P]`.

### Parallel Opportunities

- **T004** (`VersionHistory.tsx`), **T010** (`lib/content/autosave.ts`), **T009** (`tests/unit/autosave.test.ts`), and **T015** (`RichTextEditor.tsx`) are in distinct files and can be built in parallel with each other.
- The integration tasks that edit `ContentEditor.tsx` (T005–T008, T011–T014) must be serialized.

---

## Parallel Example: independent files

```bash
# These live in separate files and can be worked on concurrently:
Task: "Create components/VersionHistory.tsx"            # T004 [US1]
Task: "Create lib/content/autosave.ts"                  # T010 [US2]
Task: "Write tests/unit/autosave.test.ts"               # T009 [US2]
Task: "Raise min-height in components/RichTextEditor.tsx" # T015 [US3]
```

---

## Implementation Strategy

### MVP First (User Story 1 only)

1. Phase 1 Setup → Phase 2 Foundational → Phase 3 US1.
2. **STOP and VALIDATE** with quickstart Scenario 1 / 1b. Ship restore as the MVP.

### Incremental Delivery

1. Foundation ready (Phase 1–2).
2. Add US1 (restore) → validate → ship.
3. Add US2 (auto-save) → validate → ship.
4. Add US3 (taller editors) → validate → ship.

Each story is a standalone increment; US3 can even ship first since it is fully independent and low-risk.

---

## Notes

- `[P]` = different files, no dependencies.
- Backend (`entries.ts`, API routes, DB schema) is unchanged — no migration.
- Commit after each task or logical group.
- Verify the auto-save unit test fails before implementing `autosave.ts`, then make it pass.
