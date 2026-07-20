# Feature Specification: CMS Internationalization (i18n)

**Feature Branch**: `002-cms-i18n`

**Created**: 2026-07-20

**Status**: Draft

**Input**: User description: "Sistema de internacionalização do CMS, multilíngue-ready desde o dia 1. O admin cadastra os idiomas numa tela, e esses idiomas ficam disponíveis para cadastrar conteúdo em cada um; conteúdo editorial multilíngue com relação entre versões de idioma e fallback; API pública por locale."

## Clarifications

Resolved with the user:

- **Languages are admin-managed (data-driven), not code-config**: an admin registers the available languages in a **Languages settings screen**; those languages then become the ones offered everywhere content is created/translated. (This supersedes the earlier idea of a code-only config list.)
- **Default language**: exactly one registered language is marked as the **default** (used for fallback). Currently the existing content is `en`.
- **Removing a language in use**: a language that already has content **cannot be deleted — only disabled** (soft). Disabling removes it from the pickers for new work but leaves existing content untouched. Deleting is allowed only for a language with no content.
- **Who manages languages**: **admins only** (editors use the languages but do not manage the list), consistent with user management.
- **First-delivery scope**: **US1 (manage languages) + US2 (content translations)**. US3 (public API polish) and US4 (admin-interface localization) are documented as **future**.
- **Public list fallback (US3, future)**: a public list requested in a language **fills gaps with the default-language version**, each item signaling the language served.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Manage the available languages (Priority: P1) 🎯 foundation

An admin opens a **Languages** settings screen and registers the languages the CMS should offer (e.g. English, Portuguese, Spanish) by giving each a code and a display name, and marks one as the default. From then on, those languages are the ones offered when editors create or translate content. The admin can add more languages at any time (no code change, no deploy), reorder them, and disable one so it stops being offered without deleting existing content in it.

**Why this priority**: Nothing else about multilingual content works predictably until "which languages exist" is a managed, single source of truth. Editors can only translate into languages the admin has made available, so this is the foundation the content stories build on.

**Independent Test**: As an admin, add a new language and set/confirm the default; confirm it immediately appears in the content language pickers; disable a language and confirm it disappears from the pickers while its existing content remains; confirm a non-admin cannot reach the screen.

**Acceptance Scenarios**:

1. **Given** the Languages screen, **When** an admin adds a language (code + name), **Then** it is saved and becomes available in every content language picker and translation control.
2. **Given** several languages exist, **When** an admin marks one as default, **Then** exactly one language is the default at any time, and it is the fallback target.
3. **Given** a language that has content, **When** an admin tries to remove it, **Then** deletion is blocked and only disabling is offered; disabling removes it from pickers but keeps its content.
4. **Given** a language with no content, **When** an admin deletes it, **Then** it is removed.
5. **Given** a non-admin (editor), **When** they try to open or change the Languages screen, **Then** access is denied.
6. **Given** the admin reorders languages, **When** pickers/badges render, **Then** they follow that order.

---

### User Story 2 - Manage content translations (Priority: P1)

An editor works on a piece of content (case, solution, person, region, insight, or a singleton page) and needs it in more than one of the **available** languages. From the editor they see which languages the piece already exists in and which are missing, create a new language version (pre-filled from the source to translate over), switch between versions to edit each one, and each version has its own draft/publish lifecycle. All versions of the same piece are recognizably linked.

**Why this priority**: This is the core "multilingual content" value. The data foundation (a language per entry, a shared translation-group link, and a create-translation operation that copies the source) already exists; this story is the editor UI over the admin-managed language set from US1.

**Independent Test**: With two languages available, open an entry, add a second-language version from the translation bar (pre-filled from the source), edit/save/publish it, switch back, and confirm both coexist as linked translations with independent status — all from the admin.

**Acceptance Scenarios**:

1. **Given** an entry in one language, **When** the editor opens it, **Then** it shows the current language and which **available** languages this piece has and is missing.
2. **Given** an entry in one language, **When** the editor creates a version in an available language, **Then** a linked translation is created, **pre-filled from the source**, and opened for editing.
3. **Given** a piece in two languages, **When** the editor switches language, **Then** that version's content/status is shown and editable independently.
4. **Given** the editor creates a translation for a language the piece already has, **Then** the duplicate is prevented with a clear message.
5. **Given** the admin content list, **When** an editor browses a type, **Then** each logical piece is one row showing its languages (existing) and a one-click way to add a missing one — never N unrelated rows.
6. **Given** the available-language set from US1, **When** any translation control offers a language, **Then** it offers exactly those languages, in the configured order.

---

### User Story 3 - Public API serves content by language with fallback (Priority: P2) — *out of this delivery (future)*

A consuming site requests content in a language; the API returns the published content in that language when it exists and falls back to the default language when a translation is missing, always signaling the language served.

**Independent Test**: Request an entry in a language with a translation → get it; in a language without → get the default (marked as fallback); a list → gaps filled with default-language items.

**Acceptance Scenarios**:

1. **Given** a piece published in the requested language, **When** requested, **Then** that language is returned and the served language is indicated.
2. **Given** a piece published only in the default language, **When** requested in another, **Then** the default is returned, marked as fallback.
3. **Given** a piece not published in any language, **When** requested, **Then** "not found" (no draft leakage).
4. **Given** a list in a language where some items lack it, **Then** gaps are filled with the default-language version, each item signaling its served language.

---

### User Story 4 - Localized admin interface (Priority: P3) — *out of this delivery (future)*

The admin interface strings (navigation, buttons, messages, validation) can be shown in more than one language, chosen per editor and persisted, independent of the content language.

