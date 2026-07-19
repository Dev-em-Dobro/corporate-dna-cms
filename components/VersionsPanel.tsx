"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { StatusBadge, StatusMessage, Skeleton } from "./ui/Feedback";
import { useConfirm } from "./ui/useConfirm";
import { buttonQuiet } from "./ui/styles";

interface Version {
  id: string;
  statusAtSave: string;
  createdAt: string;
  authorEmail: string | null;
}

export default function VersionsPanel({
  apiType,
  id,
}: {
  apiType: string;
  id: string;
}) {
  const router = useRouter();
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirm, confirmDialog] = useConfirm();

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/api/admin/${apiType}/${id}/versions`)
      .then((r) => r.json())
      .then((b) => setVersions(b.versions ?? []))
      .catch(() => setError("Could not load version history."))
      .finally(() => setLoading(false));
  }, [apiType, id]);

  useEffect(load, [load]);

  async function restore(version: Version) {
    const ok = await confirm({
      title: "Restore this version?",
      description: `The entry will be replaced with the version saved ${new Date(
        version.createdAt,
      ).toLocaleString()}. Your current content is kept in history, so this can be undone.`,
      confirmLabel: "Restore version",
    });
    if (!ok) return;

    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/${apiType}/${id}/restore`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ versionId: version.id }),
      });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        setError(b.error ?? "Restore failed.");
        return;
      }
      router.refresh();
      load();
    } catch {
      setError("Restore failed — could not reach the server.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-10 max-w-2xl border-t border-line pt-6">
      <h2 className="mb-3 text-sm font-semibold text-ink">Version history</h2>

      {error && (
        <StatusMessage tone="error" className="mb-3">
          {error}
        </StatusMessage>
      )}

      {loading ? (
        <Skeleton rows={3} />
      ) : versions.length === 0 ? (
        <p className="text-sm text-muted">
          No versions yet — they appear here after the first save.
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-line text-sm">
          {versions.map((v, i) => (
            <li
              key={v.id}
              className="flex flex-wrap items-center justify-between gap-2 py-1.5"
            >
              <span className="flex flex-wrap items-center gap-2">
                <time dateTime={v.createdAt} className="text-ink">
                  {new Date(v.createdAt).toLocaleString()}
                </time>
                <StatusBadge status={v.statusAtSave} />
                <span className="text-muted">{v.authorEmail ?? "Unknown author"}</span>
                {i === 0 && (
                  <span className="rounded-full bg-paper px-2 py-0.5 text-xs font-medium text-ink">
                    Current
                  </span>
                )}
              </span>
              {i !== 0 && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => restore(v)}
                  className={buttonQuiet}
                >
                  Restore
                  <span className="sr-only">
                    {" "}
                    version from {new Date(v.createdAt).toLocaleString()}
                  </span>
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {confirmDialog}
    </div>
  );
}
