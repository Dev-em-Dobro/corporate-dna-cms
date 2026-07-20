# Phase 1 Data Model: CMS i18n — Delivery 1 (US1 + US2)

**One new table** (`locales`, admin-managed registry). The content structure already exists and is unchanged.

## New entity — Language registry (`locales`)

Admin-managed source of truth for the available languages (US1).

| Column | Meaning |
|--------|---------|
| `code` (PK) | Language code, e.g. `en`, `pt-BR` (matches `content_entries.locale`). |
| `label` | Display name, e.g. "English", "Português (Brasil)". |
| `isDefault` | Exactly one row is `true` — the fallback/default language. |
| `enabled` | Soft-disable: `false` hides it from pickers without touching content. |
| `sortOrder` | Order in pickers/badges. |
| timestamps | created/updated. |

**Rules** (enforced in the service / `locale-rules.ts`):
- Exactly one `isDefault = true` at all times; setting a new default clears the old one.
- The default language cannot be disabled or deleted until another is made default.
- A language with any `content_entries` row cannot be deleted — only disabled.

**Seed**: `en` (default, enabled) + `pt-BR` (enabled), matching existing content.

## Persisted entities (existing — unchanged)

### Content Entry (`content_entries`)

- `id` — identifier.
- `type` — content type.
- `slug` — URL slug.
- `locale` — **free-form language code** (text, default `en`). Any language is valid at this layer.
- `translationGroupId` — **uuid linking all language variants** of the same logical piece (indexed). Defaults to a fresh uuid on create; shared when a translation is added.
- `status` — `draft | published | archived` (per language).
- `currentVersionId`, `data`, `deletedAt`, timestamps — as today.
- **Uniqueness**: `unique(type, slug, locale)` — one entry per language per slug.

**Relationships**: entries with the same `translationGroupId` are language variants of one another. Each has independent status and version history.

## Configuration (new — `lib/content/locales.ts`)

Not persisted; a code-level single source of truth.

| Symbol | Meaning |
|--------|---------|
| `DEFAULT_LOCALE` | The default/fallback language code (`en`, configurable). |
| `LOCALES` | Open-ended array of `{ code: string; label: string }` — the **active** languages offered in admin pickers. |
| `isActiveLocale(code)` | Whether a code is in the active set. |
| `localeLabel(code)` | Human label for a code (falls back to the code itself). |
| `activeLocales()` | The active list for pickers/badges. |

**Rule**: a selection outside the active set resolves to `DEFAULT_LOCALE`. Adding a language = appending to `LOCALES`.

## Derived shapes (new — service + UI)

### `listTranslations(translationGroupId)` → `Translation[]`

Sibling lookup for the editor. Query `content_entries` where `translationGroupId = ?` and `deletedAt IS NULL`.

```
Translation = { id: string; locale: string; status: string }
```

### Editor translation view-model (assembled in the server component)

```
{
  currentLocale: string,           // this entry's locale
  translationGroupId: string,
  existing: Translation[],         // languages that exist (from listTranslations)
  missing: { code, label }[],      // activeLocales() minus existing locales
}
```

Used by `TranslationBar` to render: current language, links to existing ones, and "create" actions for missing ones.

### Admin list grouping (server component)

`listEntries(type)` rows grouped by `translationGroupId`:

```
GroupedItem = {
  translationGroupId: string,
  title: string,                   // from default-locale variant if present, else first
  variants: { id, locale, status }[]   // one badge/link each
}
```

## State transitions

Unchanged. Each language variant follows the existing draft → published → (unpublished/archived) lifecycle independently. Creating a translation adds a new `draft` entry in the group; it never alters siblings.
