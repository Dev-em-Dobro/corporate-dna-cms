# Content Draft/Publish Staging Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give published content entries a frozen public snapshot so authors can edit and save a working copy without the changes reaching the live site until they explicitly publish.

**Architecture:** Add `published_data` (the public snapshot) and `has_unpublished_changes` to `content_entries`. `data` stays the working copy the editor/admin use; the public read API serves `published_data`. `publishEntry` copies `data → published_data` and refreshes case facets from that snapshot; `updateEntry`/`restoreVersion` only mark `has_unpublished_changes` when the entry is published. The editor shows a `Publish changes` button + banner once a modification is saved to the draft.

**Tech Stack:** Next.js 16 (App Router), Drizzle ORM + Postgres (Supabase), Zod, Vitest (integration tests hit a dedicated test DB), Tailwind.

---

## File structure

- `db/schema/content.ts` — add the two columns to `contentEntries`.
- `db/migrations/0005_*.sql` (generated) — DDL + backfill.
- `lib/content/entries.ts` — `publishEntry`, `updateEntry`, `restoreVersion`, `unpublishEntry` behaviour.
- `lib/content/published.ts` — serve `published_data` (`serializeEntry`, `toListItem`, `getPublished`).
- `app/api/content/preview/[type]/[id]/route.ts` — keep previewing the working copy.
- `components/ContentEditor.tsx` — button states, badge, banner, state wiring.
- `app/(admin)/[collection]/[id]/page.tsx` and `app/(admin)/pages/[key]/page.tsx` — pass `hasUnpublishedChanges` into `initial`.
- Tests: `tests/integration/staging-*.test.ts` (new), modelled on `tests/integration/us1-publish-flow.test.ts`.

**API note:** the admin routes already return the full entry via `jsonOk(result.entry)`, so once the columns exist the responses carry `status` **and** `hasUnpublishedChanges` with no route-file changes. Only the editor client needs to read the new field.

---

## Task 1: Schema columns + migration + backfill

**Files:**
- Modify: `db/schema/content.ts:36-40`
- Create: `db/migrations/0005_*.sql` (via drizzle-kit), then hand-edit to add the backfill

- [ ] **Step 1: Add the two columns to the schema**

In `db/schema/content.ts`, inside the `contentEntries` column object, immediately after the `data` column (the block ending at line 39) add:

```ts
    // Frozen public snapshot. NULL until first publish. The public read API
    // serves THIS, not `data`, so editing a published entry never changes the
    // live site until the author re-publishes.
    publishedData: jsonb("published_data").$type<Record<string, unknown>>(),
    // True when `data` (working copy) has edits not yet copied into
    // `publishedData`. Drives the "Publish changes" button and the badge.
    hasUnpublishedChanges: boolean("has_unpublished_changes")
      .notNull()
      .default(false),
```

Add `boolean` to the `drizzle-orm/pg-core` import at the top of the file (line 2-10 block):

```ts
import {
  pgTable,
  uuid,
  text,
  jsonb,
  integer,
  boolean,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
```

- [ ] **Step 2: Generate the migration**

Run: `npm run db:generate`
Expected: a new file `db/migrations/0005_<random>.sql` is created adding two columns, and `db/migrations/meta/` is updated.

- [ ] **Step 3: Append the backfill to the generated migration**

Open the generated `db/migrations/0005_*.sql` and append (after the `ALTER TABLE` statements):

```sql
--> statement-breakpoint
UPDATE "content_entries" SET "published_data" = "data" WHERE "status" = 'published';
```

This makes every already-live entry keep serving its current content unchanged.

- [ ] **Step 4: Apply the migration**

Run: `npm run db:migrate`
Expected: migration `0005` applies with no error.

- [ ] **Step 5: Typecheck**

Run: `npm run typecheck`
Expected: no errors (the new columns are now part of `ContentEntry`).

- [ ] **Step 6: Commit**

```bash
git add db/schema/content.ts db/migrations
git commit -m "feat(content): add published_data snapshot + has_unpublished_changes columns"
```

---

## Task 2: `publishEntry` snapshots the working copy

**Files:**
- Modify: `lib/content/entries.ts:264-274` (the `publishEntry` update)
- Test: `tests/integration/staging-publish.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/integration/staging-publish.test.ts`:

