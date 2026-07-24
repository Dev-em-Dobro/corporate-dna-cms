# Deploy para produção — checklist

Passos para levar o CMS de local para produção, com foco no que difere do
ambiente de desenvolvimento. A auth (login, convite, recuperação) usa Supabase
hospedado + Resend como SMTP; a maioria dos ajustes abaixo é nesses dois
serviços, não no código.

## 🔴 Crítico — sem isso convite/e-mail quebram em produção

### 1. Verificar um domínio no Resend
Hoje o remetente do SMTP é `onboarding@resend.dev`, que **só entrega para o
e-mail dono da conta Resend** (`impulseaisolutions@gmail.com`). Com usuários
reais, todo convite falharia (403 → Supabase repassa como 500).

- Verifique um domínio em https://resend.com/domains (adicionar registros
  SPF/DKIM no DNS até ficar **Verified**).
- No Supabase → Authentication → Emails → SMTP Settings, troque o **Sender
  email** para `no-reply@seudominio`.

### 2. Site URL do Supabase
Authentication → URL Configuration → **Site URL**: trocar
`http://localhost:3010` → `https://SEU-DOMINIO-DE-PROD`.
É daqui que o link do e-mail de convite é montado (`{{ .SiteURL }}`).

### 3. Redirect URLs (allowlist)
Mesma tela → **Redirect URLs**: adicionar `https://SEU-DOMINIO-DE-PROD/**`
(mantenha `http://localhost:3010/**` para continuar testando local). A
recuperação de senha passa `redirectTo` baseado no domínio da requisição e
depende dessa allowlist.

## 🟡 Importante

### 4. Variáveis de ambiente na Vercel (Production)
Replicar as do `.env.local`: `DATABASE_URL`, `DIRECT_URL`, `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `AUTH_SECRET`,
`PREVIEW_TOKEN_SECRET`, `WEBHOOK_SIGNING_KEY`, `READ_API_KEY`, `RESEND_API_KEY`,
os `BUNNY_*`, e `SITE_URL` = **URL do site público** de produção (usado só nos
links de preview, em `app/api/admin/[type]/[id]/preview/route.ts`).

### 5. Templates de e-mail
Aplicar o mesmo ajuste do fluxo `/auth/confirm` também em **Reset Password**
(`type=recovery`) e **Confirm signup** (`type=signup`), não só no convite. O
link no HTML deve ser:

```
{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=TIPO
```

(`type=invite` para convite, `recovery` para reset, `signup` para confirmação.)
Cuidado: o editor do Supabase às vezes escapa `&` para `&amp;` — tem que ficar
`&type=...`.

### 6. Chaves JWT — NÃO MEXER
Deixar como está: a **HS256 legacy** como *Current key*. ⚠️ **Não migrar para
ES256-only** — isso quebra a geração de tokens de convite/recovery/confirmação
(`unrecognized JWT kid <nil> for algorithm ES256`). É o mesmo projeto Supabase,
então essa config já vale para produção.

## 🔒 Segurança — antes de subir

### 7. Trocar a senha do admin
A senha seed `Admin@123456` é fraca. Definir uma senha forte, principalmente em
produção.

### 8. Rotacionar a `RESEND_API_KEY`
A chave atual foi exposta durante o desenvolvimento. Gerar uma nova no Resend e
atualizar em 3 lugares: `.env.local`, a senha do SMTP no Supabase, e a env da
Vercel.

### 9. Não levar segredos de seed para produção
`ADMIN_EMAIL` / `ADMIN_PASSWORD` são só para o seed inicial — não configurar em
prod. `CMS_DISABLE_MFA` é variável morta (não usada em nenhum lugar do código)
— pode remover.

## ⚠️ Nota sobre múltiplos ambientes

A **Site URL** do Supabase é um valor único. Quando ela apontar para produção,
testar convite **localmente** vai gerar link de produção. Para testar o fluxo de
convite local depois disso, gere o link direto pela API em vez de depender do
e-mail:

```
http://localhost:3010/auth/confirm?token_hash=<hashed_token>&type=invite
```

onde `<hashed_token>` vem de `admin.auth.admin.generateLink({ type: 'invite', email })`
(`data.properties.hashed_token`).
