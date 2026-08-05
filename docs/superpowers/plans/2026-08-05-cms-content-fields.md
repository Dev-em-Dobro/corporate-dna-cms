# CMS Content Fields & Types Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the five CMS field/type additions the site is blocked on — home statistics singleton, Solution `proofRefs`, Insights optional fields, an author-approval gate, and a Resource collection.

**Architecture:** Type-specific fields live in the JSONB `data` column, validated by per-type Zod schemas in `lib/content/types.ts` and laid out for the admin form in `lib/content/ui-fields.ts`. Adding fields to an existing type needs no migration; two new types (`page_home`, `resource`) add enum values via one generated migration and reuse the shared `content_entries` table, so the generic admin CRUD and read API work automatically through the registry.

**Tech Stack:** Next.js App Router, TypeScript, Drizzle ORM (Postgres/Supabase), Zod, Vitest.

**Design spec:** `docs/superpowers/specs/2026-08-05-cms-content-fields-design.md`

---

## File structure

| File | Responsibility | Change |
|------|----------------|--------|
| `db/schema/enums.ts` | Postgres `content_type` enum | add `page_home`, `resource` |
| `db/migrations/000X_*.sql` | enum ALTER migration | generated |
| `lib/content/types.ts` | Zod schemas + registry + singleton map | new schemas + fields |
| `lib/content/ui-fields.ts` | admin form specs + `FieldKind` | new fields + `boolean` kind |
| `components/ContentEditor.tsx` | form renderer | render `boolean` checkbox |
| `lib/content/media-urls.ts` | read-API media URL resolution | `fileUrl`/`attachmentUrl` |
| `lib/content/entries.ts` | publish-gate media existence check | include new media refs |
| `lib/content/published.ts` | published read serialization | author masking |
| `app/(admin)/layout.tsx` | admin nav | Resources item |
| `app/(admin)/pages/page.tsx` | singleton pages list | Site vs Legal groups |
| `scripts/seed-home.ts` | seed home statistics | new |

---

## Task 1: Add `page_home` and `resource` enum values + migration

**Files:**
- Modify: `db/schema/enums.ts`
- Create: `db/migrations/` (generated)

- [ ] **Step 1: Add the two enum values**

In `db/schema/enums.ts`, change `contentTypeEnum` to include the two new values at the end of the array:

```typescript
/** All content types the CMS manages (per data-model.md). */
export const contentTypeEnum = pgEnum("content_type", [
  "case",
  "solution",
  "person",
  "region",
  "insight",
  "page_5h",
  "page_book",
  "page_awards",
  "page_legal",
  "page_home",
  "resource",
]);
```

- [ ] **Step 2: Generate the migration**

Run: `npm run db:generate`
Expected: a new file `db/migrations/000X_<name>.sql` is created containing two `ALTER TYPE` statements. Verify it reads (order of the two lines may vary):

```sql
ALTER TYPE "public"."content_type" ADD VALUE 'page_home';--> statement-breakpoint
ALTER TYPE "public"."content_type" ADD VALUE 'resource';
```

If `db:generate` produces unrelated diffs, discard those and keep only the enum change.

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`
Expected: PASS (adding enum members is backward-compatible; `ContentType` in `lib/content/types.ts` is a separate list updated in Task 3+).

- [ ] **Step 4: Commit**

```bash
git add db/schema/enums.ts db/migrations
git commit -m "feat(cms): add page_home and resource content-type enum values"
```

---

## Task 2: Add a `boolean` field kind (checkbox)

**Files:**
- Modify: `lib/content/ui-fields.ts`
- Modify: `components/ContentEditor.tsx:650-748` (renderField)

- [ ] **Step 1: Extend the `FieldKind` union and `emptyData`**

In `lib/content/ui-fields.ts`, add `"boolean"` to `FieldKind`:

```typescript
export type FieldKind =
  | "text"
  | "textarea"
  | "richtext"
  | "url"
  | "email"
  | "media"
  | "date"
  | "stringList"
  | "facets"
  | "boolean"
  | "json";
```

Then add a `boolean` case in `emptyData` (before the `default`):

```typescript
      case "boolean":
        base[f.name] = false;
        break;
