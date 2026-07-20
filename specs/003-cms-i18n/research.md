# Phase 0 Research: CMS i18n — Delivery 1 (US1)

All spec clarifications are resolved. Research covers the design choices for the admin translation UI on top of the existing data model.

## R1 — Single source of truth for active languages (REVISED: admin-managed registry)

**Decision (revised)**: An **admin-managed `locales` table** with a **Languages settings screen** (add/edit/reorder/set-default/enable-disable), plus a DB-backed service in `lib/content/locales.ts` (`getLocales`, `activeLocales`, `getDefaultLocale`, `resolveLocale`) and a pure `locale-rules.ts` for the decision logic. Admins add languages at runtime with no code change or deploy.

**Rationale**: The user requires non-technical admins to register the available languages themselves, and those languages to then drive content creation/translation (SC-001). That is how mainstream CMSs for non-dev teams work (WordPress, Strapi, Contentful all manage locales in settings). The `locale` column stays free-form text; the table curates what's offered. Soft-disable (not delete) protects existing content (FR-004).

**Superseded**: the earlier decision to keep languages in a code config array (`LOCALES` constant). That was simpler but couldn't be edited by admins and needed a deploy per language — rejected once admin self-service became a requirement.

**Alternatives considered**:
- *Code config array*: simplest, but dev-only and deploy-gated — no longer acceptable given the requirement.
- *Environment variable*: awkward for a labeled, ordered, admin-editable list.

**Note**: US2 was first built against the code config; it is adapted to read this registry (server components await the service and pass the list to the client components).

## R2 — Surfacing sibling translations in the editor

**Decision**: Add `listTranslations(translationGroupId)` to `lib/content/entries.ts` (returns `{ id, locale, status }[]`). The editor **server components** already load the entry; they additionally call `listTranslations` and pass the siblings + active languages to a new client `TranslationBar`. Switching languages is plain navigation to the sibling's editor URL; creating a translation reuses the existing `POST /translate` route, then navigates to the new entry.

**Rationale**: No new API surface is needed — server components can query directly, and the two write paths (`/translate`, and `POST /[type]` for create) already exist. The `translationGroupId` index makes the sibling query cheap. Keeping switch = navigation means each language reuses the full existing editor with zero special-casing.

**Alternatives considered**:
- *New `GET /translations` endpoint + client fetch*: unnecessary indirection; the data is already available server-side at page load.
- *One editor rendering all languages at once (tabs holding live state)*: heavier, risks cross-language state bugs, and fights the per-entry save/version model. Navigation per language is simpler and matches how entries already work.

## R3 — De-duplicating the admin list (FR-010)

**Decision**: Group `listEntries` results by `translationGroupId`, rendering **one row per logical piece** with its title (from the default-language variant when present, else any) and a cluster of **language badges**, each linking to that language's editor. A piece with no siblings shows a single badge.

**Rationale**: Today the list shows one row per (locale) variant, so a piece in 3 languages reads as 3 unrelated items. Grouping by the existing `translationGroupId` directly satisfies FR-010 without schema or query changes (`listEntries` already returns both fields).

**Alternatives considered**:
- *Keep per-locale rows, just sort by group*: still looks like duplicates.
- *Filter the list to the default locale only*: hides non-default-only pieces; loses visibility.

## R4 — Choosing the language when creating a new piece

**Decision**: In **create mode** (no entry id), the shared editor shows a language `select` populated from `activeLocales()`, defaulting to `DEFAULT_LOCALE`, and includes the chosen `locale` in the create POST (the route already accepts it). In edit mode the selector is hidden — language is fixed per entry and changed only by switching to a sibling.

**Rationale**: `createEntry`/`POST /[type]` already accept `locale`; the New page just never offered a choice. A create-only selector is the minimal, non-confusing addition. Translations of existing pieces are created through the TranslationBar (via `/translate`), not this selector.

**Alternatives considered**:
- *Always show a locale selector (also in edit)*: implies you can change an entry's language in place, which conflicts with the unique `(type, slug, locale)` model and the translation-group concept.

## R5 — Singleton pages

**Decision**: Singleton pages (`5h`, `book`, `awards`, legal pages) keep their fixed slug but their language variants still share a `translationGroupId`. The `[key]` editor loads the **default-language** entry (instead of hardcoding `en`) and shows the same `TranslationBar` to switch/create language variants.

