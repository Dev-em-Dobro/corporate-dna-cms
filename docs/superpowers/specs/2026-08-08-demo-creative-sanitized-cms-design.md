# Demo Criativo — CMS com dados sanitizados

**Data:** 2026-08-08
**Objetivo:** Permitir gravar/printar a interface do **admin (CMS)** para um criativo de marketing sem expor nenhum dado real do cliente (nomes, empresas, pessoas, logos) nem a marca "Corporate DNA".

## Contexto

- Este repositório é o **CMS/admin** (Next.js 16 + Drizzle + Postgres/Neon), separado do site de marketing.
- Conteúdo (cases, solutions, insights, people, home) vive na tabela `content_entries` (JSONB em `data`/`published_data`), banco apontado por `DATABASE_URL` (Neon).
- Login usa **Supabase Auth**; `guards.ts` resolve o usuário via `supabase.auth.getClaims()` e então busca `profiles` **no `DATABASE_URL`** por `id = claims.sub`. Sem profile correspondente no banco → admin bloqueia mesmo com login válido.
- Mídia (logos/fotos) mora no Bunny CDN e só aparece se referenciada no banco. Banco novo/vazio = biblioteca de mídia limpa (nenhum logo real vaza).
- A marca "Corporate DNA" aparece em 6 arquivos de UI do admin (linhas exatas em "Troca de marca").

## Decisões (confirmadas com o usuário)

| Tema | Decisão |
|---|---|
| O que o criativo mostra | Só o **admin/CMS** (não o site público) |
| O que esconder | Dados de conteúdo **+** a marca "Corporate DNA" |
| Banco demo | **Postgres local no Docker** (100% local, descartável) |
| Nome fictício da marca | **"Demo Studio"** |
| Imagens do conteúdo | **Placeholders genéricos** |

## Abordagem

Tudo numa branch descartável `demo/creative`. Nada vai para a nuvem; nada é mesclado.

### 1. Postgres local no Docker
- `docker-compose.demo.yml` com imagem `postgres:16`, porta host **5433** (evita colisão), volume nomeado.
- Script de init `docker/demo-init.sql` que roda na criação do container e cria os roles que a migration `0001_enable_rls.sql` exige:
  ```sql
  CREATE ROLE anon NOLOGIN;
  CREATE ROLE authenticated NOLOGIN;
  ```
  Sem isso, `REVOKE ... FROM anon, authenticated` na migration 0001 falha num Postgres puro.
- O app acessa via role `postgres` (dono das tabelas, bypassa RLS), então RLS habilitado não atrapalha.

### 2. Ambiente `.env.demo`
- Cópia do `.env.local` alterando **apenas**:
  - `DATABASE_URL=postgres://postgres:postgres@localhost:5433/postgres`
  - `DIRECT_URL=postgres://postgres:postgres@localhost:5433/postgres`
- Remover o `prepare:false` não é necessário (funciona local). As demais chaves (Supabase, Bunny, Resend) permanecem — Supabase Auth continua real só para login; a tela de login não expõe dado de cliente.
- Rodar o dev server com esse env (ex. `dotenv -e .env.demo -- npm run dev` ou copiar para `.env.local` temporariamente na branch — a definir no plano).

### 3. Schema no banco local
- `db:migrate` (usa `DIRECT_URL`) cria todo o schema no Postgres local vazio.

### 4. Seed demo fictício — `scripts/seed-demo.ts` (novo, NÃO reusa seeds reais)
Insere **1 de cada** com dados 100% fictícios e imagens placeholder:
- **1 profile** — `id` = id do usuário Supabase de login (obtido via service role por `ADMIN_EMAIL`), `email` fictício de exibição (ex. `admin@demostudio.dev`), `role: admin`, `status: active`. **Obrigatório** para o `guards.ts` liberar o admin.
- **1 case** (Client Impact) — empresa/cliente fictícios, banner placeholder.
- **1 solution** — banner placeholder.
- **1 insight** — autor = o profile demo.
- **1 person** — nome fictício, foto placeholder (avatar genérico).
- **1 page_home** — textos fictícios.
- Cada entry: `status: published`, com `data` **e** `published_data` preenchidos, `created_by`/`updated_by` = profile demo, para as listas e o editor aparecerem completos.
- Imagens: URLs de placeholder genérico (ex. `https://picsum.photos/seed/...` para banners, avatar genérico para pessoa). Sem nenhum asset do Bunny real.

### 5. Troca de marca "Corporate DNA" → "Demo Studio"
Substituir apenas nos arquivos do admin renderizados (branch descartável, edição direta):
- `components/AdminNav.tsx:115`
- `app/layout.tsx:13` (title) e `:14` (description)
- `app/login/LoginForm.tsx:85`
- `app/auth/update-password/UpdatePasswordForm.tsx:89`
- `app/auth/recover/RecoverForm.tsx:39`
- `app/auth/enrol/EnrolForm.tsx:71`

(Não tocar em tests/docs/scripts/e-mail — não aparecem no criativo.)

### 6. Descarte
- Ao terminar: `docker compose -f docker-compose.demo.yml down -v` (apaga o banco), descartar a branch `demo/creative`, restaurar `.env.local` se tiver sido sobrescrito.

## Componentes / arquivos novos ou alterados

| Arquivo | Ação |
|---|---|
| `docker-compose.demo.yml` | novo |
| `docker/demo-init.sql` | novo (roles anon/authenticated) |
| `.env.demo` | novo (git-ignored) |
| `scripts/seed-demo.ts` | novo |
| 6 arquivos de UI acima | edição de string de marca |

## Riscos / pontos de atenção
- **Profile de login:** obter o `claims.sub` correto. Plano: usar service role Supabase para buscar o usuário por `ADMIN_EMAIL` e usar esse `id` no profile demo. Se o ADMIN_EMAIL não existir no Supabase, criar/definir antes.
- **MFA/AAL:** se a conta exigir MFA, o fluxo de login do criativo precisa disso resolvido — usar conta sem MFA ou já enrolada.
- **`.env.demo` no `.gitignore`:** garantir que não seja commitado (contém chaves reais copiadas).
- **Nome exibido do usuário:** conferir se o header mostra e-mail do profile (usar o fictício) e não algo do Supabase.

## Fora de escopo (YAGNI)
- Site de marketing público.
- "Modo demo" runtime reutilizável / feature flag.
- Sanitizar e-mails transacionais, testes ou docs.
- Recriar todo o volume de conteúdo — apenas 1 de cada tipo.
