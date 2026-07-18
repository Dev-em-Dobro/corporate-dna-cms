"use client";

import { useEffect, useState } from "react";

interface MediaItem {
  id: string;
  deliveryUrl: string;
  filename: string;
  mimeType: string;
}

export default function MediaPicker({
  value,
  onChange,
}: {
  value?: string;
  onChange: (id: string | undefined) => void;
}) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<MediaItem[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    fetch("/api/media")
      .then((r) => r.json())
      .then((b) => setItems(b.items ?? []))
      .catch(() => setItems([]));
  }, [open]);

  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/media", { method: "POST", body: form });
    setBusy(false);
    if (res.ok) {
      const asset = await res.json();
      setItems((prev) => [
        { id: asset.id, deliveryUrl: asset.deliveryUrl, filename: file.name, mimeType: asset.mimeType },
        ...prev,
      ]);
      onChange(asset.id);
      setOpen(false);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        {value ? (
          <code className="rounded bg-[var(--color-paper)] px-2 py-1 text-xs">
            {value}
          </code>
        ) : (
          <span className="text-xs text-[var(--color-muted)]">No media</span>
        )}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded border border-[var(--color-line)] px-2 py-1 text-xs"
        >
          Choose
        </button>
        {value && (
          <button
            type="button"
            onClick={() => onChange(undefined)}
            className="text-xs text-[var(--color-muted)] underline"
          >
            Clear
          </button>
        )}
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6"
          onClick={() => setOpen(false)}
        >
          <div
            className="max-h-[80vh] w-full max-w-3xl overflow-auto rounded-lg bg-white p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold">Media library</h3>
              <label className="cursor-pointer rounded bg-[var(--color-brand)] px-3 py-1.5 text-xs font-semibold text-white">
                {busy ? "Uploading..." : "Upload"}
                <input type="file" className="hidden" onChange={upload} />
              </label>
            </div>
            <div className="grid grid-cols-3 gap-3 md:grid-cols-4">
              {items.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    onChange(m.id);
                    setOpen(false);
                  }}
                  className="overflow-hidden rounded border border-[var(--color-line)] hover:border-[var(--color-brand)]"
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
                </button>
              ))}
              {items.length === 0 && (
                <p className="col-span-full text-sm text-[var(--color-muted)]">
                  No media yet — upload one.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
