"use client";

import { useEffect, useState } from "react";

interface MediaItem {
  id: string;
  deliveryUrl: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
}

export default function MediaLibrary() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function load() {
    fetch("/api/media")
      .then((r) => r.json())
      .then((b) => setItems(b.items ?? []))
      .catch(() => setItems([]));
  }
  useEffect(load, []);

  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError("");
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/media", { method: "POST", body: form });
    setBusy(false);
    if (!res.ok) {
      const b = await res.json();
      setError(b.fields?.file ?? b.error ?? "Upload failed");
      return;
    }
    load();
  }

  async function remove(id: string) {
    await fetch(`/api/media/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--color-ink)]">Media</h1>
        <label className="cursor-pointer rounded bg-[var(--color-brand)] px-3 py-2 text-sm font-semibold text-white">
          {busy ? "Uploading..." : "Upload"}
          <input type="file" className="hidden" onChange={upload} />
        </label>
      </div>
      {error && <p className="mb-3 text-sm text-[var(--color-brand)]">{error}</p>}
      <div className="grid grid-cols-3 gap-3 md:grid-cols-5">
        {items.map((m) => (
          <div
            key={m.id}
            className="overflow-hidden rounded border border-[var(--color-line)]"
          >
            {m.mimeType.startsWith("image/") ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={m.deliveryUrl}
                alt={m.filename}
                className="h-24 w-full object-cover"
              />
            ) : (
              <div className="flex h-24 items-center justify-center text-xs">
                {m.filename}
              </div>
            )}
            <div className="flex items-center justify-between p-2">
              <span className="truncate text-xs">{m.filename}</span>
              <button
                onClick={() => remove(m.id)}
                className="text-xs text-[var(--color-brand)] underline"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <p className="col-span-full text-sm text-[var(--color-muted)]">
            No media yet.
          </p>
        )}
      </div>
    </div>
  );
}
