"use client";

import { useEffect, useState } from "react";
import { StatusMessage, Skeleton } from "./ui/Feedback";
import { useConfirm } from "./ui/useConfirm";
import { buttonPrimary, buttonDanger, input, select } from "./ui/styles";

interface UserRow {
  id: string;
  email: string;
  role: "admin" | "editor";
  status: "active" | "invited" | "disabled";
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
  const [role, setRole] = useState<"admin" | "editor">("editor");
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

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setNotice("");
    setBusy(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, role }),
      });
      const b = await res.json();
      if (!res.ok) return setError(b.error ?? "Could not invite the user.");
      setNotice(`Invitation sent to ${email} as ${role}.`);
      setEmail("");
      load();
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusy(false);
    }
  }

  async function resetMfa(user: UserRow) {
    const ok = await confirm({
      title: `Reset the second factor for ${user.email}?`,
      description:
        "Their current authenticator stops working immediately and they are signed out everywhere. They will set up a new one on their next sign-in.",
      confirmLabel: "Reset second factor",
      destructive: true,
    });
    if (!ok) return;
    setError("");
    setNotice("");
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "reset-mfa" }),
      });
      const b = await res.json();
      if (!res.ok) return setError(b.error ?? "Could not reset the second factor.");
      setNotice(`${user.email} will set up a new authenticator on next sign-in.`);
      load();
    } catch {
      setError("Could not reach the server.");
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
        onSubmit={invite}
        className="mb-6 max-w-3xl rounded-lg border border-line-strong p-5"
      >
        <h2 className="text-sm font-semibold text-ink">Invite user</h2>
        {/* Enrolment is now self-service, and there is no password field: you
            never handle someone else's credentials, and there is no secret to
            pass along out of band. */}
        <p className="mt-1 text-sm text-muted">
          They receive an email invitation, set their own password, and set up
          their own authenticator app on first sign-in. Nothing here needs to be
          sent to them separately.
        </p>

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

        </div>

        <div className="mt-5 flex justify-end border-t border-line pt-4">
          <button disabled={busy} aria-busy={busy} className={buttonPrimary}>
            {busy ? "Sending…" : "Send invitation"}
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

      <h2 className="mb-2 text-sm font-semibold text-ink">Users</h2>
      {loading ? (
        <Skeleton rows={3} className="mb-8" />
      ) : (
        <div className="mb-8 overflow-x-auto rounded-lg border border-line-strong">
          <table className="w-full min-w-[36rem] text-sm">
            <caption className="sr-only">
              CMS users with their role, account status, and second-factor actions
            </caption>
            <thead className="bg-paper text-left text-xs uppercase tracking-wide text-muted">
              <tr>
                <th scope="col" className="px-4 py-2 font-semibold">Email</th>
                <th scope="col" className="px-4 py-2 font-semibold">Role</th>
                <th scope="col" className="px-4 py-2 font-semibold">Status</th>
                <th scope="col" className="px-4 py-2 font-semibold">Second factor</th>
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
                      <option value="invited">Invited</option>
                      <option value="disabled">Disabled</option>
                    </select>
                  </td>
                  <td className="px-4 py-2">
                    {/* Enrolment state is not mirrored locally — it lives in
                        Supabase, and a cached copy here would silently drift
                        out of date. What an admin can actually do is reset it. */}
                    <button
                      type="button"
                      onClick={() => resetMfa(u)}
                      className={buttonDanger}
                    >
                      Reset
                    </button>
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
