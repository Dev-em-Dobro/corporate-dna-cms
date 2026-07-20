# Quickstart / Validation Guide: Content Editor Improvements

How to validate the three improvements end-to-end. See [contracts/editor-contracts.md](./contracts/editor-contracts.md) and [data-model.md](./data-model.md) for details.

## Prerequisites

- App running locally (`npm run dev`) and signed in to the admin.
- At least one content entry that already has **two or more saved versions** (edit and Save draft a couple of times to create history).

## Automated checks

```bash
npx vitest run tests/unit/autosave.test.ts   # auto-save scheduling logic
npx tsc --noEmit                              # types
npx eslint components/ContentEditor.tsx components/RichTextEditor.tsx components/VersionHistory.tsx lib/content/autosave.ts
npm run build                                 # SSR-safe build
```

## Scenario 1 — Restore a previous version (US1)

1. Open an entry, e.g. `/cases/{id}`, with no unsaved changes.
2. Open the version history panel; confirm it lists versions newest-first with save time, author, and status.
3. Restore an older version.
4. **Expect**: the editor content (including rich-text fields) updates to that version; a success message appears; a new version now tops the list (history preserved).

### 1b — Restore with unsaved changes (FR-004)

1. Make an edit but do **not** save.
2. Restore a different version.
3. **Expect**: the current on-screen work is saved as a new version first, then the chosen version is restored — nothing typed is lost (verify the pre-restore state appears in the version list).

## Scenario 2 — Auto-save (US2)

1. Open an existing entry and edit a field.
2. Stop typing and wait ~10s.
3. **Expect**: the draft saves automatically; the "unsaved changes" indicator clears.
4. Edit another field and immediately click/tab away (blur).
5. **Expect**: a save fires without waiting for the timer.
6. Type rapidly for a few seconds.
7. **Expect**: only one save fires after you pause (edits coalesced), never one-per-keystroke.
8. While a debounce is pending, click **Save draft** manually.
9. **Expect**: a single save takes effect; no duplicate/conflicting write; token stays valid (a subsequent save does not 409).
10. **New entry**: on a brand-new, unsaved entry, editing does **not** auto-create it; the first manual Save draft creates it, then auto-save engages.

## Scenario 3 — Taller editors (US3)

1. Open any editor with rich-text fields.
2. **Expect**: the editable area is visibly taller by default than before, still grows with content, and the layout/action bar remain intact on a narrow window.

## Success mapping

| Scenario | Requirements | Success Criteria |
|----------|--------------|------------------|
| 1 / 1b | FR-001..FR-007 | SC-001, SC-002 |
| 2 | FR-008..FR-015 | SC-003, SC-004, SC-005, SC-006 |
| 3 | FR-016, FR-017 | SC-007 |
