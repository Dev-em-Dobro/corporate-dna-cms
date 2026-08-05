# CMS Content Fields & Types — Design

**Date:** 2026-08-05
**Author:** Beto & Cadu / Dev em Dobro
**Status:** Approved for planning

## Context

The public website (separate repo) consumes this CMS. The consolidated status
review (`STATUS-REVIEW-2026-08-05`) lists five site features that are blocked on
the CMS exposing new fields/types before the site side is meaningful:

1. CMS-editable homepage statistics.
2. A `proofRefs` shape on Solutions so the site can render a proof/testimonials block.
3. Optional Insights fields (source attribution, downloadable attachment, author approval).
4. An author-approval gate so unapproved bylines never publish.
5. A simple "Reports & Resources" library of downloadable PDFs/white papers.

This spec covers the CMS work for all five. Site-side rendering lives in the
other repo and is out of scope here.

## Architecture recap (how this CMS models content)

- Every content type is one row in `content_entries`; type-specific fields live
  in the JSONB `data` column, validated by a per-type Zod schema in
  `lib/content/types.ts` and laid out for the admin form in
  `lib/content/ui-fields.ts`.
- **Adding fields to an existing type needs no migration** — JSONB is schemaless
  at the DB level; the Zod schema and form spec are the source of truth.
- **Adding a new type** requires one enum value on the Postgres `content_type`
  enum (`db/schema/enums.ts` + a generated migration) plus registry entries. The
  generic admin CRUD (`app/(admin)/[collection]/…`) and read API
  (`app/api/content/[type]/…`) then work automatically via `SEGMENT_TO_TYPE` /
  `resolveTypeParam`.
- The public read API serves `publishedData` (a frozen snapshot), never the
  working `data`. Media refs (`*MediaId`) are resolved to delivery URLs by
  `lib/content/media-urls.ts` during serialization.
- Document uploads (PDF, doc, docx, xls, xlsx) are already allowed by
  `lib/media/validate.ts` and pass through the upload route untouched (only
  images are re-encoded to WebP), so a downloadable file is just a `media` field.

## Design decisions (locked)

| Topic | Decision |
|-------|----------|
| Home statistics | New `page_home` singleton with **4 fixed named string fields** (`years`, `countries`, `faculty`, `sponsoredPct`). |
| `proofRefs` shape | **Free-form quote blocks** `{ quote, author, role, caseSlug? }`, `caseSlug` optional. |
| Reports & Resources | New **`resource` collection type** (own library), not an insight attachment. |
| Author gate | Read API **masks** the byline to `"Corporate DNA"` when the insight is not author-approved. |

## Detailed design

### Common building block — `boolean` field kind

Add a `boolean` value to `FieldKind` (rendered as a checkbox in `ContentEditor`).
Used by the Insight author-approval flag. This is the only new UI control; every
other field reuses an existing kind (`text`, `date`, `url`, `media`, `json`,
`richtext`).

### Item 1 — Home statistics (`page_home` singleton)

- **Enum:** add `page_home` to `contentTypeEnum` (migration).
- **Schema** (`pageHomeSchema`): `years`, `countries`, `faculty`, `sponsoredPct`
  — all `z.string().min(1)` (required, so publish enforces them). Values are
  display strings, e.g. `"18"`, `"36"`, `"75"`, `"90%"`.
- **Registry:** singleton, `label: "Home statistics"`, no segment.
- **Singleton key:** `SINGLETON_PAGES.home = { type: "page_home", slug: "home" }`
  → readable at `GET /api/content/pages/home`.
- **Form** (`FIELDS.page_home`): four `text` fields with help text.
- **Admin navigation:** the current `app/(admin)/pages/page.tsx` only lists the
  legal singletons. Restructure it into two groups — **Site** (Home statistics)
  and **Legal** (Privacy / Cookies / Terms) — so editors can reach `/pages/home`.
- **Seed:** a small seed creates & publishes the `home` entry with the current
  values (`18 / 36 / 75 / 90%`) so the site has data immediately.

### Item 2 — Solution `proofRefs`

- **Schema:** add to `solutionSchema`:
  ```
  proofRefs: z.array(z.object({
    quote:    z.string().min(1),
    author:   z.string().default(""),
    role:     z.string().default(""),
    caseSlug: z.string().optional(),
  })).default([])
  ```
- **Form:** add a `json` field `proofRefs`, label
  `Proof / testimonials [ {quote,author,role,caseSlug} ]` (same pattern as
  `elements`/`items`).
- **Read API:** flows through `data` unchanged; no media inside, nothing else to do.
- **No migration.**

### Item 3 — Insight optional fields

Add to `insightSchema` (all optional, **no migration**):

