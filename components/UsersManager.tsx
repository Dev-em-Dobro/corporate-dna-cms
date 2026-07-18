"use client";

import { useEffect, useState } from "react";

interface UserRow {
  id: string;
  email: string;
  role: "admin" | "editor";
  status: "active" | "invited" | "disabled";
  mfaEnabled: boolean;
  lastLoginAt: string | null;
}
interface AuditRow {
  id: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  actorId: string | null;
  createdAt: string;
}

export default function UsersManager() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [audit, setAudit] = useState<AuditRow[]>([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "editor">("editor");
  const [totpUri, setTotpUri] = useState("");
  const [error, setError] = useState("");

  function load() {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((b) => setUsers(b.items ?? []))
      .catch(() => {});
    fetch("/api/admin/audit?limit=50")
      .then((r) => r.json())
      .then((b) => setAudit(b.items ?? []))
      .catch(() => {});
  }
  useEffect(load, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setTotpUri("");
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password, role }),
    });
    const b = await res.json();
    if (!res.ok) return setError(b.error ?? "Failed");
    if (b.totpUri) setTotpUri(b.totpUri);
    setEmail("");
    setPassword("");
    load();
  }

  async function patch(id: string, body: Record<string, string>) {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const b = await res.json();
    if (!res.ok) return setError(b.error ?? "Failed");
    if (b.totpUri) setTotpUri(b.totpUri);
    load();
  }

  return (
    <div>
      <h1 className="mb-5 text-2xl font-bold text-[var(--color-ink)]">
        Users &amp; audit
      </h1>

      <form
        onSubmit={create}
        className="mb-6 flex flex-wrap items-end gap-2 rounded-lg border border-[var(--color-line)] p-4"
      >
        <input
          className="rounded border border-[var(--color-line)] px-2 py-1 text-sm"
          placeholder="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="rounded border border-[var(--color-line)] px-2 py-1 text-sm"
          placeholder="password (8+)"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <select
          className="rounded border border-[var(--color-line)] px-2 py-1 text-sm"
          value={role}
          onChange={(e) => setRole(e.target.value as "admin" | "editor")}
        >
          <option value="editor">editor</option>
          <option value="admin">admin</option>
        </select>
        <button className="rounded bg-[var(--color-brand)] px-3 py-1.5 text-sm font-semibold text-white">
          Create user
        </button>
      </form>

      {error && <p className="mb-3 text-sm text-[var(--color-brand)]">{error}</p>}
      {totpUri && (
        <p className="mb-4 break-all rounded bg-[var(--color-paper)] p-3 text-xs">
          MFA enrolment (share securely): <code>{totpUri}</code>
        </p>
      )}

      <table className="mb-8 w-full text-sm">
        <thead className="text-left text-xs uppercase text-[var(--color-muted)]">
          <tr>
            <th className="py-1">Email</th>
            <th>Role</th>
            <th>Status</th>
            <th>MFA</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-t border-[var(--color-line)]">
              <td className="py-1">{u.email}</td>
              <td>
                <select
                  value={u.role}
                  onChange={(e) => patch(u.id, { role: e.target.value })}
                  className="rounded border border-[var(--color-line)] px-1 text-xs"
                >
                  <option value="editor">editor</option>
                  <option value="admin">admin</option>
                </select>
              </td>
              <td>
                <select
                  value={u.status}
                  onChange={(e) => patch(u.id, { status: e.target.value })}
                  className="rounded border border-[var(--color-line)] px-1 text-xs"
                >
                  <option value="active">active</option>
                  <option value="disabled">disabled</option>
                </select>
              </td>
              <td>{u.mfaEnabled ? "on" : "off"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="mb-2 text-sm font-semibold uppercase tracking-widest text-[var(--color-muted)]">
        Recent audit
      </h2>
      <ul className="flex flex-col gap-1 text-xs">
        {audit.map((a) => (
          <li key={a.id} className="flex gap-3">
            <span className="text-[var(--color-muted)]">
              {new Date(a.createdAt).toLocaleString()}
            </span>
            <span className="font-medium">{a.action}</span>
            <span className="text-[var(--color-muted)]">
              {a.targetType} {a.targetId?.slice(0, 8)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