```

- [ ] **Step 2: Render the checkbox in ContentEditor**

In `components/ContentEditor.tsx`, inside `renderField`'s `switch (f.kind)` block, add a `boolean` case before `case "json":`:

```typescript
      case "boolean":
        return (
          <input
            {...a11y}
            type="checkbox"
            className="h-4 w-4 rounded border-line-strong"
            checked={Boolean(val)}
            onChange={(e) => set(f.name, e.target.checked)}
          />
        );
```

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add lib/content/ui-fields.ts components/ContentEditor.tsx
git commit -m "feat(cms): add boolean (checkbox) field kind to the content editor"
```

---

## Task 3: Solution `proofRefs`

**Files:**
- Modify: `lib/content/types.ts:76-81` (solutionSchema)
- Modify: `lib/content/ui-fields.ts:68-83` (FIELDS.solution)
- Test: `tests/unit/content-solution-proof.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/content-solution-proof.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { validateContent } from "@/lib/content/types";

describe("solution proofRefs", () => {
  const base = { title: "t", problemStatement: "p" };

  it("accepts a list of proof blocks and defaults author/role to empty", () => {
    const r = validateContent("solution", {
      ...base,
      proofRefs: [{ quote: "It worked.", caseSlug: "acme" }],
    });
    expect(r.ok).toBe(true);
    const refs = r.data!.proofRefs as Array<Record<string, unknown>>;
    expect(refs[0]).toEqual({
      quote: "It worked.",
      author: "",
      role: "",
      caseSlug: "acme",
    });
  });

  it("defaults proofRefs to an empty array when omitted", () => {
    const r = validateContent("solution", base);
    expect(r.ok).toBe(true);
    expect(r.data!.proofRefs).toEqual([]);
  });

  it("rejects a proof block with an empty quote", () => {
    const r = validateContent("solution", {
      ...base,
      proofRefs: [{ quote: "" }],
    });
    expect(r.ok).toBe(false);
    expect(r.errors!["proofRefs.0.quote"]).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/content-solution-proof.test.ts`
Expected: FAIL — `proofRefs` is stripped/undefined (not yet in the schema).

- [ ] **Step 3: Add `proofRefs` to the schema**

In `lib/content/types.ts`, update `solutionSchema`:

```typescript
export const solutionSchema = z.object({
  title: z.string().min(1),
  bannerMediaId: z.uuid().optional(),
  problemStatement: z.string().min(1),
  body: z.string().default(""),
  // Proof / testimonials rendered on the solution page. Free-form quote blocks;
  // caseSlug optionally links a block to a case study.
  proofRefs: z
    .array(
      z.object({
        quote: z.string().min(1),
        author: z.string().default(""),
        role: z.string().default(""),
        caseSlug: z.string().optional(),
      }),
    )
    .default([]),
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/content-solution-proof.test.ts`
Expected: PASS.

- [ ] **Step 5: Add the admin form field**

In `lib/content/ui-fields.ts`, append to the `solution` array (after `body`):

```typescript
    {
      name: "proofRefs",
      label: "Proof / testimonials [ {quote,author,role,caseSlug} ]",
      kind: "json",
      help: "One block per quote. caseSlug is optional.",
    },
```

- [ ] **Step 6: Typecheck and commit**

Run: `npm run typecheck`
Expected: PASS.

```bash
git add lib/content/types.ts lib/content/ui-fields.ts tests/unit/content-solution-proof.test.ts
git commit -m "feat(cms): add proofRefs to solutions for the site proof block"
```

---

## Task 4: Insight optional fields

