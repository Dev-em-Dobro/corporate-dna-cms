---
description: "Task list for CMS i18n — Delivery 1 (US1 manage languages + US2 content translations + Deltas A/B)"
---

# Tasks: CMS Internationalization (i18n) — Delivery 1

**Input**: Design documents from `specs/003-cms-i18n/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/translation-contracts.md

**Tests**: Unit tests only for the pure rule modules (`locale-rules`, `translations`). DB-backed services and UI validate via `quickstart.md`.

**Note on prior work**: US2 (content translation UI) was already implemented against a static config in `lib/content/locales.ts`. This delivery **replaces that config with an admin-managed DB registry** (US1) and **adapts US2** to read it. Existing pieces (TranslationBar, grouping, create-mode picker) are kept and rewired, not rebuilt.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: parallelizable (different files, no dependency on incomplete tasks)
- **[Story]**: US1 (manage languages) or US2 (content translations)

## Path Conventions

Next.js single app at repo root: `db/schema/`, `db/migrations/`, `lib/content/`, `components/`, `app/(admin)/`, `app/api/admin/`, `tests/unit/`.

---

## Phase 1: Setup

- [x] T001 Verify baseline is green: `npx tsc --noEmit`, `npx vitest run`, `npm run build`.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The `locales` table + DB-backed registry service + pure rule logic that BOTH US1 (management) and US2 (content pickers) depend on.

**⚠️ CRITICAL**: Everything else depends on this.

- [x] T002 [P] Create `db/schema/locales.ts`: table `locales` with `code` (PK, text), `label` (text), `isDefault` (boolean), `enabled` (boolean, default true), `sortOrder` (integer), timestamps. Export it from `db/schema/index.ts`.
- [x] T003 Generate and apply the migration: run `npm run db:generate` to create the `locales` migration under `db/migrations/`, add **RLS enablement** for the new table (match the pattern in `db/migrations/0001_enable_rls.sql`) and a **seed** of `en` (default, enabled) + `pt-BR` (enabled). Applying (`npm run db:migrate`) is environment-dependent — document it in the task output.
- [x] T004 [P] Create `lib/content/locale-rules.ts` (pure, no DB): `resolveDefault(locales)` (the one `isDefault`, else first), `canDisable(locale, locales)` (not the default), `canDelete(locale, inUse)` (only when not default and `inUse === 0`), `sortLocales(locales)` (by `sortOrder` then code), and `nextDefaultSwap(locales, newDefaultCode)` (returns the set with exactly one default).
- [x] T005 [P] Write `tests/unit/locale-rules.test.ts`: exactly-one-default resolution and swap; `canDisable` false for default; `canDelete` false when in use or default, true otherwise; ordering.
- [x] T006 Rewrite `lib/content/locales.ts` as a **DB-backed registry service** (replacing the static config): `getLocales()` (all, ordered), `activeLocales()` (enabled, ordered), `getDefaultLocale()` (code), `resolveLocale(code)` (→ code if active else default), `localeLabel(code, locales)`. Uses `db` + `locale-rules`. Keep a hardcoded fallback default of `en` if the table is empty.

**Checkpoint**: The registry exists in the DB and is readable via the service; pure rules are unit-tested.

---

## Phase 3: User Story 1 - Manage the available languages (Priority: P1) 🎯 foundation

**Goal**: An admin adds/edits/reorders languages, sets the default, and enables/disables them from a Settings → Languages screen; the set drives content pickers.

**Independent Test**: As admin, add a language and confirm it appears in content pickers; disable one and confirm it leaves the pickers but keeps its content; a non-admin is denied.

### Implementation for User Story 1

- [x] T007 [US1] Add registry mutation services to `lib/content/locales.ts` (or `lib/content/locale-admin.ts`): `createLocale`, `updateLocale` (label/order), `setDefaultLocale` (atomic swap via `nextDefaultSwap`), `setLocaleEnabled` (guarded by `canDisable`), `deleteLocale` (guarded by `canDelete`, counting `content_entries` for that code as "in use"). Write an audit entry per change (reuse `writeAudit`).
- [x] T008 [P] [US1] Create `app/api/admin/locales/route.ts`: `GET` (list) and `POST` (add) behind `requireAdmin()`; validate code/label; 422 on duplicate code.
- [x] T009 [P] [US1] Create `app/api/admin/locales/[code]/route.ts`: `PATCH` (label/order/default/enabled) and `DELETE` (guarded) behind `requireAdmin()`; return a clear 4xx when a guard blocks (default disable, delete-in-use).
- [x] T010 [P] [US1] Create `components/LanguagesManager.tsx` (client, mirrors `components/UsersManager.tsx`): list languages with default/enabled indicators; add form (code + name); set-default, enable/disable toggles, reorder, and delete (delete disabled/hidden when in use). Surface guard errors.
- [x] T011 [US1] Create `app/(admin)/settings/languages/page.tsx`: an admin-only server page (`requireAdmin()`) that loads the registry and renders `LanguagesManager`.
- [x] T012 [US1] Add an admin-only "Languages" nav entry pointing to `/settings/languages` (wherever the admin nav items are defined, alongside the Users entry).

**Checkpoint**: Admins manage languages end-to-end; the set is the single source of truth. **Foundation deliverable.**

---

## Phase 4: User Story 2 - Content translations on the managed registry (Priority: P1)

**Goal**: The already-built translation UI reads the managed languages, plus the Delta A/B UX so adding a language is one click and copy-from-source is obvious.

**Independent Test**: With two managed languages, add a second-language version from the list "＋" (pre-filled from source), edit/publish it, switch back — independent status, grouped list, one-click add.

### Implementation for User Story 2

- [x] T013 [US2] Rewire the server pages to the DB registry (replace static `activeLocales()`/`DEFAULT_LOCALE` imports with the awaited service): `app/(admin)/[collection]/new/page.tsx`, `app/(admin)/[collection]/[id]/page.tsx`, `app/(admin)/[collection]/page.tsx`, `app/(admin)/pages/[key]/page.tsx`. Pass the resolved language list/default into the client components as before.
- [x] T014 [US2] Replace `tests/unit/locales.test.ts` (its static-config assertions no longer apply; the pure logic is covered by `locale-rules.test.ts`) — delete it or repoint it at the service's pure fallback behavior.
- [x] T015 [P] [US2] Delta A: create `components/AddTranslationButton.tsx` (client) — POSTs `/api/admin/{type}/{id}/translate` for a target locale and navigates to the new entry; surfaces the duplicate error. Factor the shared create logic with `TranslationBar` if convenient.
- [x] T016 [US2] Delta A: in `app/(admin)/[collection]/page.tsx`, render a per-active-language matrix on each grouped row — `✓` link for existing variants, `AddTranslationButton` "＋" for missing ones (seeded from the group's primary id).
- [x] T017 [US2] Delta B: in `components/TranslationBar.tsx` (and its host pages if needed), show a subtle "Translated from <source language>" hint when the current entry is a non-source translation (has siblings and isn't the default-language variant).

**Checkpoint**: Content translation runs on managed languages with one-click add-translation and clear copy-from-source.

---

## Phase 5: Polish & Cross-Cutting Concerns

- [x] T018 Run `npx vitest run` (incl. `locale-rules.test.ts`, `translations.test.ts`); ensure green.
- [x] T019 Run `npx tsc --noEmit`, `npx eslint` on all new/changed files, and `npm run build`; fix issues.
- [ ] T020 Apply the migration locally (`npm run db:migrate`) and walk `quickstart.md` + US1 scenarios manually against `npm run dev`: add/disable a language (admin), non-admin denied, add a translation from the list "＋", per-language publish independence.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (P1)**: none.
- **Foundational (P2)**: after Setup. **Blocks US1 and US2.**
- **US1 (P3)**: after Foundational. Its registry mutations + screen are needed for a real end-to-end, but US2 only needs the *read* service (also from Foundational), so US2 can proceed in parallel with US1's screen.
- **US2 (P4)**: after Foundational (read service). Independent of US1's admin screen.
- **Polish (P5)**: after US1 + US2.

### Within stories

- T002 → T003 (schema before migration). T004/T005 pure, parallel. T006 depends on T002+T004.
- US1: T007 (services) → T008/T009 (API) → T010 (UI) → T011 (page) → T012 (nav).
- US2: T013 (rewire) can run once T006 exists; T015 (button) parallel; T016 depends on T015; T017 edits `TranslationBar`.

### Parallel Opportunities

- Foundational: **T002, T004, T005** (distinct files). 
- US1: **T008, T009, T010** (distinct files) after T007.
- US2: **T015** (new file) parallel to T013.

---

## Implementation Strategy

1. **Foundational first** (T001–T006): table + migration + registry service + rules. Nothing works without it.
2. **US1** (T007–T012): the Languages screen — the capability the user asked for.
3. **US2** (T013–T017): rewire the existing translation UI to the registry, then add Delta A (one-click add) + Delta B (copy-from-source hint).
4. **Verify** (T018–T020).

MVP = Foundational + US1 (admins can manage languages) + US2 rewire (content uses them). Deltas A/B are the UX polish that makes it *easy*.

---

## Notes

- The `locale` column stays free-form; the `locales` table curates what's offered.
- Deltas C/D (inline source value; stale-translation flag) are Tier-2 future work — not in this delivery.
- Commit after each phase or logical group.
