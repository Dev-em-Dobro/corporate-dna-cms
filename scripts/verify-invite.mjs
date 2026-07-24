/**
 * Verifica se o fluxo de convite (Supabase admin.inviteUserByEmail) está funcionando.
 *
 * Reproduz exatamente o caminho de POST /api/admin/users -> inviteUser().
 * Cria um usuário de teste descartável e o remove em seguida.
 *
 * Uso:  node scripts/verify-invite.mjs
 */
import { readFileSync } from "fs";

// carrega .env.local sem dependências
for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2].trim().replace(/^"|"$/g, "");
}

const { createClient } = await import("@supabase/supabase-js");
const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

// Passe seu e-mail como argumento. Com o remetente de teste do Resend
// (onboarding@resend.dev), precisa ser o e-mail da SUA conta Resend.
//   node scripts/verify-invite.mjs voce@seudominio.com
const email = process.argv[2];
if (!email) {
  console.error("Uso: node scripts/verify-invite.mjs SEU-EMAIL");
  console.error("(com onboarding@resend.dev use o e-mail da sua conta Resend)");
  process.exit(2);
}
console.log("→ Convidando:", email);

const { data, error } = await admin.auth.admin.inviteUserByEmail(email);

if (error) {
  console.error("❌ FALHOU — o convite ainda não funciona:");
  console.error("   status:", error.status, "| name:", error.name);
  console.error("   message:", error.message);
  if (/already/i.test(error.message) || error.status === 422)
    console.error("   (esse e-mail já existe como usuário — tente outro endereço)");
  process.exit(1);
}

console.log("✅ SUCESSO — convite gerado. user id:", data.user.id);

// limpeza: remove o usuário de teste
const { error: delErr } = await admin.auth.admin.deleteUser(data.user.id);
console.log(delErr ? "⚠ não consegui limpar o usuário de teste" : "🧹 usuário de teste removido");