**Files:**
- Modify: `lib/content/types.ts:104-113` (insightSchema)
- Modify: `lib/content/ui-fields.ts:103-117` (FIELDS.insight)
- Test: `tests/unit/content-insight-fields.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/content-insight-fields.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { validateContent } from "@/lib/content/types";
import { emptyData } from "@/lib/content/ui-fields";

describe("insight optional fields", () => {
  const base = { title: "t", body: "b" };

  it("accepts the new source/attachment/approval fields", () => {
    const r = validateContent("insight", {
      ...base,
      originalSource: "Harvard Business Review",
      originalPublicationDate: "2026-01-15",
      sourceLink: "https://hbr.org/article",
      authorApproved: true,
      attachmentMediaId: "11111111-1111-4111-8111-111111111111",
    });
    expect(r.ok).toBe(true);
    expect(r.data!.originalSource).toBe("Harvard Business Review");
    expect(r.data!.authorApproved).toBe(true);
    expect(r.data!.attachmentMediaId).toBe(
      "11111111-1111-4111-8111-111111111111",
    );
  });

  it("defaults authorApproved to false and treats a blank sourceLink as unset", () => {
    const r = validateContent("insight", { ...base, sourceLink: "" });
    expect(r.ok).toBe(true);
    expect(r.data!.authorApproved).toBe(false);
    expect(r.data!.sourceLink).toBeUndefined();
    expect(r.data!.originalSource).toBe("");
  });

  it("rejects a malformed sourceLink", () => {
    const r = validateContent("insight", { ...base, sourceLink: "not-a-url" });
    expect(r.ok).toBe(false);
    expect(r.errors!.sourceLink).toBeDefined();
  });

  it("seeds authorApproved:false in emptyData", () => {
    expect(emptyData("insight").authorApproved).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/content-insight-fields.test.ts`
Expected: FAIL — new fields absent; `authorApproved` undefined.

- [ ] **Step 3: Add the fields to the schema**

In `lib/content/types.ts`, update `insightSchema`:

```typescript
export const insightSchema = z.object({
  tags: tagsField,
  title: z.string().min(1),
  author: z.string().default(""),
  excerpt: z.string().default(""),
  body: z.string().min(1),
  coverMediaId: z.uuid().optional(),
  publishedDate: z.string().optional(),
  youtube: youtubeField,
  // Optional external-attribution fields (status review §10).
  originalSource: z.string().default(""),
  originalPublicationDate: z.string().optional(),
  sourceLink: optionalUrl,
  // Author-approval gate: the byline is masked to "Corporate DNA" on the public
  // read API until this is true (see maskUnapprovedAuthor in published.ts).
  authorApproved: z.boolean().default(false),
  // Downloadable file/report attachment (PDF etc.).
  attachmentMediaId: z.uuid().optional(),
});
```

- [ ] **Step 4: Run test to verify it passes (schema half)**

Run: `npx vitest run tests/unit/content-insight-fields.test.ts`
Expected: the schema assertions PASS; the `emptyData` assertion still FAILS until the form field is added.

- [ ] **Step 5: Add the admin form fields**

In `lib/content/ui-fields.ts`, append to the `insight` array (after `publishedDate`):

```typescript
    { name: "originalSource", label: "Originally published on", kind: "text", help: "Source publication name" },
    { name: "originalPublicationDate", label: "Original publication date", kind: "date" },
    { name: "sourceLink", label: "Source link", kind: "url" },
    { name: "authorApproved", label: "Author approved", kind: "boolean", help: "Until ticked, the byline shows as “Corporate DNA” on the site" },
    { name: "attachmentMediaId", label: "Downloadable attachment (PDF)", kind: "media", help: "PDF / white paper offered for download" },
```

- [ ] **Step 6: Run the full test to verify it passes**

Run: `npx vitest run tests/unit/content-insight-fields.test.ts`
Expected: PASS (including the `emptyData` assertion).

- [ ] **Step 7: Typecheck and commit**

Run: `npm run typecheck`
Expected: PASS.

```bash
git add lib/content/types.ts lib/content/ui-fields.ts tests/unit/content-insight-fields.test.ts
git commit -m "feat(cms): add insight source, attachment and author-approval fields"
```

---

## Task 5: `page_home` statistics singleton

