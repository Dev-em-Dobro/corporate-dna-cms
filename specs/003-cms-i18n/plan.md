# Implementation Plan: CMS Internationalization (i18n) — Delivery 1 (US1 + US2)

**Branch**: `002-cms-i18n` | **Date**: 2026-07-20 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/003-cms-i18n/spec.md`

## Summary

Two stories in this delivery:

- **US1 (foundation)**: an admin **Languages** settings screen that manages the available languages (add/edit/reorder/set-default/enable-disable). This becomes the single source of truth that feeds every content picker.
- **US2**: manage content translations in the editor (see/switch/create language versions, pre-filled from source; grouped list), now reading the language set from US1 instead of a code config.

The content data model already supports translations (`content_entries.language`/`translationGroupId`, `addTranslation()` that copies the source, per-entry versioning). **US2 was already implemented against a code config; this plan adapts it to read the admin-managed registry.** US3 (public API) and US4 (admin-UI language) remain future.

## Technical Context

**Language/Version**: TypeScript 5, React 19, Next.js 16 (App Router)

**Primary Dependencies**: Drizzle ORM (+ a new migration), existing content services and shared editor, `requireAdmin()` guard (already used by user management).

**Storage**: PostgreSQL via Drizzle. **New table `locales`** (managed language registry). `content_entries.locale`/`translationGroupId` unchanged.

**Testing**: Vitest — unit tests for the language-registry service logic (default resolution, disable-guard, ordering) and the existing translation-grouping helpers.

**Target Platform**: Web (admin CMS).

**Project Type**: Web application (Next.js full-stack, single repo).

**Constraints**: Admin-only management (`requireAdmin`). Exactly one default at all times. A language with content can only be disabled, not deleted. The `locale` column stays free-form; the registry curates what's offered. Interface language stays English (US4 future).

**Scale/Scope**: Small admin tool; a handful of languages; ~9 content types through one shared editor.

## Constitution Check

*GATE: pass before Phase 0; re-check after Phase 1.*

Constitution is an unratified template (no active principles). Default good practice:

- **Simplicity / YAGNI**: PASS with a noted trade-off — we now add one table + a small admin CRUD screen. Justified: the user explicitly wants non-technical admins to add languages without a deploy (SC-001), which a code config cannot provide. Kept minimal (one table, admin-only CRUD, no per-language i18n framework).
- **No breaking changes**: PASS — public API and existing routes untouched; the content translation UI already shipped is adapted, not replaced.
- **Consistency**: PASS — reuses `requireAdmin()` and the existing admin screen patterns (mirrors user management).

No unjustified violations → Complexity Tracking notes the one deliberate addition.

## Project Structure

### Documentation (this feature)

```text
specs/003-cms-i18n/
├── plan.md · research.md · data-model.md · quickstart.md
├── contracts/translation-contracts.md
└── checklists/requirements.md
```

### Source Code (repository root)

```text
db/schema/
└── locales.ts                    # NEW: `locales` table (code, label, isDefault, enabled, sortOrder)
db/migrations/                    # NEW migration: create + seed (en default, pt-BR) the locales table

lib/content/
├── locales.ts                    # CHANGE: from static config → DB-backed registry service
│                                 #   getLocales(), activeLocales(), getDefaultLocale(), resolveLocale()
├── locale-rules.ts               # NEW (pure): default-resolution, disable/delete guards, ordering — unit-testable
├── translations.ts               # (from US2) unchanged pure helpers
└── entries.ts                    # (from US2) listTranslations already added

app/(admin)/settings/languages/
└── page.tsx                      # NEW: admin Languages screen (list + add/edit/reorder/default/enable-disable)
components/
├── LanguagesManager.tsx          # NEW (client): the settings CRUD UI (mirrors UsersManager)
├── TranslationBar.tsx            # (from US2) reads registry via props
├── AddTranslationButton.tsx      # NEW (Delta A): list "＋" create-from-source
└── ContentEditor.tsx             # (from US2) create-mode language picker fed by the registry

app/api/admin/locales/
├── route.ts                      # NEW: GET list / POST add (requireAdmin)
└── [code]/route.ts               # NEW: PATCH (label/default/enabled/order) / DELETE (guarded) (requireAdmin)

app/(admin)/[collection]/…, app/(admin)/pages/[key]/…   # (from US2) now read locales from the registry
tests/unit/
├── locale-rules.test.ts          # NEW: default resolution, disable-default guard, delete-in-use guard, ordering
└── translations.test.ts          # (from US2) grouping helpers
```

**Structure Decision**: Single Next.js app. A new `locales` table + admin-only CRUD (screen + API) becomes the source of truth; server components read it and pass the list to the existing client components. The already-built US2 UI switches its language source from the code config to this registry.

## Key implementation notes (carried into tasks)

- **`locales` table + migration**: `code` (PK), `label`, `isDefault` (exactly one true — enforce in the service), `enabled` (soft-disable), `sortOrder`, timestamps. Seed `en` (default) + `pt-BR`, matching existing content.
- **Registry service (`lib/content/locales.ts` rewrite)**: DB-backed `getLocales()`, `activeLocales()` (enabled, ordered), `getDefaultLocale()`, `resolveLocale(code)`. Pure decision logic (which is default, can-disable, can-delete, ordering) lives in `locale-rules.ts` for unit tests. Keep a hardcoded fallback default of `en` if the table is somehow empty.
- **Admin screen + API**: `LanguagesManager` mirrors `UsersManager`; API routes use `requireAdmin()` like `/api/admin/users`. Guards: can't disable/delete the default; can't delete a language that has any `content_entries` rows (count check) — offer disable instead; setting a new default clears the old one atomically.
- **Adapt US2 to the registry**: the create-mode picker, `TranslationBar`, singleton default load, and list grouping already call `activeLocales()`/`DEFAULT_LOCALE`; point those at the DB-backed service (server components `await` the registry and pass it down). `DEFAULT_LOCALE` constant → `getDefaultLocale()` lookup.
- **Menu**: add a "Languages" item under settings/admin nav, admin-only (mirror the Users entry).

## Revised Translation UX (Deltas — see research.md R7)

On top of US2's editor bar + grouped list, layer the WordPress/Prismic patterns (our model matches theirs):

- **Delta A (Tier 1)**: `AddTranslationButton` — a per-language "＋" in the content **list** (and the editor bar) that creates the translation from source in one click. Highest-leverage; the pattern headless CMSs miss.
- **Delta B (Tier 1)**: a "Translated from <source language>" hint in the editor (the copy already happens; just surface it).
- **Delta C (Tier 2, future)**: source value shown read-only beside each field with a "Copy" button.
- **Delta D (Tier 2, future)**: "source updated → translation may be outdated" flag using version history, with a "minor edit — don't flag" escape hatch.
- **Avoid**: field-level shared/localized split, side-by-side multi-pane, TMS/glossary, session-global switcher (research.md R7).

## Complexity Tracking

| Addition | Why needed | Simpler alternative rejected because |
|----------|------------|--------------------------------------|
| `locales` table + admin CRUD | User requires non-technical admins to add languages without a code change/deploy (SC-001). | A code-only config (previous R1) can't be edited by admins and needs a deploy per language. |