```ts
import { it, expect } from "vitest";
import { integrationDescribe as d } from "../helpers/test-env";
import { createEntry, publishEntry, getEntry } from "@/lib/content/entries";
import { createTestUser, uniqueTitle } from "../helpers/db";

d("staging: publish snapshots the working copy", () => {
  it("copies data into publishedData and clears the pending flag", async () => {
    const actorId = await createTestUser();
    const created = await createEntry("insight", {
      data: { title: uniqueTitle("Insight"), body: "original" },
      actorId,
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    // Draft: no snapshot yet.
    const draft = await getEntry("insight", created.entry.id);
    expect(draft?.publishedData).toBeNull();

    await publishEntry("insight", created.entry.id, actorId);

    const row = await getEntry("insight", created.entry.id);
    expect(row?.status).toBe("published");
    expect(row?.hasUnpublishedChanges).toBe(false);
    expect(row?.publishedData).toEqual(row?.data);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/integration/staging-publish.test.ts`
Expected: FAIL — `publishedData` is still `null` after publish (publish doesn't set it yet).

- [ ] **Step 3: Update `publishEntry` to snapshot + refresh facets**

In `lib/content/entries.ts`, replace the update block in `publishEntry` (currently lines 264-274, the `const now = new Date(); const [updated] = await db.update(...)...returning();`) with:

```ts
  const now = new Date();
  const updated = await db.transaction(async (tx) => {
    const [row] = await tx
      .update(contentEntries)
      .set({
        status: "published",
        publishedData: entry.data, // freeze the working copy as the public snapshot
        hasUnpublishedChanges: false,
        publishedAt: entry.publishedAt ?? now,
        updatedBy: actorId,
        updatedAt: now,
      })
      .where(eq(contentEntries.id, id))
      .returning();

    // Case facets are the PUBLISHED facets: refresh them from the snapshot here
    // (updateEntry/restoreVersion no longer touch them).
    if (type === "case") {
      const facets = extractCaseFacets(entry.data);
      await tx
        .insert(caseStudyFacets)
        .values({ entryId: id, ...facets })
        .onConflictDoUpdate({ target: caseStudyFacets.entryId, set: facets });
    }
    return row;
  });
```

(`extractCaseFacets` and `caseStudyFacets` are already imported in this file.)

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/integration/staging-publish.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/content/entries.ts tests/integration/staging-publish.test.ts
git commit -m "feat(content): publish freezes the working copy into publishedData"
```

---

## Task 3: `updateEntry` marks pending, stops writing facets

**Files:**
- Modify: `lib/content/entries.ts:212-229` (the `updateEntry` update + facet block)
- Test: `tests/integration/staging-edit.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/integration/staging-edit.test.ts`:

```ts
import { it, expect } from "vitest";
import { integrationDescribe as d } from "../helpers/test-env";
import {
  createEntry,
  publishEntry,
  updateEntry,
  getEntry,
} from "@/lib/content/entries";
import { createTestUser, uniqueTitle } from "../helpers/db";

d("staging: editing a published entry", () => {
  it("freezes publishedData and flags unpublished changes", async () => {
    const actorId = await createTestUser();
    const title = uniqueTitle("Insight");
    const created = await createEntry("insight", {
      data: { title, body: "original" },
      actorId,
    });
    if (!created.ok) return;
    const id = created.entry.id;
    await publishEntry("insight", id, actorId);

    await updateEntry("insight", id, {
      data: { title, body: "edited" },
      actorId,
    });

    const row = await getEntry("insight", id);
    expect(row?.hasUnpublishedChanges).toBe(true);
    expect((row?.data as { body: string }).body).toBe("edited");
    expect((row?.publishedData as { body: string }).body).toBe("original");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/integration/staging-edit.test.ts`
Expected: FAIL — `hasUnpublishedChanges` is still `false` after the edit.

- [ ] **Step 3: Update `updateEntry`**

In `lib/content/entries.ts`, change the `.set({...})` of the `updateEntry` transaction (currently lines 214-219) to mark the pending flag when the entry is already published:

```ts
    const [updated] = await tx
      .update(contentEntries)
      .set({
        data,
        currentVersionId: version.id,
        updatedBy: input.actorId,
        updatedAt: new Date(),
        // Edits to a published entry are staged, not live: flag them so the UI
        // shows "Publish changes". Drafts stay as they are.
        ...(current.status === "published"
          ? { hasUnpublishedChanges: true }
          : {}),
      })
      .where(eq(contentEntries.id, id))
      .returning();
```

Then DELETE the case-facets block that follows it (currently lines 223-229):

```ts
    if (type === "case") {
      const facets = extractCaseFacets(data);
      await tx
        .insert(caseStudyFacets)
        .values({ entryId: id, ...facets })
        .onConflictDoUpdate({ target: caseStudyFacets.entryId, set: facets });
    }
```

Facets are now owned by `publishEntry` (Task 2), so a draft edit must not change the published facets.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/integration/staging-edit.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/content/entries.ts tests/integration/staging-edit.test.ts
git commit -m "feat(content): editing a published entry stages changes instead of going live"
```

---

## Task 4: Public read layer serves the snapshot

**Files:**
- Modify: `lib/content/published.ts:37-46` (`toListItem`), `:53-82` (`serializeEntry`), `:223` (`getPublished` call)
- Modify: `app/api/content/preview/[type]/[id]/route.ts:33`
- Test: `tests/integration/staging-read.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/integration/staging-read.test.ts`:

```ts
import { it, expect } from "vitest";
import { integrationDescribe as d } from "../helpers/test-env";
import {
  createEntry,
  publishEntry,
  updateEntry,
} from "@/lib/content/entries";
import { getPublished } from "@/lib/content/published";
import { createTestUser, uniqueTitle } from "../helpers/db";

d("staging: the public read API serves the snapshot", () => {
  it("keeps serving the last published content until re-publish", async () => {
    const actorId = await createTestUser();
    const title = uniqueTitle("Insight");
    const created = await createEntry("insight", {
      data: { title, body: "original" },
      actorId,
    });
    if (!created.ok) return;
    const { id, slug } = created.entry;
    await publishEntry("insight", id, actorId);

    await updateEntry("insight", id, {
      data: { title, body: "edited" },
      actorId,
    });

    const stale = await getPublished("insight", slug);
    expect((stale?.data as { body: string }).body).toBe("original");

    await publishEntry("insight", id, actorId);
    const fresh = await getPublished("insight", slug);
    expect((fresh?.data as { body: string }).body).toBe("edited");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/integration/staging-read.test.ts`
Expected: FAIL — `getPublished` still reads `entry.data`, so it returns `"edited"` instead of `"original"`.

- [ ] **Step 3: Make `serializeEntry` take the data blob explicitly**

In `lib/content/published.ts`, change the `serializeEntry` signature and the two places it reads `entry.data`:

```ts
export async function serializeEntry(
  entry: typeof contentEntries.$inferSelect,
  data: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  let facets: Record<string, string[]> | undefined;
  if (entry.type === "case") {
    const [f] = await db
      .select()
      .from(caseStudyFacets)
      .where(eq(caseStudyFacets.entryId, entry.id));
    if (f)
      facets = {
        industry: f.industry,
        service: f.service,
        region: f.regionSlugs,
        outcome: f.outcome,
      };
  }

  const urls = await resolveMediaUrls(collectDataMediaIds(data));
  const withUrls = attachDataMediaUrls(data, urls);

  return {
    id: entry.id,
    type: entry.type,
    slug: entry.slug,
    locale: entry.locale,
    data: facets ? { ...withUrls, facets } : withUrls,
    publishedAt: entry.publishedAt,
  };
}
```

- [ ] **Step 4: Serve `publishedData` from `getPublished`**

In `lib/content/published.ts`, update the `serializeEntry` call in `getPublished` (line 223):

```ts
  const serialized = await serializeEntry(entry, entry.publishedData ?? entry.data);
```

- [ ] **Step 5: Serve `publishedData` in the list projections**

In `lib/content/published.ts`, change `toListItem` to read the snapshot (line 44):

```ts
function toListItem(type: ContentType, e: typeof contentEntries.$inferSelect) {
  return {
    id: e.id,
    type: e.type,
    slug: e.slug,
    locale: e.locale,
    publishedAt: e.publishedAt,
    ...defForType(type).toListItem(e.publishedData ?? e.data),
  };
}
```

(Both `listPublished` and `listPublishedCases` only ever pass published rows to `toListItem`, so `publishedData` is always set.)

- [ ] **Step 6: Keep preview showing the working copy**

In `app/api/content/preview/[type]/[id]/route.ts`, update the call (line 33):

```ts
    return jsonOk(await serializeEntry(entry, entry.data));
```

- [ ] **Step 7: Run the test to verify it passes**

Run: `npx vitest run tests/integration/staging-read.test.ts`
Expected: PASS.

- [ ] **Step 8: Run the existing content integration tests (no regressions)**

Run: `npx vitest run tests/integration/us1-publish-flow.test.ts tests/integration/us2-no-draft-leak.test.ts`
Expected: PASS (publish still surfaces content; drafts still hidden).

- [ ] **Step 9: Commit**

```bash
git add lib/content/published.ts app/api/content/preview tests/integration/staging-read.test.ts
git commit -m "feat(content): public read API serves the published snapshot, preview serves the working copy"
```

---

## Task 5: `restoreVersion` stages instead of going live

**Files:**
- Modify: `lib/content/entries.ts:534-551` (the `restoreVersion` update + facet block)
- Test: `tests/integration/staging-restore.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/integration/staging-restore.test.ts`:

```ts
import { it, expect } from "vitest";
import { integrationDescribe as d } from "../helpers/test-env";
import {
  createEntry,
  publishEntry,
  updateEntry,
  listVersions,
  restoreVersion,
  getEntry,
} from "@/lib/content/entries";
import { createTestUser, uniqueTitle } from "../helpers/db";

d("staging: restoring a version on a published entry", () => {
  it("stages the restore (flags pending) without touching the snapshot", async () => {
    const actorId = await createTestUser();
    const title = uniqueTitle("Insight");
    const created = await createEntry("insight", {
      data: { title, body: "v1" },
      actorId,
    });
    if (!created.ok) return;
    const id = created.entry.id;
    await publishEntry("insight", id, actorId); // publishedData.body = "v1"
    await updateEntry("insight", id, { data: { title, body: "v2" }, actorId });
    await publishEntry("insight", id, actorId); // publishedData.body = "v2"

    // Restore the oldest version (body "v1") — a staged change, not live.
    const versions = await listVersions(id);
    const oldest = versions[versions.length - 1];
    await restoreVersion("insight", id, oldest.id, actorId);

    const row = await getEntry("insight", id);
    expect((row?.data as { body: string }).body).toBe("v1"); // working copy restored
    expect((row?.publishedData as { body: string }).body).toBe("v2"); // site unchanged
    expect(row?.hasUnpublishedChanges).toBe(true);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/integration/staging-restore.test.ts`
Expected: FAIL — `hasUnpublishedChanges` is `false` after restore.

- [ ] **Step 3: Update `restoreVersion`**

In `lib/content/entries.ts`, change the `.set({...})` inside `restoreVersion` (currently lines 536-541) to flag pending when published:

```ts
    const [updated] = await tx
      .update(contentEntries)
      .set({
        data: ver.data,
        currentVersionId: newVersion.id,
        updatedBy: actorId,
        updatedAt: new Date(),
        ...(current.status === "published"
          ? { hasUnpublishedChanges: true }
          : {}),
      })
      .where(eq(contentEntries.id, id))
      .returning();
```

Then DELETE the case-facets block that follows it (currently lines 545-551):

```ts
    if (type === "case") {
      const facets = extractCaseFacets(ver.data);
      await tx
        .insert(caseStudyFacets)
        .values({ entryId: id, ...facets })
        .onConflictDoUpdate({ target: caseStudyFacets.entryId, set: facets });
    }
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/integration/staging-restore.test.ts`
Expected: PASS.

- [ ] **Step 5: Run the existing restore test (no regression)**

Run: `npx vitest run tests/integration/us4-version-restore.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/content/entries.ts tests/integration/staging-restore.test.ts
git commit -m "feat(content): restoring a version on a published entry stages the change"
```

---

## Task 6: `unpublishEntry` resets the pending flag

**Files:**
- Modify: `lib/content/entries.ts:302-306` (the `unpublishEntry` update)
- Test: `tests/integration/staging-unpublish.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/integration/staging-unpublish.test.ts`:

```ts
import { it, expect } from "vitest";
import { integrationDescribe as d } from "../helpers/test-env";
import {
  createEntry,
  publishEntry,
  updateEntry,
  unpublishEntry,
  getEntry,
} from "@/lib/content/entries";
import { getPublished } from "@/lib/content/published";
import { createTestUser, uniqueTitle } from "../helpers/db";

d("staging: unpublish", () => {
  it("stops public serving and clears the pending flag", async () => {
    const actorId = await createTestUser();
    const title = uniqueTitle("Insight");
    const created = await createEntry("insight", {
      data: { title, body: "original" },
      actorId,
    });
    if (!created.ok) return;
    const { id, slug } = created.entry;
    await publishEntry("insight", id, actorId);
    await updateEntry("insight", id, { data: { title, body: "edited" }, actorId });

    await unpublishEntry("insight", id, actorId);

    const row = await getEntry("insight", id);
    expect(row?.status).toBe("draft");
    expect(row?.hasUnpublishedChanges).toBe(false);
    expect(await getPublished("insight", slug)).toBeNull();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/integration/staging-unpublish.test.ts`
Expected: FAIL — `hasUnpublishedChanges` stays `true` after unpublish.

- [ ] **Step 3: Update `unpublishEntry`**

In `lib/content/entries.ts`, change the `.set({...})` in `unpublishEntry` (line 304):

```ts
    .set({
      status: "draft",
      hasUnpublishedChanges: false,
      updatedBy: actorId,
      updatedAt: now,
    })
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/integration/staging-unpublish.test.ts`
Expected: PASS.

- [ ] **Step 5: Run the whole integration + unit suite**

Run: `npm test`
Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add lib/content/entries.ts tests/integration/staging-unpublish.test.ts
git commit -m "feat(content): unpublish resets the unpublished-changes flag"
```

---

## Task 7: Editor UI — Publish changes button, badge, banner

No automated test (client component with Quill; the project has no component-test harness — verify via typecheck, lint, and the running app, matching how existing editor UI is verified).

**Files:**
- Modify: `components/ContentEditor.tsx:25-30` (Initial type), `:60-69` (state), `saveDraft` success (~234), `doAction` success (~369), buttons block (`:548-583`)
- Modify: `app/(admin)/[collection]/[id]/page.tsx:42-47`
- Modify: `app/(admin)/pages/[key]/page.tsx:57-64`

- [ ] **Step 1: Pass the flag from the collection edit page**

In `app/(admin)/[collection]/[id]/page.tsx`, extend the `initial` object (lines 42-47):

```tsx
        initial={{
          id: entry.id,
          data: entry.data,
          currentVersionId: entry.currentVersionId,
          status: entry.status,
          hasUnpublishedChanges: entry.hasUnpublishedChanges,
        }}
```

- [ ] **Step 2: Pass the flag from the singleton page**

In `app/(admin)/pages/[key]/page.tsx`, extend the `initial` for an existing entry (lines 57-64):

```tsx
  const initial = entry
    ? {
        id: entry.id,
        data: entry.data,
        currentVersionId: entry.currentVersionId,
        status: entry.status,
        hasUnpublishedChanges: entry.hasUnpublishedChanges,
      }
    : { data: emptyData(cfg.type) };
```

- [ ] **Step 3: Extend the `Initial` type and add state**

In `components/ContentEditor.tsx`, add the field to the `Initial` interface (lines 25-30):

```ts
interface Initial {
  id?: string;
  data: Record<string, unknown>;
  currentVersionId?: string | null;
  status?: string;
  hasUnpublishedChanges?: boolean;
}
```

And add state alongside `status` (after line 63):

```ts
  const [hasUnpublished, setHasUnpublished] = useState(
    initial.hasUnpublishedChanges ?? false,
  );
```

- [ ] **Step 4: Sync the flag from save/publish responses**

In `saveDraft`, in the success block right after `setStatus(body.status ?? "draft");` (line 234), add:

```ts
      setHasUnpublished(body.hasUnpublishedChanges ?? false);
```

In `doAction`, in the success block right after `setStatus(body.status);` (line 369), add:

```ts
      setHasUnpublished(body.hasUnpublishedChanges ?? false);
```

- [ ] **Step 5: Replace the actions block with the three states**

In `components/ContentEditor.tsx`, replace the buttons block (lines 548-579, from the opening `<div className="sticky bottom-0 ...">` through the `Unpublish` button's closing, up to but not including the `{message && (...)}` block) with:

```tsx
      <div className="sticky bottom-0 mt-8 flex flex-wrap items-center gap-3 border-t border-line bg-white/95 py-4 backdrop-blur">
        {/* Status badge (published only). */}
        {id && status === "published" && !hasUnpublished && (
          <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
            ● Live
          </span>
        )}
        {id && status === "published" && hasUnpublished && (
          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
            ⚠ Unpublished changes
          </span>
        )}

        <button
          type="button"
          onClick={() => saveDraft()}
          disabled={busy}
          aria-busy={busy}
          className={buttonDark}
        >
          {busy ? "Saving…" : "Save draft"}
        </button>

        {/* Never-published draft: Publish is the primary action. */}
        {id && status !== "published" && (
          <button
            type="button"
            onClick={() => doAction("publish")}
            disabled={busy}
            aria-busy={busy}
            className={buttonPrimary}
          >
            Publish
          </button>
        )}

        {/* Published WITH pending edits: promote the staged changes. */}
        {id && status === "published" && hasUnpublished && (
          <button
            type="button"
            onClick={() => doAction("publish")}
            disabled={busy}
            aria-busy={busy}
            className={buttonPrimary}
          >
            Publish changes
          </button>
        )}

        {/* Published: allow taking it offline. */}
        {id && status === "published" && (
          <button
            type="button"
            onClick={() => doAction("unpublish")}
            disabled={busy}
            aria-busy={busy}
            className={buttonSecondary}
          >
            Unpublish
          </button>
        )}

        {message && (
          <StatusMessage tone={message.tone}>{message.text}</StatusMessage>
        )}
      </div>

      {/* Explain what "unpublished changes" means, right under the actions. */}
      {id && status === "published" && hasUnpublished && (
        <p className="mt-2 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
          You have unpublished changes — the site still shows the last published
          version. Click “Publish changes” to make them live.
        </p>
      )}
```

- [ ] **Step 6: Typecheck**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 7: Lint**

Run: `npx eslint components/ContentEditor.tsx "app/(admin)/[collection]/[id]/page.tsx" "app/(admin)/pages/[key]/page.tsx"`
Expected: no errors.

- [ ] **Step 8: Manual verification in the running app**

Run: `npm run dev` (port 3010). Then, signed into the admin:
1. Open a **published** entry → badge shows `● Live`; buttons: `Save draft`, `Unpublish`. No publish button.
2. Edit a field, wait ~10s (auto-save) or click `Save draft` → badge flips to `⚠ Unpublished changes`, the banner appears, and a `Publish changes` button appears.
3. Open the public detail / `Preview`: the site still shows the **old** content; Preview shows the **edited** content.
4. Click `Publish changes` → banner and button disappear, badge returns to `● Live`, and the public detail now shows the new content.
5. Open a brand-new entry → only `Save draft`; after first save, `Publish` appears.

- [ ] **Step 9: Commit**

```bash
git add components/ContentEditor.tsx "app/(admin)/[collection]/[id]/page.tsx" "app/(admin)/pages/[key]/page.tsx"
git commit -m "feat(admin): Publish changes button, live/unpublished badge and banner"
```

---

## Task 8: Final full-suite check

- [ ] **Step 1: Run the entire suite + typecheck + lint**

Run: `npm test && npm run typecheck && npm run lint`
Expected: all pass.

- [ ] **Step 2: Push the branch**

```bash
git push -u origin feat/content-draft-staging
```

---

## Self-review notes (author)

- **Spec coverage:** schema (Task 1), publish snapshot + facets (Task 2), edit staging + facet ownership move (Task 3), read layer + preview (Task 4), restore (Task 5), unpublish (Task 6), UI states/badge/banner + flag wiring + API field consumption (Task 7). All spec sections mapped.
- **`createEntry` deliberately unchanged:** it still seeds a case's facet row from the initial draft data; publish refreshes it. Drafts are never served (status filter + `caseStudyFacets` inner join), so seed-time facets are harmless and this avoids extra churn.
- **API routes deliberately unchanged:** `jsonOk(result.entry)` already returns the full row, so `hasUnpublishedChanges` reaches the client once the column exists (Task 7 Step 4 consumes it).
- **Type consistency:** column props `publishedData` / `hasUnpublishedChanges` used identically across schema, services, read layer, and editor.
