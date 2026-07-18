# Technical Handover — Corporate DNA CMS

## What this is

A custom headless CMS, a **standalone project** separate from the marketing site
(`consulting-dna-corporate`). It owns content authoring and exposes a published read API + signed
revalidation webhooks. The site consumes the read API only — no shared database or admin.

Spec/plan/contracts: `specs/001-custom-cms/` in the site repo.

## Architecture

- **Next.js 16 (App Router)** app on Vercel — hosts the admin UI, the authoring API, the published
  read API, and the preview renderer.
- **Neon Postgres** via Drizzle ORM. Schema in `db/schema/`; migrations in `db/migrations/`.
- **Auth**: custom signed-cookie sessions (jose) with a two-step login — password (argon2 via
  `@node-rs/argon2`) then mandatory **TOTP** (otplib) for admins. RBAC (admin/editor) enforced in
  `lib/auth/guards.ts`.
- **Media**: Bunny.net storage + CDN (`lib/media/bunny.ts`); only metadata is stored in Postgres.
- **Audit**: every mutation/auth event writes through `lib/audit/log.ts` (append-only `audit_log`).
- **Webhooks**: on publish/unpublish, `lib/webhooks/dispatch.ts` sends an HMAC-signed POST to
  registered endpoints (the site's `/api/revalidate`).

## Key modules

| Area | Path |
|---|---|
| DB client / schema | `db/index.ts`, `db/schema/*` |
| Content types + validation (Zod) | `lib/content/types.ts` |
| Entry service (CRUD, publish gate, versions, restore, translations) | `lib/content/entries.ts` |
| Published read service (facets, locale fallback) | `lib/content/published.ts` |
| Auth (session, password, totp, guards) | `lib/auth/*`, `lib/errors.ts` |
| Media (validate, Bunny) | `lib/media/*` |
| Users service (RBAC safeguards) | `lib/users/service.ts` |
| HTTP helpers / rate limit / read-key | `lib/http.ts` |
| Admin UI | `app/(admin)/*`, `components/*` |
| APIs | `app/api/admin/*`, `app/api/content/*`, `app/api/auth/*`, `app/api/media/*` |

## Environment (see `.env.example`)

`DATABASE_URL`, `AUTH_SECRET`, `PREVIEW_TOKEN_SECRET`, `READ_API_KEY`, `WEBHOOK_SIGNING_KEY`,
`BUNNY_STORAGE_ZONE`, `BUNNY_STORAGE_KEY`, `BUNNY_CDN_URL`, `RESEND_API_KEY`. Optional:
`BUNNY_STORAGE_HOST`, `EMAIL_FROM`, `SITE_ORIGIN` (CORS).

## Setup / operate

```bash
npm install
cp .env.example .env.local           # fill values
npm run db:migrate                   # apply db/migrations to Neon
npm run seed:admin -- you@corp.com 'StrongPass!'   # prints the TOTP otpauth URI
npm run dev                          # http://localhost:3010
npm run build                        # production build
npm test                             # unit + (with DATABASE_URL) integration
```

## Deploy

Its own Vercel project (Impulse scope), own Neon DB, admin subdomain. **The HEAD commit author for
deploys must be `impulseaisolutions@gmail.com`** or the Impulse team blocks the deploy.

## Site integration (the separate marketing repo)

- Read client: `lib/cms/client.ts` — set `CMS_URL`, `CMS_READ_API_KEY`.
- Revalidation receiver: `app/api/revalidate/route.ts` — set `CMS_WEBHOOK_SECRET` to match the CMS
  webhook endpoint secret. Register the site's `/api/revalidate` URL under **Users & audit →**
  (webhooks API) so publishes refresh the site within seconds.

## Backup & recovery

Neon provides point-in-time restore; keep automated backups on. Media lives in Bunny.net. To
rebuild: restore the Neon branch, re-point `DATABASE_URL`, redeploy. The site keeps serving its
last-built content while the CMS is briefly unavailable.

## Security notes

- Static/edge site + separate admin removes the public DB/plugin surface (the class of risk behind
  the prior WordPress breaches).
- Admin MFA is mandatory; RBAC + audit on every change.
- The published API is published-only by construction (no draft leakage); preview is a separate,
  token-gated route.
