"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<"password" | "mfa">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submitPassword(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const body = await res.json();
    setBusy(false);
    if (!res.ok) return setError(body.error ?? "Login failed");
    if (body.mfaRequired) {
      setChallengeId(body.challengeId);
      setStep("mfa");
    } else {
      router.push("/");
      router.refresh();
    }
  }

  async function submitMfa(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/auth/mfa", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ challengeId, code }),
    });
    const body = await res.json();
    setBusy(false);
    if (!res.ok) return setError(body.error ?? "Verification failed");
    router.push("/");
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-brand)]">
        Corporate DNA
      </p>
      <h1 className="mt-1 mb-6 text-2xl font-bold text-[var(--color-ink)]">
        CMS sign in
      </h1>

      {step === "password" ? (
        <form onSubmit={submitPassword} className="flex flex-col gap-3">
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded border border-[var(--color-line)] px-3 py-2"
          />
          <input
            type="password"
            required
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded border border-[var(--color-line)] px-3 py-2"
          />
          <button
            disabled={busy}
            className="rounded bg-[var(--color-brand)] px-3 py-2 font-semibold text-white disabled:opacity-60"
          >
            {busy ? "..." : "Continue"}
          </button>
        </form>
      ) : (
        <form onSubmit={submitMfa} className="flex flex-col gap-3">
          <p className="text-sm text-[var(--color-muted)]">
            Enter the 6-digit code from your authenticator app.
          </p>
          <input
            inputMode="numeric"
            required
            placeholder="123456"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="rounded border border-[var(--color-line)] px-3 py-2 tracking-widest"
          />
          <button
            disabled={busy}
            className="rounded bg-[var(--color-brand)] px-3 py-2 font-semibold text-white disabled:opacity-60"
          >
            {busy ? "..." : "Verify"}
          </button>
        </form>
      )}

      {error && <p className="mt-3 text-sm text-[var(--color-brand)]">{error}</p>}
    </main>
  );
}
