"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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
  const [busy, setBusy] = useState(false);

  function load() {
    fetch(`/api/admin/${apiType}/${id}/versions`)
      .then((r) => r.json())
      .then((b) => setVersions(b.versions ?? []))
      .catch(() => setVersions([]));
  }
  useEffect(load, [apiType, id]);

  async function restore(versionId: string) {
    setBusy(true);
    await fetch(`/api/admin/${apiType}/${id}/restore`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ versionId }),
    });
    setBusy(false);
    router.refresh();
    load();
  }

  return (
    <div className="mt-10 border-t border-[var(--color-line)] pt-6">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-[var(--color-muted)]">
        Version history
      </h2>
      <ul className="flex flex-col gap-1 text-sm">
        {versions.map((v, i) => (
          <li
            key={v.id}
            className="flex items-center justify-between rounded px-2 py-1 hover:bg-[var(--color-paper)]"
          >
            <span>
              {new Date(v.createdAt).toLocaleString()} · {v.statusAtSave} ·{" "}
              {v.authorEmail ?? "—"}
              {i === 0 && (
                <span className="ml-2 text-xs text-[var(--color-brand)]">
                  current
                </span>
              )}
            </span>
            {i !== 0 && (
              <button
                disabled={busy}
                onClick={() => restore(v.id)}
                className="text-xs underline"
              >
                Restore
              </button>
            )}
          </li>
        ))}
        {versions.length === 0 && (
          <li className="text-[var(--color-muted)]">No versions yet.</li>
        )}
      </ul>
    </div>
  );
}
