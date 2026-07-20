# Feature Specification: Content Editor Improvements

**Feature Branch**: `002-content-editor-improvements`

**Created**: 2026-07-20

**Status**: Draft

**Input**: User description: "Melhorias na tela de edição de conteúdo do CMS (ContentEditor): restaurar versão anterior sem perder o progresso não salvo; aumentar a altura dos campos multilinha; salvamento automático de rascunho ao trocar o foco (blur) ou por tempo (a cada 10s após mudança)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Restore a previous version from the edit screen (Priority: P1)

An editor is working on a content entry (e.g. a case study at `/cases/[id]`) and realizes a recent change was a mistake, or wants to bring back wording from an earlier save. From the edit screen they open the list of previously saved versions, review them, and restore the one they want. The editor's currently-visible, unsaved work is never silently discarded: if there are unsaved changes on screen, the system makes the editor explicitly decide before replacing them.

**Why this priority**: This is the primary request and it is safety-critical — the whole point is recovering good work without destroying current work. The version data already exists in the backend but is unreachable from the UI, so this unlocks stranded value.

**Independent Test**: Open an entry that has at least two saved versions, open the version list, restore an older one, and confirm the editor now shows the restored content and a new version was recorded — while verifying that unsaved on-screen edits triggered a confirmation step first.

**Acceptance Scenarios**:

1. **Given** an entry with multiple saved versions and no unsaved changes on screen, **When** the editor opens the version list and restores an older version, **Then** the editor content updates to that version and the change is recorded as a new version (the restore does not delete history).
2. **Given** an entry with unsaved changes on screen, **When** the editor restores a version, **Then** the system first saves the current on-screen state as a new draft version, and only then applies the restore — so no on-screen work is lost.
3. **Given** the version list is open, **When** the editor views an entry, **Then** each version shows enough context to choose (at minimum: when it was saved, who saved it, and the status at save time).
4. **Given** a restore has completed, **When** the editor looks at the screen, **Then** a confirmation message is shown and the concurrency state is updated so the next manual/auto save does not raise a false conflict.

---

### User Story 2 - Automatic draft saving (Priority: P2)

While editing, the editor's changes are saved as a draft automatically, without them needing to remember to click "Save draft". Saving happens shortly after they stop typing (a short delay after the last change) and also when they move focus away from a field. The manual "Save draft" button still works, and the "unsaved changes" indicator reflects reality (it clears once an auto-save succeeds and reappears when new edits are made).

**Why this priority**: Prevents accidental loss of work and reduces friction, but the manual save already provides a working path, so it ranks below restoring lost work.

**Independent Test**: Edit a field, stop typing, and confirm a draft save occurs automatically within the expected delay; separately, edit a field and move focus elsewhere and confirm a save occurs; confirm the "unsaved changes" indicator clears on success and no duplicate/competing saves occur alongside a manual save.

**Acceptance Scenarios**:

1. **Given** the editor makes a change to a field, **When** roughly 10 seconds pass with no further changes, **Then** the draft is saved automatically.
2. **Given** the editor makes a change and then moves focus out of the field, **When** focus leaves, **Then** the draft is saved automatically (without waiting for the timer).
3. **Given** an auto-save is pending (timer running), **When** the editor clicks "Save draft" manually, **Then** only one save takes effect and no redundant or conflicting save is issued.
4. **Given** an auto-save is in progress, **When** the concurrency guard reports the entry changed elsewhere, **Then** the editor is shown the existing conflict message and auto-saving pauses instead of silently overwriting.
5. **Given** an auto-save succeeds, **When** it completes, **Then** the "unsaved changes" indicator clears; **and Given** the editor edits again, **Then** the indicator reappears.
6. **Given** the editor has unsaved edits, **When** they leave/reload the page before a save, **Then** the existing "you have unsaved changes" browser warning still applies until a save (manual or auto) succeeds.

---

### User Story 3 - More comfortable multiline fields (Priority: P3)

Multiline input areas in the editor are a bit taller by default, giving editors more visible room to read and write longer passages without excessive scrolling inside a small box.

**Why this priority**: Pure comfort/usability polish with no data or safety impact; lowest risk and lowest urgency.

**Independent Test**: Open an editor form containing multiline fields and confirm the default visible height is larger than before, without breaking layout on smaller screens.

**Acceptance Scenarios**:

1. **Given** an editor opens a form with rich-text editor fields, **When** the form renders, **Then** those editors show more default editable height than the current baseline.
2. **Given** the taller editors, **When** viewed on a smaller viewport, **Then** the layout remains usable and the action bar remains reachable.

This applies to the rich-text (WYSIWYG) editor fields — the ones editors use to write the main content.

---

### Edge Cases

