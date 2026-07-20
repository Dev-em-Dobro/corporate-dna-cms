# Contracts: CMS i18n — Delivery 1 (US1)

No new API endpoints. Delivery 1 reuses existing endpoints and adds an internal service plus client behaviors.

## API endpoints consumed (existing — unchanged)

### POST `/api/admin/{type}` — create an entry (now with a chosen language)

- **Auth**: session required.
- **Request**: `{ data, slug?, locale?, translationGroupId? }` — the create-mode language picker supplies `locale`.
- **Response 201**: the created entry (incl. `id`, `locale`, `translationGroupId`, `currentVersionId`).
- **Behavior**: defaults `locale` to `en` when omitted; assigns a fresh `translationGroupId` for a standalone new piece.

### POST `/api/admin/{type}/{id}/translate` — add a language variant

- **Auth**: session required.
- **Request**: `{ locale: string }`
- **Response 201**: the new linked entry (shares the source's `translationGroupId`, copies its data as a starting draft).
- **Errors**: 422 `locale is required`; 422 `{ fields: { locale: "A translation for this locale already exists" } }` on duplicate; 404 unknown type; 401.
- **Used by**: the TranslationBar "Create <language>" action, followed by navigation to the new entry's editor.

## Internal service (new)

### `listTranslations(translationGroupId): Promise<Translation[]>`

- Returns `{ id, locale, status }[]` for all non-deleted entries in the group.
- Called by the editor server components (collection `[id]` and singleton `[key]`) — not exposed as an HTTP endpoint.

## Configuration contract (new)

### `lib/content/locales.ts`

- `DEFAULT_LOCALE: string` — fallback/default language.
- `LOCALES: { code, label }[]` — active languages (open-ended).
- `isActiveLocale(code)`, `localeLabel(code)`, `activeLocales()`.
- Contract: any code not in `LOCALES` resolves to `DEFAULT_LOCALE`; pickers only ever offer `activeLocales()`.

## Client behavior contracts (new)

### C1 — Create-mode language picker (FR-011)

In create mode only (no entry id), the editor shows a language selector from `activeLocales()`, defaulting to `DEFAULT_LOCALE`, and includes the chosen `locale` in the create POST. Hidden in edit mode.

### C2 — Translation bar (FR-004, FR-005, FR-006, FR-007)

For an existing entry, the bar shows:
- the current language;
- a badge/link per **existing** language → navigates to `/{collection}/{siblingId}`;
- a "Create <language>" action per **missing** active language → POSTs `/translate`, then navigates to the new entry.
Duplicate creation is prevented server-side; the resulting message is surfaced.

### C3 — List grouping (FR-010)

The admin content list shows **one row per `translationGroupId`**, with the piece's title and one language badge/link per variant — never one unrelated row per language.

### C4 — Independence (FR-008, FR-009)

Switching/creating/editing/deleting one language variant never mutates its siblings; each keeps its own status and history (reuses existing per-entry behavior).