**Acceptance Scenarios**:

1. **Given** the interface supports more than one language, **When** an editor selects one, **Then** the chrome renders in it.
2. **Given** a selected interface language, **When** the editor returns later, **Then** the choice persists.
3. **Given** the editor changes the interface language, **When** they edit content, **Then** the content language is unaffected.

---

### Edge Cases

- **No default set / more than one default**: the system must always resolve exactly one default language.
- **Disabling the default language**: must be prevented (or require choosing a new default first).
- **Disabling a language with content**: content stays and remains editable via direct links, but the language is no longer offered for new work.
- **Requesting/using a language not in the managed set**: resolves to the default rather than erroring.
- **Deleting one language version of a piece**: must not affect the other versions or the group link.
- **Publishing per language**: each language version publishes/unpublishes independently.
- **Admin list duplication**: the same logical piece in N languages must not read as N unrelated items.
- **Slug + language uniqueness**: keep `(type, slug, language)` unique while resolving the right variant.

## Requirements *(mandatory)*

### Functional Requirements

#### Language management (US1)

- **FR-001**: An admin MUST be able to register available languages (code + display name) through an admin screen; the registered set is the single source of truth used by all content language pickers, translation controls, and fallback logic.
- **FR-002**: The set MUST be open-ended — an admin can add any language at any time with no code change or deploy.
- **FR-003**: Exactly one registered language MUST be the default at all times; the default is the fallback target.
- **FR-004**: A language that has content MUST NOT be deletable; it can only be **disabled** (soft), which removes it from pickers for new work while leaving existing content intact. A language with no content MAY be deleted.
- **FR-005**: Language management (add/edit/reorder/set-default/enable-disable/delete) MUST be restricted to admins; editors have no access to it.
- **FR-006**: Disabling the default language MUST be prevented until another language is made default.
- **FR-007**: Language pickers and badges MUST present languages in the admin-configured order.
- **FR-008**: A selection or request referencing a language outside the active set MUST resolve to the default rather than failing.

#### Content translations (US2)

- **FR-009**: An editor MUST be able to see, from the editor, which available languages a piece exists in and which are missing.
- **FR-010**: An editor MUST be able to create a new language version of a piece; it MUST be linked to the same logical piece and **pre-filled from the source** version to translate over.
- **FR-011**: The system MUST prevent creating a second version in a language a piece already has, with a clear explanation.
- **FR-012**: An editor MUST be able to switch between language versions and edit each independently.
- **FR-013**: Each language version MUST have its own draft/publish status and version history; acting on one MUST NOT change the others.
- **FR-014**: Deleting one language version MUST NOT affect the other versions of the same piece.
- **FR-015**: The admin content lists MUST present each logical piece as one row showing its existing languages and a one-click way to add a missing available language.
- **FR-016**: When creating a brand-new piece, the editor MUST choose its language from the available set (defaulting to the default language).

#### Public delivery (US3 — future delivery)

- **FR-017**: The public API MUST return published content in the requested language when available.
- **FR-018**: For a single entry, when the requested language is unavailable, the API MUST return the default-language published content (fallback).
- **FR-019**: Localized responses MUST indicate the language actually served (including whether a fallback occurred).
- **FR-020**: List endpoints MUST fill missing-translation gaps with the default-language version, each item signaling the language served.
- **FR-021**: Unpublished/deleted content MUST never be returned in any language (no draft leakage).

#### Admin interface language (US4 — future delivery)

- **FR-022**: Admin interface strings MUST be translatable from a central place rather than hardcoded.
- **FR-023**: An editor MUST be able to select the interface language; it MUST persist across sessions and be independent of the content language.

### Key Entities *(include if feature involves data)*

- **Language (managed)**: a language the CMS offers — code, display name, default flag, enabled flag, sort order. Managed by admins in the Languages screen. The single source of truth. **New, persisted.**
- **Content Entry (localized)**: a piece of content in one specific language, with its own slug, status, and version history. Already exists; its `language` value should be one of the managed languages.
- **Translation Group**: the link tying together all language versions of one logical piece. Already exists.
- **Interface Language Preference (US4)**: the editor's chosen admin-UI language, persisted per user. Future.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: An admin can add a new language and have it appear in the content pickers in under 1 minute, with no code change or deploy.
- **SC-002**: An editor can add a new language version of an existing piece (pre-filled from the source) and save it in under 2 minutes, entirely from the admin.
- **SC-003**: From the editor and from the content list, an editor can tell which languages a piece has and which are missing at a glance.
- **SC-004**: Acting on one language version (edit/publish/delete) changes no other language version in 100% of cases.
- **SC-005**: A language that has content cannot be permanently removed; disabling it keeps its content intact in 100% of cases.
- **SC-006**: Non-admins cannot view or change the language list in 100% of attempts.
- **SC-007**: The same logical piece in N languages never appears as N unrelated items in admin lists.

## Assumptions

- **Existing foundation reused**: entries already carry a language and a translation-group link; a create-translation operation (which copies the source) and single-entry read fallback already exist. This feature adds the **admin-managed language registry**, the editor UI, and consistent behavior.
- **Managed languages replace the code config**: the available languages live in data (managed in the admin), not a code array. The `content_entries.language` column remains free-form text; the registry curates which languages are offered.
- **Per-language lifecycle**: draft/publish/versioning already operate per entry (per language) and are reused.
- **Content types in scope**: all types edited through the shared editor (cases, solutions, people, regions, insights, singleton pages).
- **No machine translation**: translations are authored by editors (AI/MT out of scope).
- **Interface vs content language**: the admin-UI language (US4) and the content language are independent.
