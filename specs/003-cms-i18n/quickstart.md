# Quickstart / Validation Guide: CMS i18n — Delivery 1 (US1)

Validate content-translation management in the admin. See [contracts/translation-contracts.md](./contracts/translation-contracts.md) and [data-model.md](./data-model.md) for details.

## Prerequisites

- App running locally (`npm run dev`), signed in to the admin.
- At least one existing published entry (e.g. a case) in the default language.
- Two or more active languages configured in `lib/content/locales.ts`.

## Automated checks

```bash
npx vitest run tests/unit/locales.test.ts tests/unit/translations.test.ts
npx tsc --noEmit
npx eslint lib/content/locales.ts lib/content/entries.ts components/TranslationBar.tsx components/ContentEditor.tsx
npm run build
```

## Scenario 1 — See which languages a piece has (FR-004)

1. Open an existing entry, e.g. `/cases/{id}`.
2. **Expect**: a translation bar shows the current language and, for each active language, whether this piece exists in it (link) or not (a "Create" action).

## Scenario 2 — Create a translation (FR-005, FR-006)

1. From the translation bar, choose a missing language and click "Create <language>".
2. **Expect**: a new linked draft opens in that language (same logical piece, shared translation group), pre-filled from the source.
3. Try creating the same language again.
4. **Expect**: it is prevented with a clear "already exists" message.

## Scenario 3 — Switch between languages and edit independently (FR-007, FR-008)

1. With a piece in two languages, use the bar to switch to the other language.
2. Edit and save that language; publish it.
3. Switch back.
4. **Expect**: each language shows its own content, status, and version history; publishing/saving one did not change the other.

## Scenario 4 — Choose the language when creating (FR-011)

1. Go to `/{collection}/new`.
2. **Expect**: a language selector defaulting to the default language, offering only the active languages.
3. Pick a non-default language, fill the form, save.
4. **Expect**: the entry is created in the chosen language.

## Scenario 5 — Admin list is not duplicated (FR-010)

1. Open the collection list for a type that has a piece in multiple languages.
2. **Expect**: that piece appears as **one** row with a language badge per variant (each linking to its editor), not as several unrelated rows.

## Scenario 6 — Singleton pages (research R5)

1. Open a singleton page editor (e.g. `/pages/book`).
2. **Expect**: it loads the default-language version and offers the same switch/create translation bar; creating another language works and does not disturb the default.

## Scenario 7 — Adding a language is one change (SC-005)

1. Append a new `{ code, label }` to `LOCALES` in `lib/content/locales.ts`.
2. **Expect**: the new language appears in the create selector and as a "Create" option in the translation bar, with no other code changes.

## Success mapping

| Scenario | Requirements | Success Criteria |
|----------|--------------|------------------|
| 1 | FR-004 | SC-002 |
| 2 | FR-005, FR-006 | SC-001 |
| 3 | FR-007, FR-008, FR-009 | SC-004 |
| 4 | FR-011 | SC-001 |
| 5 | FR-010 | SC-007 |
| 6 | FR-004..FR-008 (singleton) | SC-002, SC-004 |
| 7 | FR-001, FR-003 | SC-005 |
