# CMS Editor's Guide

A short guide for the Corporate DNA team to run the platform without a developer.

## Signing in

1. Go to the admin URL and enter your email + password.
2. Administrators then enter a 6-digit code from their authenticator app (MFA).
3. You land on the **Dashboard** with content counts per type.

## Content types

The left nav has one section per type:

- **Case studies** — challenge, approach, outcome, measurable result, client quote, cover image,
  optional YouTube video, and facets (industry / service / region / outcome) that power the
  filterable library on the site.
- **Solutions**, **People**, **Regions**, **Insights** — structured fields per type.
- **Pages** — the singletons: 5H Framework, Book, Awards & partnerships, and the legal pages
  (privacy / cookies / terms). One entry each.
- **Media** — the image/document library.
- **Users & audit** — administrators only.

## Editing workflow

1. Open a type and click **New** (or an existing row).
2. Fill the fields. Required fields are marked with a red `*`.
   - **Cover image / photo**: click **Choose** to pick from the media library or upload a new file.
   - **Facets** (cases): comma-separated values per facet.
   - **Complex fields** (CTA, 5H elements, awards items) use a small JSON editor.
3. **Save draft** — stores your work; it is NOT visible on the public site yet.
4. **Preview** — opens the entry exactly as it will render, including drafts (private link).
5. **Publish** — makes it live. Publishing is blocked if a required field is empty or a chosen
   image is missing; the error tells you what to fix.
6. **Unpublish** returns an entry to draft.

## Versions

Every save creates a version. On an entry's edit screen, the **Version history** panel lists all
versions with date and author. Click **Restore** on any earlier version to bring its content back
(the restore itself is saved as a new version, so nothing is lost).

## Media

Upload images and documents in **Media** (or inline via **Choose → Upload**). Videos are NOT
uploaded — paste a YouTube URL into the video field instead. Unsupported or oversized files are
rejected.

## Translations (later phases)

The model is multilingual-ready. Phase 1 is English only; when Spanish/Portuguese are added, an
entry gains locale variants without any rebuild.

## Good practice

- Write a clear title first — the URL slug is derived from it.
- Add descriptive **alt text** to images for accessibility and SEO.
- Preview before publishing.
- Administrators: keep at least two admins so no one is ever locked out.
