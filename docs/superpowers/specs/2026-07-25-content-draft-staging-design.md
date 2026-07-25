# Content draft/publish staging — design

**Date:** 2026-07-25
**Branch:** `feat/content-draft-staging`
**Status:** approved (design), pending implementation plan

## Problem

Every content entry is a single `content_entries` row with one `data` blob and
one `status` (`draft` | `published`). Saving an entry writes `data` and never
touches `status`. So on a **published** entry:

- Clicking **"Save draft"** overwrites the row the public read API serves — the
  change goes live immediately, despite the "draft" label.
- Worse, the editor auto-saves every ~10s silently, so editing a published page
  publishes changes live without the author intending to.

The button set (`Save draft` + `Publish`/`Unpublish`) also implies a staging
model that does not exist: there is no way to save edits to a published entry
without affecting the live site, and no explicit "update the live content"
action.

## Goal

Introduce a real staging model: a published entry keeps a frozen public
snapshot while the author edits a working copy. Edits are saved as a draft and
do **not** reach the site until the author explicitly publishes them.

## Approach (chosen)

**Approach A — `published_data` snapshot column.**

`data` stays the **working copy** (what the editor and the admin list already
read — unchanged). A new `published_data` column holds the **snapshot the public
read API serves**. Publishing copies `data` → `published_data`. A
`has_unpublished_changes` flag drives the "unpublished changes" UI.

Rejected alternative — **Approach B (`published_version_id` pointer into
`content_versions`)**: no data duplication, but forces a join into the published
version on every public read/list and still needs facets snapshotted at publish
time. More query surgery for the same semantics. Approach A keeps public
list/order/facet queries on the same table with no joins.

## Schema changes

`content_entries` gains two columns (drizzle migration `0005`):

- `published_data jsonb NULL` — public snapshot. `NULL` = never published.
- `has_unpublished_changes boolean NOT NULL DEFAULT false` — drives the UI badge
  and the `Publish changes` button.

**Backfill** in the same migration so nothing already live changes:

```sql
UPDATE content_entries SET published_data = data WHERE status = 'published';
```

`content_versions` and `case_study_facets` are unchanged structurally.

## Service layer (`lib/content/entries.ts`)

- **`createEntry`** — `published_data` is `NULL`, `has_unpublished_changes`
  `false` (new entries start as drafts). Facet row creation is deferred to
  publish (a never-published entry is never served, so its facets are unused).
- **`updateEntry` (Save draft)** — still writes `data` + a `content_versions`
  row. **New:** when the entry's current status is `published`, set
  `has_unpublished_changes = true`. **Removed:** the `case_study_facets` upsert
  (facets now belong to publish, so they reflect the published snapshot, not
  draft edits).
- **`publishEntry`** — runs the existing publish gate (required fields +
  referenced media exist) against the working copy `data`. On success:
  `published_data = data`, `status = 'published'`, `published_at = now()`,
  `has_unpublished_changes = false`, and upsert `case_study_facets` from the
  snapshot. Still writes a `content_versions` row with `status_at_save =
  'published'`.
- **`unpublishEntry`** — `status = 'draft'` (public read stops via the status
  filter). `published_data` is retained so a later re-publish is possible;
  `has_unpublished_changes` is reset to `false` (the draft state ignores it).

## Public read layer (`lib/content/published.ts`)

- `getPublished`, `listPublished`, `listPublishedCases` serve **`published_data`**
  instead of `data`. For published rows `published_data` is always set (backfill
  + publish guarantee it).
- `serializeEntry` is refactored to take the data blob explicitly, so the
  published path passes `published_data` and the draft **preview** path keeps
  passing `data` (preview shows the working copy — the staged, not-yet-live
  content).
- `case_study_facets` already backs faceted filtering; since it is now written
  only at publish, public filters reflect published content.

## API contracts

`PUT /api/admin/[type]/[id]`, `.../publish`, and `.../unpublish` responses add
`hasUnpublishedChanges` alongside `status`, so the editor can update the button
set and banner without a refetch.

## Editor UI (`components/ContentEditor.tsx`)

Button states in the sticky action bar, driven by `(status,
hasUnpublishedChanges)`:

| State | Condition | Badge | Buttons |
|-------|-----------|-------|---------|
| Draft / new | `status !== 'published'` | — | `Save draft` (secondary) · `Publish` (primary) |
| Published, clean | `published` & `!hasUnpublishedChanges` | `● Live` | `Save draft` (secondary) · `Unpublish` (secondary) |
| Published, pending | `published` & `hasUnpublishedChanges` | `⚠ Unpublished changes` | `Save draft` (secondary) · **`Publish changes`** (primary, emphasised) · `Unpublish` (secondary) |

Banner in the pending state: *"You have unpublished changes — the site still
shows the last published version."*

Flow: open a published page → **clean**. Edit a field → auto-save (or manual
`Save draft`) stores the working copy **without touching the site** → **pending**
(`Publish changes` + banner appear). `Preview` shows the working copy. Click
`Publish changes` → site updates, flag clears, back to **clean**.

- **Trigger for `Publish changes`:** appears once a modification is **saved to
  the draft** (auto-save ~10s or manual `Save draft`) — not on the first
  keystroke. So publishing always publishes exactly what is saved.
- **Auto-save** is unchanged in cadence but now safe: it only ever writes the
  working copy, never the live snapshot.
- The local `dirty` flag (unsaved-in-browser) is distinct from the server
  `has_unpublished_changes` flag (saved-to-draft-but-not-live); the badge/banner
  use the server flag.

## Decisions taken with defaults (flag on review if unwanted)

- Include the status badge (`● Live` / `⚠ Unpublished changes`).
- Labels stay in English to match the rest of the admin.

## Testing (integration, using the existing test DB harness)

- Editing a published entry does **not** change `published_data` (public read
  still returns the previous content) and sets `has_unpublished_changes`.
- `publishEntry` copies `data` → `published_data`, clears the flag, and updates
  facets.
- Public case facets reflect published data, not a draft edit that changed
  facet fields.
- A never-published draft has `published_data = NULL`; publishing populates it.
- `unpublishEntry` stops public serving.
- Read layer: after edit-then-read the public detail/list is stale; after
  publish it reflects the new content.

## Out of scope

- Cache/revalidation on the public consumer site (separate repo).
- The inline-YouTube-video work (separate branch `feat/inline-youtube-video`).
- Scheduled publishing / publish approvals / multi-step review.
