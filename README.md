# Corporate DNA — Custom CMS

Custom **headless CMS** for the Corporate DNA platform. This is a **standalone project, separate
from the marketing site** (`consulting-dna-corporate`). The two communicate only over the published
read API + signed revalidation webhooks — the site never touches this project's database or admin.

- **Location**: `E:\projetos\corporate-dna-cms` (sibling of the site repo).
- **Deploy**: its own Vercel project (Impulse scope), own admin subdomain.
  > Impulse scope rule: the HEAD commit author for deploys must be `impulseaisolutions@gmail.com`.
- **Specs**: `specs/` (custom-cms + supabase-auth-migration).

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind 4 · Drizzle ORM + **Supabase Postgres** ·
**Supabase Auth** + mandatory TOTP MFA · Bunny.net (media) · Resend (email).

> The old Neon database is kept read-only during the rollback window; runtime now runs on Supabase.
> See `docs/handover.md` for the authoritative operational reference.

## Structure

```text
app/
  (admin)/       # authenticated admin UI (cases, solutions, people, regions,
                 # insights, legal pages, media, languages, users & audit)
  api/
    content/     # PUBLISHED read API (site-facing, cached) — published content only
    admin/       # authoring API (session-guarded, RBAC)
    media/       # uploads -> Bunny.net
    auth/        # Supabase Auth + TOTP two-step login
  preview/       # draft-aware preview (signed token)
db/
  schema/        # Drizzle schema
  migrations/    # drizzle-kit migrations
lib/
  auth/  content/  media/  audit/  webhooks/  users/  supabase/
tests/
  integration/  unit/
scripts/         # seed-admin, seed/photo/copy scripts, verify-cutover
```

## Features

### 🔐 Authentication & security
- Two-step login: password + **mandatory TOTP (MFA)** for every user.
- Self-service MFA enrolment on first sign-in (admins never see/set another user's password or TOTP secret).
- User invites by email; self-service password recovery that never bypasses MFA.
- Per-request guards (JWT via ES256/JWKS, cached) that re-read `role`/`status` from the DB — disabling an account blocks its very next request.
- Rate limiting and an `x-api-key` gate on the public read API.

### 📄 Content types
- **Collections**: Cases, Solutions, People, Regions, Insights.
- **Singletons (pages)**: 5H Framework, Book, Awards & partnerships, Legal pages (privacy, cookies, terms).
- Per-type Zod validation; required fields enforced on edit and at publish.

### ✍️ Content editor
- Schema-driven generic form supporting text, textarea, richtext, url, email, media, date, stringList, facets and json fields.
- Quill rich-text editor with inline image upload through the media pipeline (CDN URLs, never base64). **Paste is always inserted as plain text.**
- Case facets (industry / service / region / outcome) for filtering.
- Drag-and-drop ordering (e.g. People), row actions, and soft delete (single and group).

### 🔄 Publishing & versioning
- Draft → Published with a publish gate (required fields + referenced media must exist).
- Append-only version history; restore a previous version (records a new version); unpublish.

### 🌐 Internationalisation
- Manageable language registry (create, rename, reorder, enable/disable, set default).
- Translation groups (locale variants of one logical entry), translation creation, and locale fallback on the read API.

### 🖼️ Media
- Upload to Bunny.net storage + CDN (only metadata in Postgres); media picker and a media library.
- Media URL resolution in published output (`coverUrl`, `photoUrl`, `bannerUrl`, `items[].logoUrl`).

### 🔌 Public read API (site-facing)
- Published list by type, detail by slug, and singleton pages.
- Published-only by construction (no draft leakage); case filtering by facets.

### 👁️ Preview
- Signed-token preview route to view drafts exactly as they will render, without exposing them publicly.

### 📡 Webhooks
- HMAC-signed dispatch on publish/unpublish to registered endpoints (the site's `/api/revalidate`); webhook CRUD in the admin.

### 👥 Users & RBAC
- User management (invite, roles, enable/disable) with RBAC safeguards.

### 📋 Audit
- Append-only audit log of every mutation and auth event (IP/UA, rate-limits, session revocations); survives user deletion via an `actor_email` snapshot; audit view in the admin.

## Getting started

```bash
npm install
cp .env.example .env.local           # fill DATABASE_URL, DIRECT_URL, SUPABASE_*, BUNNY_*, RESEND_API_KEY, ...
npm run db:migrate                   # apply db/migrations via DIRECT_URL
npm run seed:admin -- you@corp.com 'StrongPass!'   # seeds the first admin
npm run dev                          # admin + API on http://localhost:3010
npm run build                        # production build
npm test                             # unit + (with a dedicated test target) integration
```

The seeded admin lands in the **bootstrap state**: on first sign-in they are routed to enrol their
own TOTP factor. See `docs/handover.md` for deploy, backup/recovery, the test-target rules, and
site-integration details.