**Files:**
- Modify: `lib/content/types.ts` (schema, registry, SINGLETON_PAGES)
- Modify: `lib/content/ui-fields.ts` (FIELDS.page_home)
- Modify: `app/(admin)/pages/page.tsx`
- Create: `scripts/seed-home.ts`
- Test: `tests/unit/content-page-home.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/content-page-home.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { validateContent, SINGLETON_PAGES } from "@/lib/content/types";

describe("page_home statistics", () => {
  it("accepts the four statistic fields", () => {
    const r = validateContent("page_home", {
      years: "18",
      countries: "36",
      faculty: "75",
      sponsoredPct: "90%",
    });
    expect(r.ok).toBe(true);
    expect(r.data!.years).toBe("18");
    expect(r.data!.sponsoredPct).toBe("90%");
  });

  it("requires every statistic", () => {
    const r = validateContent("page_home", { years: "18" });
    expect(r.ok).toBe(false);
    expect(r.errors!.countries).toBeDefined();
    expect(r.errors!.faculty).toBeDefined();
    expect(r.errors!.sponsoredPct).toBeDefined();
  });

  it("is registered as the 'home' singleton", () => {
    expect(SINGLETON_PAGES.home).toEqual({ type: "page_home", slug: "home" });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/content-page-home.test.ts`
Expected: FAIL — `page_home` is not a valid content type / `REGISTRY` has no entry (`validateContent` throws or returns undefined).

- [ ] **Step 3: Add the schema, CONTENT_TYPES entry, registry entry and singleton map**

In `lib/content/types.ts`:

Add `"page_home"` and `"resource"` to the `CONTENT_TYPES` array (keep them last, mirroring the DB enum):

```typescript
export const CONTENT_TYPES = [
  "case",
  "solution",
  "person",
  "region",
  "insight",
  "page_5h",
  "page_book",
  "page_awards",
  "page_legal",
  "page_home",
  "resource",
] as const;
```

Add the schema (near the other `page*` schemas):

```typescript
export const pageHomeSchema = z.object({
  years: z.string().min(1),
  countries: z.string().min(1),
  faculty: z.string().min(1),
  sponsoredPct: z.string().min(1),
});
```

Add the registry entry inside `REGISTRY` (after `page_legal`):

```typescript
  page_home: {
    type: "page_home",
    label: "Home statistics",
    singleton: true,
    schema: pageHomeSchema as unknown as z.ZodType<Record<string, unknown>>,
    toListItem: titleSummary,
  },
```

Add the singleton key inside `SINGLETON_PAGES`:

```typescript
  home: { type: "page_home", slug: "home" },
```

> Note: `resource` is added to `CONTENT_TYPES` here so both new types match the enum in one place, but its schema/registry entry lands in Task 6. `REGISTRY` is typed `Record<ContentType, …>`, so **Task 6 must be completed for `npm run typecheck` to pass.** Between Task 5 and Task 6, run the targeted vitest file rather than a full typecheck.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/content-page-home.test.ts`
Expected: PASS.

- [ ] **Step 5: Add the admin form fields**

In `lib/content/ui-fields.ts`, add a `page_home` entry to `FIELDS`:

```typescript
  page_home: [
    { name: "years", label: "Years", kind: "text", required: true, help: "e.g. 18" },
    { name: "countries", label: "Countries", kind: "text", required: true, help: "e.g. 36" },
    { name: "faculty", label: "Faculty", kind: "text", required: true, help: "e.g. 75" },
    { name: "sponsoredPct", label: "Chairman/CXO-sponsored", kind: "text", required: true, help: "e.g. 90%" },
  ],
```

- [ ] **Step 6: Surface the Home page in the admin pages list**

Replace `app/(admin)/pages/page.tsx` with:

```tsx
import Link from "next/link";

const SITE_PAGES: { key: string; label: string }[] = [
  { key: "home", label: "Home statistics" },
];

const LEGAL_PAGES: { key: string; label: string }[] = [
  { key: "privacy", label: "Privacy" },
  { key: "cookies", label: "Cookies" },
  { key: "terms", label: "Terms" },
];

