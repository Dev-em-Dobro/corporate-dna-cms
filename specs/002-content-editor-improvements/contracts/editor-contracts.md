# Contracts: Content Editor Improvements

All server endpoints already exist and are **consumed unchanged**. This documents the contracts the editor relies on, plus the new client-side behavior contracts.

## API endpoints consumed (existing)

### GET `/api/admin/{type}/{id}/versions`

List saved versions for an entry (newest first).

- **Auth**: session required.
- **Response 200**: `{ versions: [{ id, statusAtSave, createdAt, authorEmail }] }`
- **Errors**: 404 unknown content type; 401 unauthenticated.
- **Used by**: the version history panel (US1).

### POST `/api/admin/{type}/{id}/restore`

Restore a previous version.

- **Auth**: session required.
- **Request**: `{ versionId: string }`
- **Response 200**: the full updated entry, including `data`, `status`, and `currentVersionId` (the refreshed concurrency token).
- **Errors**: 422 missing `versionId`; 404 entry/version not found; 401.
- **Behavior**: writes a new version equal to the chosen snapshot and repoints `currentVersionId`. History preserved.
- **Used by**: restore action (US1).

### PUT `/api/admin/{type}/{id}`

Save a draft (existing manual save path; now also the auto-save path).

- **Auth**: session required.
- **Request**: `{ data: <fields>, expectedVersionId: <token> }`
- **Response 200**: updated entry incl. new `currentVersionId`.
- **Errors**: 422 `{ fields: {...} }` validation; 409 concurrency conflict (stale `expectedVersionId`); 401.
- **Used by**: manual save **and** auto-save (US2) — identical contract, so both refresh the token from the response.

## Client behavior contracts (new)

### C1 — Restore with unsaved changes (FR-004)

Given `dirty === true`, a restore MUST:
1. Perform a normal draft save (PUT with current `expectedVersionId`) → capture on-screen work as a version, refresh token.
2. POST restore with the chosen `versionId`.
3. Apply the restored entry to `data`, set `versionId` from the response, bump `revision` (remount editors), clear `dirty`, show success.

If step 1 fails (409/422/network), abort before restoring and surface the error; on-screen work stays intact.

### C2 — Auto-save scheduling (FR-008..FR-014)

- MUST fire a draft save ~10s after the last change (debounced; each change resets the window).
- MUST flush immediately on field blur when there is a pending change.
- MUST NOT fire when: `!dirty`, no entry `id`, a save is in flight, or the payload is invalid.
- MUST coalesce rapid edits into a single save.
- MUST update `versionId` from the response and clear `dirty` on success; reappear on next edit.
- On failure (409/422/network): surface the existing message and pause until the next explicit change.

### C3 — Save-path mutual exclusion (FR-011/FR-012)

Manual save, auto-save, and restore MUST share one in-flight guard so at most one write is applied at a time and the concurrency token remains coherent afterward.

### C4 — Taller editors (FR-016/FR-017)

Rich-text editor fields MUST render with an increased default editable **min-height** (content still grows), without breaking layout or hiding the action bar on small viewports.
