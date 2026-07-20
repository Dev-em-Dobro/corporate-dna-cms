# Phase 1 Data Model: Content Editor Improvements

**No database changes.** This feature reuses existing tables and adds only client-side state. Documented here for context.

## Persisted entities (existing — unchanged)

### Content Entry (`content_entries`)

The item being edited. Relevant fields:

- `id` — identifier.
- `type` — content type (`case`, `solution`, `person`, `region`, `insight`, `page_*`).
- `data` (JSONB) — the editable field values.
- `status` — `draft | published | archived`.
- `currentVersionId` — **the optimistic-concurrency token**; the version considered "current". Sent as `expectedVersionId` on writes and refreshed from responses.
- `updatedAt` / `updatedBy` — audit of last write.

### Content Version (`content_versions`)

An immutable snapshot created on each save/restore. Relevant fields:

- `id` — identifier (used as `versionId` when restoring).
- `entryId` — owning entry.
- `data` (JSONB) — snapshot of the entry data at save time.
- `statusAtSave` — status when the snapshot was taken.
- `authorId` → surfaced as `authorEmail` via join in `listVersions`.
- `createdAt` — when saved (list is ordered newest first).

**Restore semantics (existing)**: `restoreVersion` writes a *new* version whose data equals the chosen snapshot, then points `currentVersionId` at it. History is never destroyed; the restore is itself a recorded version.

## Client-side state (new / extended in `ContentEditor`)

| State | Purpose |
|-------|---------|
| `data` | Current on-screen field values (existing). |
| `versionId` | Current concurrency token, refreshed from every write response (existing; now also used by auto-save). |
| `dirty` | Unsaved-changes flag (existing); cleared on any successful save, set on edit. |
| `saving` | In-flight guard shared by manual save, auto-save, and restore (existing `busy`, generalized). |
| `revision` | **NEW** — counter bumped after a restore; used as a React `key` seed so uncontrolled editors (Quill) re-initialize with restored data. |
| `autosaveTimer` | **NEW** — handle for the debounced ~10s save; reset on each change, cleared on flush/unmount. |
| `versionsOpen` / `versions` | **NEW** — UI state for the version history panel and its loaded list. |

## Auto-save decision (pure logic — `lib/content/autosave.ts`)

Inputs → whether/when to fire a save:

- Fire only when: `dirty === true`, `id` exists (entry created), no save currently in flight, and the payload is valid.
- Coalesce: any new change resets the debounce window.
- Triggers: debounce elapsed (~10s) **or** field blur (immediate flush).

This module holds no DOM/network code so it can be unit-tested directly.
