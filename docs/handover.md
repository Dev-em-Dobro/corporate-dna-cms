# Technical Handover — Corporate DNA CMS

## What this is

A custom headless CMS, a **standalone project** separate from the marketing site
(`consulting-dna-corporate`). It owns content authoring and exposes a published read API + signed
revalidation webhooks. The site consumes the read API only — no shared database or admin.

Spec/plan/contracts: `specs/001-custom-cms/` in the site repo.

## Architecture

- **Next.js 16 (App Router)** app on Vercel — hosts the admin UI, the authoring API, the published
  read API, and the preview renderer.
- **Supabase Postgres** via Drizzle ORM (postgres.js driver). Runtime connections go through
  Supavisor **transaction mode, port 6543** (`DATABASE_URL`, `prepare: false` is mandatory);
  migrations and `pg_dump` use `DIRECT_URL` (session mode, port 5432). Schema in `db/schema/`;
  migrations in `db/migrations/`. The user table is `profiles`, keyed by the `auth.users` UUID.
- **Auth**: **Supabase Auth** (`@supabase/ssr`). Two-step login — password, then mandatory **TOTP**
  for every user. Sessions live in Supabase-managed cookies refreshed by the root `proxy.ts`;
  enforcement happens per request in `lib/auth/guards.ts` over `getClaims()` (ES256, verified
  against a cached JWKS — no network round-trip). `role`/`status` are read from `profiles` on every
  guarded request, never from the JWT, so disabling an account refuses its very next request. New
  users are invited by email (`auth.admin.inviteUserByEmail`) and enrol their own factor on first
  sign-in — administrators can never set another user's password or see a TOTP secret. Password
  recovery is self-service from the sign-in screen and never bypasses MFA.
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
| Auth (guards, preview tokens) | `lib/auth/*`, `lib/errors.ts` |
| Supabase clients (browser / server / service-role / proxy) | `lib/supabase/*`, root `proxy.ts` |
| Media (validate, Bunny) | `lib/media/*` |
| Users service (RBAC safeguards) | `lib/users/service.ts` |
| HTTP helpers / rate limit / read-key | `lib/http.ts` |
| Admin UI | `app/(admin)/*`, `components/*` |
| APIs | `app/api/admin/*`, `app/api/content/*`, `app/api/auth/*`, `app/api/media/*` |

## Environment (see `.env.example`)

`DATABASE_URL`, `DIRECT_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`,
`SUPABASE_SERVICE_ROLE_KEY` (server-only — never `NEXT_PUBLIC_`), `PREVIEW_TOKEN_SECRET`,
`READ_API_KEY`, `WEBHOOK_SIGNING_KEY`, `BUNNY_STORAGE_ZONE`, `BUNNY_STORAGE_KEY`, `BUNNY_CDN_URL`,
`RESEND_API_KEY`. Optional: `BUNNY_STORAGE_HOST`, `EMAIL_FROM`, `SITE_ORIGIN` (CORS).

`AUTH_SECRET` is retired from the app but must **stay in the deployed environment until the
rollback window closes** — rolling back restores the old auth stack, which needs it.

## Setup / operate

```bash
npm install
cp .env.example .env.local           # fill values
npm run db:migrate                   # apply db/migrations via DIRECT_URL
npm run seed:admin -- you@corp.com 'StrongPass!'   # seeds the first admin
npm run dev                          # http://localhost:3010
npm run build                        # production build
npm test                             # unit + (with DATABASE_URL) integration
```

The seeded admin lands in the **bootstrap state**: on first sign-in they are routed to enrol their
own TOTP factor (there is no API to enrol one on their behalf). Integration tests hit the real
Supabase project; note the platform caps MFA verifications at **15/hour per IP**, so back-to-back
full runs inside one hour will start returning 429s.

## Deploy

Its own Vercel project (Impulse scope), own Neon DB, admin subdomain. **The HEAD commit author for
deploys must be `impulseaisolutions@gmail.com`** or the Impulse team blocks the deploy.

## Site integration (the separate marketing repo)

- Read client: `lib/cms/client.ts` — set `CMS_URL`, `CMS_READ_API_KEY`.
- Revalidation receiver: `app/api/revalidate/route.ts` — set `CMS_WEBHOOK_SECRET` to match the CMS
  webhook endpoint secret. Register the site's `/api/revalidate` URL under **Users & audit →**
  (webhooks API) so publishes refresh the site within seconds.

## Backup & recovery

The database is **Supabase Postgres**. What you get depends on the plan tier — record the current
tier and PITR status in `specs/001-supabase-auth-migration/research.md` risk R2 (task T004) and
keep this section honest when it changes:

- **Free tier: there are NO automated backups and NO point-in-time restore.** The replacement is a
  scheduled logical dump someone must own:

  ```bash
  # Runs against the session-mode connection (DIRECT_URL, port 5432).
  pg_dump "$DIRECT_URL" --format=custom --no-owner \
    --file "cms-$(date +%Y%m%d).dump"
  # Restore: pg_restore --clean --if-exists -d "$DIRECT_URL" cms-YYYYMMDD.dump
  ```

  Schedule it (cron / GitHub Actions) daily and store dumps off-platform. Note `auth.users` lives
  in the Supabase-owned `auth` schema — a `public`-schema dump alone does not carry accounts;
  accounts can be re-invited, content cannot be retyped.
- **Pro tier and up**: daily automated backups (and PITR as an add-on) — verify they are enabled in
  the Dashboard rather than assuming.

Media lives in Bunny.net and is unaffected either way.

**Rollback (while the window is open)**: the old **Neon** project is kept alive and readable
(FR-023). Repoint `DATABASE_URL`/`DIRECT_URL` at Neon, redeploy, and the previous system returns
intact — which is also why `AUTH_SECRET` stays in the environment. Decommissioning Neon is the one
action that makes the cutover irreversible; do not do it until the window is formally closed.

## Security notes

- Static/edge site + separate admin removes the public DB/plugin surface (the class of risk behind
  the prior WordPress breaches).
- MFA is mandatory for every account; RBAC + audit on every change. Audit rows survive user
  deletion (`actor_id` nulls out, `actor_email` snapshot keeps them readable) — deliberately
  diverging from Supabase's documented blanket cascade.
- The published API is published-only by construction (no draft leakage); preview is a separate,
  token-gated route.