- **Restore of an entry with no prior versions**: the version list should communicate that there is nothing to restore rather than showing an empty/broken control.
- **Auto-save on a brand-new, never-saved entry**: see Assumptions — auto-save engages only once the entry exists (has an identifier); the first creation is done via the manual save.
- **Auto-save while a manual save or restore is already in flight**: overlapping writes must be coordinated so only one write is applied and the concurrency token stays correct.
- **Auto-save produces a validation error** (e.g. a required field temporarily empty): the draft save should surface the issue without blocking continued editing, and without spamming repeated error saves.
- **Rapid typing**: many keystrokes in a short window must not each trigger a save; saving is coalesced.
- **Restore conflict**: if the entry was changed elsewhere since the screen loaded, restoring must respect the same concurrency protection as a normal save.
- **Network offline during auto-save**: the editor keeps the work on screen and indicates the save did not complete, retrying on the next trigger.

## Requirements *(mandatory)*

### Functional Requirements

#### Version restore (US1)

- **FR-001**: The edit screen MUST provide a way to view the list of saved versions for the current entry, showing at least the save time, the author, and the status at save time, ordered newest first.
- **FR-002**: The editor MUST be able to restore a selected previous version from the edit screen.
- **FR-003**: Restoring MUST preserve version history — the current state is not lost, and the restore itself is recorded as a new version.
- **FR-004**: If the edit screen has unsaved changes when a restore is requested, the system MUST first save the current on-screen state as a new draft version, and only then apply the restore — so on-screen work is never lost.
- **FR-005**: After a successful restore, the edit screen MUST reflect the restored content and update its concurrency state so a subsequent save does not raise a false conflict.
- **FR-006**: Restore MUST honor the existing concurrency protection and refuse to proceed on a stale entry with a clear message.
- **FR-007**: Version viewing and restore MUST be available for all content types edited through the shared editor (collection types and singleton pages).

#### Auto-save (US2)

- **FR-008**: The system MUST automatically save the current draft after a change when the editor pauses editing, using a delay of approximately 10 seconds after the last change.
- **FR-009**: The system MUST automatically save the current draft when focus leaves an edited field, without waiting for the timer.
- **FR-010**: Auto-save MUST coalesce rapid successive edits into a single save rather than one save per keystroke.
- **FR-011**: Auto-save MUST NOT run concurrently with a manual save or a restore; overlapping triggers MUST result in a single coherent write and a correct concurrency token afterward.
- **FR-012**: The manual "Save draft" action MUST continue to work unchanged and MUST interoperate cleanly with auto-save (no double writes, no lost edits).
- **FR-013**: The "unsaved changes" indicator MUST clear when a save (manual or auto) succeeds and MUST reappear when new edits are made.
- **FR-014**: On an auto-save failure (concurrency conflict, validation error, or network error), the system MUST inform the editor, keep the on-screen work intact, and avoid repeated failing saves in a tight loop.
- **FR-015**: Auto-save MUST respect the existing draft-save semantics (it saves a draft; it does not publish).

#### Multiline field height (US3)

- **FR-016**: The rich-text (WYSIWYG) editor fields MUST render with a taller default editable height than the current baseline.
- **FR-017**: The increased height MUST NOT break form layout or hide the action controls on smaller viewports.

### Key Entities *(include if feature involves data)*

- **Content Entry**: the item being edited (case, solution, person, region, insight, or a singleton page). Has a current draft state, a published/draft status, and a concurrency token identifying the latest saved version.
- **Content Version**: an immutable snapshot of an entry's data at a save point, with an author, a timestamp, and the status at save time. Versions are what the editor browses and restores.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: An editor can restore a previous version from the edit screen in under 30 seconds and 3 interactions or fewer, without leaving the page.
- **SC-002**: In 100% of restore attempts where unsaved on-screen changes exist, the editor is prompted to decide before those changes are replaced (no silent loss).
- **SC-003**: After an editor stops typing, their work is persisted as a draft within ~10 seconds without any manual action, in at least 95% of editing sessions.
- **SC-004**: Moving focus away from an edited field results in a saved draft before the timer would have fired, in 100% of cases where a change was made.
- **SC-005**: Zero incidents of auto-save and manual save producing duplicate or conflicting writes during normal editing.
- **SC-006**: Support/user reports of "I lost my edits in the CMS editor" trend to zero after release.
- **SC-007**: Editors report the multiline fields provide adequate writing space (qualitative check / no complaints about cramped fields).

## Assumptions

- **Existing backend reused**: Version listing and restore already exist server-side (list versions, restore version, and their admin routes); this feature adds the editor UI and wiring, not new persistence mechanisms.
- **Concurrency model reused**: Saves (manual and auto) and restores use the existing optimistic-concurrency token (expected version) already enforced by the editor and API.
- **Auto-save targets existing entries**: Auto-save engages once an entry exists (has an identifier). For a brand-new entry, the first save that creates the entry is the manual "Save draft"; after creation, auto-save takes over. This avoids creating empty drafts from incidental focus/typing.
- **Draft only**: Auto-save and restore operate on drafts; publishing remains an explicit, separate action.
- **Auto-save delay**: "By time" is interpreted as ~10 seconds of inactivity after the last change (debounced), as suggested by the request; this is a tunable default, not a hard contractual value.
- **Scope**: Applies to the shared content editor across all content types. It does not change unrelated screens (media library, users) or the public read API.
