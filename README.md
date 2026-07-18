# Corporate DNA — Custom CMS

Custom **headless CMS** for the Corporate DNA platform. This is a **standalone project, separate
from the marketing site** (`consulting-dna-corporate`). The two communicate only over the published
read API + signed revalidation webhooks — the site never touches this project's database or admin.

- **Location**: `E:\projetos\corporate-dna-cms` (sibling of the site repo).
- **Deploy**: its own Vercel project (Impulse scope), own Neon database, own admin subdomain.
  > Impulse scope rule: the HEAD commit author for deploys must be `impulseaisolutions@gmail.com`.
- **Specs**: `specs/001-custom-cms/` in the site repo (spec, plan, research, data-model, contracts,
  quickstart, tasks).

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind 4 · Drizzle ORM + Neon Postgres · Auth.js + TOTP MFA
· Bunny.net (media) · Resend (email). See the plan for rationale.

## Structure

```text
app/
  (admin)/       # authenticated admin UI (login, cases, solutions, people, regions,
                 # insights, pages, media, users)
  api/
    content/     # PUBLISHED read API (site-facing, cached) — published content only
    admin/       # authoring API (session-guarded, RBAC)
    media/       # uploads -> Bunny.net
    auth/        # Auth.js + TOTP two-step login
    webhooks/    # outbound revalidation dispatch config
  preview/       # draft-aware preview (signed token)
db/
  schema/        # Drizzle schema
  migrations/    # drizzle-kit migrations
lib/
  auth/  content/  media/  audit/  webhooks/
contracts/       # API contracts (mirrored from specs)
tests/
  contract/  integration/  unit/
scripts/         # seed-admin, etc.
```

## Getting started

```bash
npm install
cp .env.example .env.local   # fill DATABASE_URL, AUTH_SECRET, BUNNY_*, RESEND_API_KEY, ...
npm run dev                  # admin + API on http://localhost:3010
```

Next implementation steps follow `tasks.md` in the specs (T003: dependencies → T008+: schema, auth,
content types).

## Status

**Skeleton only** (tasks T001–T002). No dependencies installed beyond the Next.js base, no schema or
routes implemented yet.