- `originalSource: z.string().default("")` — "Originally published on".
- `originalPublicationDate: z.string().optional()` — `date` field.
- `sourceLink: optionalUrl` — reuses the existing empty-string→undefined preprocessor.
- `authorApproved: z.boolean().default(false)` — checkbox.
- `attachmentMediaId: z.uuid().optional()` — a `media` field holding a PDF.

Form (`FIELDS.insight`): append `originalSource` (text), `originalPublicationDate`
(date), `sourceLink` (url), `authorApproved` (boolean), `attachmentMediaId`
(media). `attachmentMediaId` resolves to `attachmentUrl` in the read API (see
media-urls change below).

### Item 4 — Author-approval gate (read-API masking)

- New helper `maskUnapprovedAuthor(type, data)` (in `lib/content/published.ts`
  or a small sibling module): when `type === "insight"` and
  `data.authorApproved !== true`, return `{ ...data, author: "Corporate DNA" }`;
  otherwise return `data` unchanged.
- Apply it in `getPublished` on the **published** path, before `serializeEntry`,
  so unapproved names never reach the site.
- **Do not** apply it in the token-gated preview path — editors must see the real
  byline while reviewing a draft.
- Insight list items (`titleSummary`) do not include the author, so only the
  detail path needs masking.

### Item 5 — `Resource` collection

- **Enum:** add `resource` to `contentTypeEnum` (same migration as Item 1).
- **Schema** (`resourceSchema`):
  ```
  title:        z.string().min(1),
  description:  z.string().default(""),
  fileMediaId:  z.uuid(),          // required — the downloadable file
  coverMediaId: z.uuid().optional(),
  ```
- **Registry:** collection, `segment: "resources"`, `label: "Resource"`,
  `toListItem` = `titleSummary` (cover from `coverMediaId`).
- **Form** (`FIELDS.resource`): `title` (text, required), `description`
  (richtext), `fileMediaId` (media, PDF), `coverMediaId` (media).
- **Admin navigation:** add `{ href: "/resources", label: "Resources" }` to the
  admin `NAV`.
- **Read API:** automatic via `SEGMENT_TO_TYPE["resources"] → resource`.

### Media URL resolution change

Extend `lib/content/media-urls.ts` so the read API resolves the two new file
refs:

- `collectDataMediaIds` also collects `data.fileMediaId` and
  `data.attachmentMediaId`.
- `attachDataMediaUrls` also adds sibling `fileUrl` (from `fileMediaId`) and
  `attachmentUrl` (from `attachmentMediaId`).

Additive and backward-compatible — existing `*Url` fields are untouched.

## Data migration

One generated migration adds two enum values:

```sql
ALTER TYPE "public"."content_type" ADD VALUE 'page_home';
ALTER TYPE "public"."content_type" ADD VALUE 'resource';
```

`resource` and `page_home` reuse the existing `content_entries` table, so RLS
(migration `0001_enable_rls`) already covers them; no new tables or policies.
Generated via `npm run db:generate`, applied via `npm run db:migrate`.

## Testing

- **Unit:** `validateContent` accepts/enforces the new fields for `solution`,
  `insight`, `resource`, `page_home` (required-field failures, defaults);
  `maskUnapprovedAuthor` returns "Corporate DNA" only for unapproved insights;
  `collectDataMediaIds`/`attachDataMediaUrls` produce `fileUrl`/`attachmentUrl`.
- **Integration:** publish→read an insight with `authorApproved:false` returns a
  masked byline while preview returns the real one; a `resource` round-trips
  through create → publish → read with a resolved `fileUrl`; `page_home` reads at
  `/api/content/pages/home`.

## Out of scope

- All site-side rendering (the consuming repo).
- Gated/lead-capture resource centre (status review marks this `[POST]`).
- Any change to the Insights **list** payload (author masking is detail-only,
  matching where the byline is exposed today).

## Files touched

- `db/schema/enums.ts` — two enum values.
- `db/migrations/…` — one generated migration.
- `lib/content/types.ts` — schemas + registry (`page_home`, `resource`,
  `solution.proofRefs`, insight fields) + `SINGLETON_PAGES.home`.
- `lib/content/ui-fields.ts` — form specs + `boolean` kind.
- `lib/content/published.ts` — `maskUnapprovedAuthor` + wiring in `getPublished`.
- `lib/content/media-urls.ts` — `fileUrl` / `attachmentUrl` resolution.
- `components/ContentEditor` — render the `boolean` (checkbox) kind.
- `app/(admin)/layout.tsx` — Resources nav item.
- `app/(admin)/pages/page.tsx` — Site vs Legal grouping (Home statistics).
- `scripts/seed-home.ts` (new) — seed the home statistics singleton.
- Tests under `tests/unit` and `tests/integration`.