function PageGroup({
  title,
  pages,
}: {
  title: string;
  pages: { key: string; label: string }[];
}) {
  return (
    <section className="mb-8">
      <h2 className="mb-3 text-lg font-semibold text-ink">{title}</h2>
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {pages.map(({ key, label }) => (
          <li key={key}>
            <Link
              href={`/pages/${key}`}
              className="flex min-h-16 items-center rounded-lg border border-line-strong p-4 transition-colors duration-150 hover:border-brand-dark hover:bg-paper"
            >
              <span className="font-medium text-ink">{label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function PagesList() {
  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-ink">Site pages</h1>
      <p className="mb-5 text-sm text-muted">
        Singleton pages — one entry each.
      </p>
      <PageGroup title="Site" pages={SITE_PAGES} />
      <PageGroup title="Legal" pages={LEGAL_PAGES} />
    </div>
  );
}
```

- [ ] **Step 7: Create the seed script**

Create `scripts/seed-home.ts`:

```typescript
/**
 * Seed the singleton `page_home` entry that holds the homepage statistics
 * (years / countries / faculty / sponsored %) and publish it, so the site's
 * GET /api/content/pages/home has data immediately.
 *
 * Usage: npx tsx scripts/seed-home.ts
 * Idempotent: skips if the `home` entry already exists.
 */
try {
  process.loadEnvFile(".env.local");
} catch {
  // no .env.local — rely on the shell environment
}

const LOCALE = "en";

async function main() {
  const { and, eq, isNull } = await import("drizzle-orm");
  const { db } = await import("../db");
  const { contentEntries, profiles } = await import("../db/schema");
  const { createEntry, publishEntry } = await import("../lib/content/entries");

  const [admin] = await db
    .select({ id: profiles.id, email: profiles.email })
    .from(profiles)
    .where(and(eq(profiles.role, "admin"), eq(profiles.status, "active")))
    .limit(1);
  if (!admin) {
    console.error("No active admin profile found. Run `npm run seed:admin`.");
    process.exit(1);
  }

  const [existing] = await db
    .select({ id: contentEntries.id })
    .from(contentEntries)
    .where(
      and(
        eq(contentEntries.type, "page_home"),
        eq(contentEntries.slug, "home"),
        eq(contentEntries.locale, LOCALE),
        isNull(contentEntries.deletedAt),
      ),
    );
  if (existing) {
    console.log("• skip — home statistics already exist");
    process.exit(0);
  }

  const result = await createEntry("page_home", {
    data: { years: "18", countries: "36", faculty: "75", sponsoredPct: "90%" },
    locale: LOCALE,
    slug: "home",
    actorId: admin.id,
  });
  if (!result.ok) {
    console.error("✗ validation:", result.errors);
    process.exit(1);
  }
  const pub = await publishEntry("page_home", result.entry.id, admin.id);
  if (!pub.ok) {
    console.error("✗ publish:", pub.errors);
    process.exit(1);
  }
  console.log("✓ home statistics created & published");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

- [ ] **Step 8: Commit**

(Full typecheck is deferred to Task 6 because `REGISTRY` still lacks the `resource` entry.)

```bash
git add lib/content/types.ts lib/content/ui-fields.ts app/(admin)/pages/page.tsx scripts/seed-home.ts tests/unit/content-page-home.test.ts
git commit -m "feat(cms): add editable home statistics singleton (page_home)"
```

---

## Task 6: `resource` collection type

**Files:**
- Modify: `lib/content/types.ts` (schema, registry)
- Modify: `lib/content/ui-fields.ts` (FIELDS.resource)
- Modify: `app/(admin)/layout.tsx:5-17` (NAV)
- Test: `tests/unit/content-resource.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/content-resource.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { validateContent, SEGMENT_TO_TYPE, REGISTRY } from "@/lib/content/types";

describe("resource collection", () => {
  it("accepts a title, description and required file", () => {
    const r = validateContent("resource", {
      title: "2026 Leadership Report",
      description: "Annual findings.",
      fileMediaId: "11111111-1111-4111-8111-111111111111",
    });
    expect(r.ok).toBe(true);
    expect(r.data!.description).toBe("Annual findings.");
  });

  it("requires a file", () => {
    const r = validateContent("resource", { title: "No file" });
    expect(r.ok).toBe(false);
    expect(r.errors!.fileMediaId).toBeDefined();
  });

  it("defaults description to empty and exposes the cover on list items", () => {
    const r = validateContent("resource", {
      title: "t",
      fileMediaId: "11111111-1111-4111-8111-111111111111",
    });
    expect(r.data!.description).toBe("");
    const item = REGISTRY.resource.toListItem({
      title: "t",
      coverMediaId: "c1",
    });
    expect(item.coverMediaId).toBe("c1");
  });

  it("is reachable via the 'resources' collection segment", () => {
    expect(SEGMENT_TO_TYPE.resources).toBe("resource");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/content-resource.test.ts`
Expected: FAIL — no `resource` schema/registry entry.

- [ ] **Step 3: Add the schema and registry entry**

In `lib/content/types.ts` add the schema (after `pageHomeSchema`):

```typescript
export const resourceSchema = z.object({
  title: z.string().min(1),
  description: z.string().default(""),
  fileMediaId: z.uuid(),
  coverMediaId: z.uuid().optional(),
});
```

Add the registry entry inside `REGISTRY` (after `page_home`):

```typescript
  resource: {
    type: "resource",
    label: "Resource",
    segment: "resources",
    singleton: false,
    schema: resourceSchema as unknown as z.ZodType<Record<string, unknown>>,
    toListItem: titleSummary,
  },
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/content-resource.test.ts`
Expected: PASS.

- [ ] **Step 5: Add the admin form fields**

In `lib/content/ui-fields.ts`, add a `resource` entry to `FIELDS`:

```typescript
  resource: [
    { name: "title", label: "Title", kind: "text", required: true },
    { name: "description", label: "Description", kind: "richtext" },
    { name: "fileMediaId", label: "File (PDF)", kind: "media", required: true, help: "PDF / white paper offered for download" },
    { name: "coverMediaId", label: "Cover image", kind: "media" },
  ],
```

- [ ] **Step 6: Add the admin nav item**

In `app/(admin)/layout.tsx`, add to the `NAV` array after the Insights item:

```typescript
  { href: "/resources", label: "Resources" },
```

- [ ] **Step 7: Full typecheck (REGISTRY is now complete)**

Run: `npm run typecheck`
Expected: PASS — `REGISTRY` now has entries for every `ContentType` including `page_home` and `resource`.

- [ ] **Step 8: Commit**

```bash
git add lib/content/types.ts lib/content/ui-fields.ts app/(admin)/layout.tsx tests/unit/content-resource.test.ts
git commit -m "feat(cms): add Resource collection for downloadable reports"
```

---

## Task 7: Resolve `fileMediaId` / `attachmentMediaId` in the read API and publish gate

**Files:**
- Modify: `lib/content/media-urls.ts:31-43` (collectDataMediaIds), `:84-116` (attachDataMediaUrls)
- Modify: `lib/content/entries.ts:29-46` (collectMediaIds)
- Test: `tests/unit/media-urls.test.ts`

- [ ] **Step 1: Write the failing tests**

Append to `tests/unit/media-urls.test.ts`, inside the existing file (add new `it` blocks to the `collectDataMediaIds` and `attachDataMediaUrls` describe blocks):

In the `describe("collectDataMediaIds", …)` block:

```typescript
  it("collects the resource file and insight attachment ids", () => {
    expect(collectDataMediaIds({ fileMediaId: "f1" })).toEqual(["f1"]);
    expect(collectDataMediaIds({ attachmentMediaId: "a1" })).toEqual(["a1"]);
  });
```

In the `describe("attachDataMediaUrls", …)` block (the `urls` map there already has entries; add a resolvable id):

```typescript
  it("adds fileUrl and attachmentUrl additively", () => {
    const map = new Map([
      ["f1", "https://cdn/f1.pdf"],
      ["a1", "https://cdn/a1.pdf"],
    ]);
    const out = attachDataMediaUrls(
      { fileMediaId: "f1", attachmentMediaId: "a1" },
      map,
    );
    expect(out.fileMediaId).toBe("f1");
    expect(out.fileUrl).toBe("https://cdn/f1.pdf");
    expect(out.attachmentUrl).toBe("https://cdn/a1.pdf");
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/unit/media-urls.test.ts`
Expected: FAIL — `fileMediaId`/`attachmentMediaId` not collected; `fileUrl`/`attachmentUrl` undefined.

- [ ] **Step 3: Extend `collectDataMediaIds`**

In `lib/content/media-urls.ts`, add to `collectDataMediaIds` (before the `items` block):

```typescript
  if (typeof data.fileMediaId === "string") ids.push(data.fileMediaId);
  if (typeof data.attachmentMediaId === "string")
    ids.push(data.attachmentMediaId);
```

- [ ] **Step 4: Extend `attachDataMediaUrls`**

In `lib/content/media-urls.ts`, add to `attachDataMediaUrls` (before the `items` block):

```typescript
  if (typeof data.fileMediaId === "string") {
    const url = urls.get(data.fileMediaId);
    if (url) out.fileUrl = url;
  }
  if (typeof data.attachmentMediaId === "string") {
    const url = urls.get(data.attachmentMediaId);
    if (url) out.attachmentUrl = url;
  }
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run tests/unit/media-urls.test.ts`
Expected: PASS.

- [ ] **Step 6: Include the new refs in the publish-gate existence check**

In `lib/content/entries.ts`, add to `collectMediaIds` (after the `push(data.logoMediaId);` line):

```typescript
  push(data.fileMediaId);
  push(data.attachmentMediaId);
```

This makes `publishEntry` reject a resource/insight whose referenced file no longer exists, consistent with the other media refs.

- [ ] **Step 7: Typecheck and commit**

Run: `npm run typecheck`
Expected: PASS.

```bash
git add lib/content/media-urls.ts lib/content/entries.ts tests/unit/media-urls.test.ts
git commit -m "feat(cms): resolve resource/insight file URLs in the read API and publish gate"
```

---

## Task 8: Author-approval masking on the published read path

**Files:**
- Modify: `lib/content/published.ts:1-11` (imports), add helper + wire into `getPublished:193-226`
- Test: `tests/unit/content-author-mask.test.ts`, `tests/integration/insight-author-gate.test.ts`

- [ ] **Step 1: Write the failing unit test**

Create `tests/unit/content-author-mask.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { maskUnapprovedAuthor } from "@/lib/content/published";

describe("maskUnapprovedAuthor", () => {
  it("masks an unapproved insight byline to 'Corporate DNA'", () => {
    const out = maskUnapprovedAuthor("insight", {
      author: "Rhea Leckie",
      authorApproved: false,
    });
    expect(out.author).toBe("Corporate DNA");
  });

  it("keeps the byline once approved", () => {
    const out = maskUnapprovedAuthor("insight", {
      author: "Rhea Leckie",
      authorApproved: true,
    });
    expect(out.author).toBe("Rhea Leckie");
  });

  it("leaves non-insight types untouched", () => {
    const data = { author: "Whoever", authorApproved: false };
    expect(maskUnapprovedAuthor("case", data)).toBe(data);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/content-author-mask.test.ts`
Expected: FAIL — `maskUnapprovedAuthor` is not exported.

- [ ] **Step 3: Add the helper and wire it into `getPublished`**

In `lib/content/published.ts`, add the helper (near the top, after the imports and `DEFAULT_LOCALE`):

```typescript
/**
 * Enforce the Insights author-approval gate (status review §10): a byline only
 * appears publicly once approved. Until then the read API attributes the piece
 * to "Corporate DNA", so no unapproved name (Rhea/Mike/…) leaks to the site.
 * Applied on the PUBLISHED read path only — the token-gated preview keeps the
 * real byline so editors can review it.
 */
export function maskUnapprovedAuthor(
  type: ContentType,
  data: Record<string, unknown>,
): Record<string, unknown> {
  if (type === "insight" && data.authorApproved !== true) {
    return { ...data, author: "Corporate DNA" };
  }
  return data;
}
```

Then in `getPublished`, change the serialization line. Replace:

```typescript
  const serialized = await serializeEntry(entry, entry.publishedData ?? entry.data);
```

with:

```typescript
  const publishedData = maskUnapprovedAuthor(
    entry.type,
    entry.publishedData ?? entry.data,
  );
  const serialized = await serializeEntry(entry, publishedData);
```

- [ ] **Step 4: Run unit test to verify it passes**

Run: `npx vitest run tests/unit/content-author-mask.test.ts`
Expected: PASS.

- [ ] **Step 5: Write the integration test**

Create `tests/integration/insight-author-gate.test.ts`:

```typescript
import { it, expect } from "vitest";
import { integrationDescribe as d } from "../helpers/test-env";
import { createEntry, publishEntry } from "@/lib/content/entries";
import { getPublished } from "@/lib/content/published";
import { createTestUser, uniqueTitle } from "../helpers/db";

d("insights author-approval gate", () => {
  it("masks an unapproved byline to 'Corporate DNA' on the public read", async () => {
    const actorId = await createTestUser();
    const title = uniqueTitle("Insight");
    const created = await createEntry("insight", {
      data: { title, body: "b", author: "Rhea Leckie", authorApproved: false },
      actorId,
    });
    if (!created.ok) return;
    const { id, slug } = created.entry;
    await publishEntry("insight", id, actorId);

    const pub = await getPublished("insight", slug);
    expect((pub?.data as { author: string }).author).toBe("Corporate DNA");
  });

  it("shows the real byline once approved", async () => {
    const actorId = await createTestUser();
    const title = uniqueTitle("Insight");
    const created = await createEntry("insight", {
      data: { title, body: "b", author: "Rhea Leckie", authorApproved: true },
      actorId,
    });
    if (!created.ok) return;
    const { id, slug } = created.entry;
    await publishEntry("insight", id, actorId);

    const pub = await getPublished("insight", slug);
    expect((pub?.data as { author: string }).author).toBe("Rhea Leckie");
  });
});
```

- [ ] **Step 6: Run the integration test**

Run: `npx vitest run tests/integration/insight-author-gate.test.ts`
Expected: PASS if a test database is configured; the `integrationDescribe` helper skips the suite when no DB is available (mirrors the existing `staging-read.test.ts` behaviour). Note either PASS or SKIPPED.

- [ ] **Step 7: Commit**

```bash
git add lib/content/published.ts tests/unit/content-author-mask.test.ts tests/integration/insight-author-gate.test.ts
git commit -m "feat(cms): mask unapproved insight bylines to 'Corporate DNA' on read"
```

---

## Task 9: Full verification and migration apply

**Files:** none (verification only)

- [ ] **Step 1: Run the full unit/integration suite**

Run: `npm test`
Expected: PASS (integration suites needing a DB may SKIP; record which).

- [ ] **Step 2: Typecheck and lint**

Run: `npm run typecheck`
Expected: PASS.

Run: `npm run lint`
Expected: PASS.

- [ ] **Step 3: Production build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 4: Apply the migration (requires DB access)**

Run: `npm run db:migrate`
Expected: the two `ALTER TYPE … ADD VALUE` statements apply cleanly.

- [ ] **Step 5: Seed the home statistics (requires DB + an active admin)**

Run: `npx tsx scripts/seed-home.ts`
Expected: `✓ home statistics created & published` (or `• skip` if already present).

- [ ] **Step 6: Final commit if any verification fixes were needed**

```bash
git add -A
git commit -m "chore(cms): verification fixes for content field additions"
```

---

## Self-review notes

- **Spec coverage:** Item 1 (home stats) → Task 5; Item 2 (proofRefs) → Task 3; Item 3 (insight fields) → Task 4; Item 4 (author gate) → Task 8; Item 5 (resource) → Task 6; media-URL resolution → Task 7; migration → Task 1; `boolean` control → Task 2. All five items plus the two supporting concerns are covered.
- **Cross-task type consistency:** `page_home`/`resource` added to both the DB enum (Task 1) and `CONTENT_TYPES` (Task 5) and `REGISTRY` (Tasks 5–6). `REGISTRY` is exhaustive over `ContentType`, so a full typecheck only passes after Task 6 — Task 5 Step 3 flags this and defers the full typecheck; targeted vitest runs verify the schema in between. `maskUnapprovedAuthor`, `fileUrl`/`attachmentUrl`, `authorApproved` names are used identically across schema, form, read API, and tests.
- **Known behaviour:** required fields (`fileMediaId`, the four home stats, `solution.problemStatement`) are enforced at create time by `createEntry` — matching the existing pattern — so the first save of a new resource requires a file, exactly as a new solution requires a problem statement.