**Rationale**: Singletons are just entries with a fixed slug; the same translation-group mechanics apply. The only change is replacing the hardcoded `"en"` load with `DEFAULT_LOCALE` and wiring the bar. This is the one place to validate carefully because the page currently assumes a single entry per key.

**Alternatives considered**:
- *Exclude singletons from delivery 1*: the spec explicitly includes them, and the change is small; excluding would leave an inconsistent UX.

## R6 — Reconciling existing `"en"` defaults

**Decision**: Introduce `DEFAULT_LOCALE` in the config and use it in the **new/edited** code paths (create picker, singleton load, fallbacks). Do not do a sweeping rename of every existing `"en"` literal in this delivery; migrate call sites opportunistically as they are touched.

**Rationale**: Keeps the change focused on US1 and avoids a risky wide refactor. Existing content stays `en`, which remains the default, so behavior is unchanged.

**Alternatives considered**:
- *Replace every `"en"` literal now*: broad blast radius across the public API and services (US2 territory) — deferred.

## R7 — Making translation easy: UX patterns from leading CMSs

**Decision**: Model our translation UX on the **document-per-locale** products (WordPress WPML/Polylang, Prismic) — our data model (one entry per language, linked by `translationGroupId`, per-entry draft/publish + version history) is exactly theirs, so their patterns transfer directly. Adopt in two tiers, ranked by UX-win-per-complexity.

**Tier 1 (this iteration) — biggest win, least code:**
1. **Per-language matrix in the content LIST** with `✓`/`＋` per active language (the standout pattern headless CMSs *miss*): existing language → link to its editor (with status); missing → a `＋` that creates the translation and opens it. This turns "add a language" into one click from the list, WordPress-style.
2. **Prominent editor language switcher** — already delivered as `TranslationBar` (existing links + `＋` create). Keep it prominent (not a tiny corner control — Payload's cautionary example).
3. **Copy-from-source on create** — the single most-loved affordance across products (WPML "Copy content from…", Polylang "Duplicate content", Strapi "Fill in from another locale", Prismic "Copy all content"). **We already have it**: `addTranslation` seeds the new entry from the source's data. Surface it with a "Translated from <source language>" hint so the editor knows the fields are pre-filled.
4. **Completeness at a glance** — the list matrix (item 1) doubles as the coverage indicator.

**Tier 2 (fast-follow) — high value, modest cost:**
5. **Inline source value while translating** (Storyblok/WPML ATE): beside each field in a non-source locale, show the source-locale value read-only with a "Copy" button. Captures ~80% of a side-by-side editor for ~10% of the cost.
6. **"Source updated → translation may be outdated" stale flag**: only WPML offers this natively, and our **version history makes it nearly free** — stamp each translation with the source version it was based on, and warn when the source has a newer published version. Include a "Minor edit — don't flag translations" escape hatch (WPML's exact pattern).

**Explicitly avoid (over-engineered for a small team):**
- **Field-level localized/shared split** (Strapi/Contentful/Payload) — conflicts with our per-entry model and adds a "which fields are shared" mental burden we don't need.
- **Side-by-side / multi-pane locale editing** (Contentful, WPML ATE) — high layout/complexity; navigate-to-switch + inline source (Tier 2 #5) is enough.
- **TMS / translation memory / glossary** — enterprise territory.
- **Session-global locale switcher** (Payload/Strapi) — our per-group, navigation-based switching is clearer.
- **List columns that show a count or joined values instead of the title/status** (Directus's mistake).

**Rationale**: These directly answer "make translating a page / adding a language easy." The list `＋` (Tier 1 #1) is the highest-leverage change and is pure server markup plus one small client action; copy-from-source already exists and just needs surfacing; the Tier 2 items are differentiators few headless CMSs offer and are cheap given our versioning.

**Sources**: official docs / plugin READMEs for Sanity (`@sanity/document-internationalization`, `internationalized-array`), Strapi i18n, Contentful localization, Storyblok i18n, Payload localization, Directus translations, WPML (Advanced Translation Editor, "+"-icon workflow), Polylang (duplicate content), Prismic (locales / "Copy to another locale"). Full URL list in the research dispatch.
