# CMS Editor's Guide

A short guide for the Corporate DNA team to run the platform without a developer.

## Signing in

1. Go to the admin URL and enter your email + password.
2. Enter the 6-digit code from your authenticator app. The code is required for
   **everyone**, not only administrators.
3. You land on the **Dashboard** with content counts per type.

> Codes are rate-limited to 15 attempts per hour **for your whole office
> network**, not per person. If you see a rate-limit message, wait — retrying
> makes it worse for everyone.

### First sign-in (new accounts)

New accounts arrive by **email invitation** — there is no "ask a developer to
create my password". The flow is:

1. Open the invitation email and follow the link.
2. Choose your own password (no one else ever knows it).
3. Scan the QR code with an authenticator app (Google Authenticator, 1Password,
   Microsoft Authenticator…). Can't scan? Use **"Enter a key instead"** and type
   the setup key manually.
4. Enter the 6-digit code the app shows to finish. Until this step is done, the
   CMS itself stays locked.

### Forgot your password?

Use **"Forgot your password?"** on the sign-in screen. A reset link arrives by
email; it works once and expires. You will still need your authenticator code —
a password reset never bypasses it.

### Lost your phone / authenticator?

Ask an administrator to **reset MFA** for your account (Users → your row). Your
next sign-in walks you through scanning a fresh QR code.

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
- Administrators: keep at least two admins so no one is ever locked out. The
  system refuses to demote, disable, or delete the last active administrator —
  by design.
- Administrators invite users by email and can change roles, disable accounts,
  and reset MFA — but never set or see anyone's password or codes.
