"use client";

import { useEffect, useState } from "react";
import { StatusMessage, Skeleton } from "./ui/Feedback";
import { useConfirm } from "./ui/useConfirm";
import { buttonPrimary, input, select } from "./ui/styles";

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
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "editor">("editor");
  const [totpUri, setTotpUri] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirm, confirmDialog] = useConfirm();

  function load() {
    setLoading(true);
    Promise.all([
      fetch("/api/admin/users")
        .then((r) => r.json())
        .then((b) => setUsers(b.items ?? []))
        .catch(() => setError("Could not load users.")),
      fetch("/api/admin/audit?limit=50")
        .then((r) => r.json())
        .then((b) => setAudit(b.items ?? []))
        .catch(() => {}),
    ]).finally(() => setLoading(false));
  }
  useEffect(load, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setNotice("");
    setTotpUri("");
    setBusy(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password, role }),
      });
      const b = await res.json();
      if (!res.ok) return setError(b.error ?? "Could not create the user.");
      if (b.totpUri) setTotpUri(b.totpUri);
      setNotice(`${email} created as ${role}.`);
      setEmail("");
      setPassword("");
      load();
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusy(false);
    }
  }

  async function patch(id: string, body: Record<string, string>) {
    setError("");
    setNotice("");
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const b = await res.json();
      if (!res.ok) return setError(b.error ?? "Update failed.");
      if (b.totpUri) setTotpUri(b.totpUri);
      load();
    } catch {
      setError("Could not reach the server.");
    }
  }

  // Privilege and access changes are confirmed — a stray scroll over a <select>
  // must not silently promote someone to admin or lock them out.
  async function changeRole(user: UserRow, next: string) {
    if (next === user.role) return;
    const ok = await confirm({
      title: `Change ${user.email} to ${next}?`,
      description:
        next === "admin"
          ? "Admins can manage users, change roles, and view the full audit log."
          : "Editors lose access to user management and the audit log.",
      confirmLabel: `Make ${next}`,
      destructive: next === "admin",
    });
    if (!ok) return;
    setNotice(`${user.email} is now ${next}.`);
    patch(user.id, { role: next });
  }

  async function changeStatus(user: UserRow, next: string) {
    if (next === user.status) return;
    if (next === "disabled") {
      const ok = await confirm({
        title: `Disable ${user.email}?`,
        description:
          "They will be signed out and blocked from signing in until re-enabled.",
        confirmLabel: "Disable account",
        destructive: true,
      });
      if (!ok) return;
    }
    setNotice(`${user.email} is now ${next}.`);
    patch(user.id, { status: next });
  }

  return (
    <div>
      <h1 className="mb-5 text-2xl font-bold text-ink">Users &amp; audit</h1>

      <form
        onSubmit={create}
        className="mb-6 max-w-3xl rounded-lg border border-line-strong p-5"
      >
        <h2 className="text-sm font-semibold text-ink">Create user</h2>
        {/* There is no self-enrolment flow: the TOTP secret is generated
            server-side and shown here once. Say so, rather than implying the
            new user sets up MFA themselves. */}
        <p className="mt-1 text-sm text-muted">
          {role === "admin"
            ? "Admins always get MFA. The enrolment code appears below once after you create them — send it over a secure channel, they cannot retrieve it themselves."
            : "Editors sign in with this password alone. No MFA code is issued."}
        </p>

        {/* A grid, not a flex row: with `items-end` the password column's helper
            text dragged its input 22px out of line with every other control. */}
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="new-email" className="text-sm font-medium text-ink">
              Email
            </label>
            <input
              id="new-email"
              className={input}
              type="email"
              autoComplete="off"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="new-role" className="text-sm font-medium text-ink">
              Role
            </label>
            <select
              id="new-role"
              className={`${select} w-full`}
              value={role}
              onChange={(e) => setRole(e.target.value as "admin" | "editor")}
            >
              <option value="editor">Editor</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="new-password"
              className="text-sm font-medium text-ink"
            >
              Temporary password
            </label>
            <input
              id="new-password"
              className={input}
              type="password"
              autoComplete="new-password"
              minLength={8}
              aria-describedby="new-password-hint"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <span id="new-password-hint" className="text-xs text-muted">
              At least 8 characters.
            </span>
          </div>
        </div>

        <div className="mt-5 flex justify-end border-t border-line pt-4">
          <button disabled={busy} aria-busy={busy} className={buttonPrimary}>
            {busy ? "Creating…" : "Create user"}
          </button>
        </div>
      </form>

      {error && (
        <StatusMessage tone="error" className="mb-4">
          {error}
        </StatusMessage>
      )}
      {notice && (
        <StatusMessage tone="success" className="mb-4">
          {notice}
        </StatusMessage>
      )}
      {totpUri && (
        <div className="mb-4 rounded border border-line-strong bg-paper p-3">
          <p className="text-xs font-semibold text-ink">
            MFA enrolment — share this securely, it is shown only once
          </p>
          <code className="mt-1 block break-all text-xs text-muted">{totpUri}</code>
        </div>
      )}

      <h2 className="mb-2 text-sm font-semibold text-ink">Users</h2>
      {loading ? (
        <Skeleton rows={3} className="mb-8" />
      ) : (
        <div className="mb-8 overflow-x-auto rounded-lg border border-line-strong">
          <table className="w-full min-w-[36rem] text-sm">
            <caption className="sr-only">
              CMS users with their role, account status, and MFA state
            </caption>
            <thead className="bg-paper text-left text-xs uppercase tracking-wide text-muted">
              <tr>
                <th scope="col" className="px-4 py-2 font-semibold">Email</th>
                <th scope="col" className="px-4 py-2 font-semibold">Role</th>
                <th scope="col" className="px-4 py-2 font-semibold">Status</th>
                <th scope="col" className="px-4 py-2 font-semibold">MFA</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-line">
                  <th scope="row" className="px-4 py-2 text-left font-medium text-ink">
                    {u.email}
                  </th>
                  <td className="px-4 py-2">
                    <select
                      value={u.role}
                      onChange={(e) => changeRole(u, e.target.value)}
                      className={select}
                      aria-label={`Role for ${u.email}`}
                    >
                      <option value="editor">Editor</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-4 py-2">
                    <select
                      value={u.status}
                      onChange={(e) => changeStatus(u, e.target.value)}
                      className={select}
                      aria-label={`Status for ${u.email}`}
                    >
                      <option value="active">Active</option>
                      <option value="disabled">Disabled</option>
                    </select>
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        u.mfaEnabled
                          ? "bg-success-surface text-success"
                          : "bg-draft-surface text-draft"
                      }`}
                    >
                      {u.mfaEnabled ? "Enabled" : "Not set up"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2 className="mb-2 text-sm font-semibold text-ink">Recent audit</h2>
      {loading ? (
        <Skeleton rows={3} />
      ) : audit.length === 0 ? (
        <p className="text-sm text-muted">No audit entries yet.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-line text-sm">
          {audit.map((a) => (
            <li key={a.id} className="flex flex-wrap gap-x-3 gap-y-0.5 py-2">
              <time
                dateTime={a.createdAt}
                className="w-40 shrink-0 text-xs text-muted"
              >
                {new Date(a.createdAt).toLocaleString()}
              </time>
              <span className="font-medium text-ink">{a.action}</span>
              <span className="text-muted">
                {a.targetType} {a.targetId?.slice(0, 8)}
              </span>
            </li>
          ))}
        </ul>
      )}

      {confirmDialog}
    </div>
  );
}
