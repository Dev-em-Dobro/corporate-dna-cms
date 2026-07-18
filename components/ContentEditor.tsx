"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { FieldSpec } from "@/lib/content/ui-fields";
import MediaPicker from "./MediaPicker";

interface Initial {
  id?: string;
  data: Record<string, unknown>;
  currentVersionId?: string | null;
  status?: string;
}

export default function ContentEditor({
  apiType,
  collection,
  mode,
  fields,
  initial,
  label,
  fixedSlug,
}: {
  apiType: string;
  collection: string;
  mode: "collection" | "singleton";
  fields: FieldSpec[];
  initial: Initial;
  label: string;
  /** Force a slug on create (used by singleton pages: book, 5h, privacy...). */
  fixedSlug?: string;
}) {
  const router = useRouter();
  const [data, setData] = useState<Record<string, unknown>>(initial.data);
  const [id, setId] = useState(initial.id);
  const [versionId, setVersionId] = useState(initial.currentVersionId ?? null);
  const [status, setStatus] = useState(initial.status ?? "draft");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  // Raw JSON text for `json` fields (parsed on save).
  const [jsonText, setJsonText] = useState<Record<string, string>>(() => {
    const m: Record<string, string> = {};
    for (const f of fields)
      if (f.kind === "json")
        m[f.name] = JSON.stringify(initial.data[f.name] ?? null, null, 2);
    return m;
  });

  function set(name: string, value: unknown) {
    setData((d) => ({ ...d, [name]: value }));
  }

  function buildPayload(): Record<string, unknown> | null {
    const payload = { ...data };
    for (const f of fields) {
      if (f.kind === "json") {
        try {
          payload[f.name] = JSON.parse(jsonText[f.name] || "null");
        } catch {
          setErrors({ [f.name]: "Invalid JSON" });
          return null;
        }
      }
    }
    return payload;
  }

  async function save() {
    setBusy(true);
    setMessage("");
    setErrors({});
    const payload = buildPayload();
    if (!payload) {
      setBusy(false);
      return;
    }
    const res = id
      ? await fetch(`/api/admin/${apiType}/${id}`, {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ data: payload, expectedVersionId: versionId }),
        })
      : await fetch(`/api/admin/${apiType}`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            data: payload,
            ...(fixedSlug ? { slug: fixedSlug } : {}),
          }),
        });
    const body = await res.json();
    setBusy(false);

    if (res.status === 422) return setErrors(body.fields ?? { _: body.error });
    if (res.status === 409) return setMessage(body.error);
    if (!res.ok) return setMessage(body.error ?? "Save failed");

    setId(body.id);
    setVersionId(body.currentVersionId ?? null);
    setStatus(body.status ?? "draft");
    setMessage("Saved.");
    if (!id && mode === "collection") {
      router.replace(`/${collection}/${body.id}`);
    }
  }

  async function doAction(action: "publish" | "unpublish") {
    if (!id) return;
    setBusy(true);
    setMessage("");
    setErrors({});
    const res = await fetch(`/api/admin/${apiType}/${id}/${action}`, {
      method: "POST",
    });
    const body = await res.json();
    setBusy(false);
    if (res.status === 422) return setErrors(body.fields ?? { _: body.error });
    if (!res.ok) return setMessage(body.error ?? "Action failed");
    setStatus(body.status);
    setMessage(action === "publish" ? "Published." : "Unpublished.");
  }

  async function preview() {
    if (!id) return;
    const res = await fetch(`/api/admin/${apiType}/${id}/preview`, {
      method: "POST",
    });
    if (res.ok) {
      const { url } = await res.json();
      window.open(url, "_blank");
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-ink)]">{label}</h1>
          <span className="text-xs uppercase tracking-widest text-[var(--color-muted)]">
            {status}
          </span>
        </div>
        {id && (
          <button
            onClick={preview}
            className="rounded border border-[var(--color-line)] px-3 py-1.5 text-sm"
          >
            Preview
          </button>
        )}
      </div>

      <div className="flex flex-col gap-4">
        {fields.map((f) => (
          <label key={f.name} className="flex flex-col gap-1">
            <span className="text-sm font-medium text-[var(--color-ink)]">
              {f.label}
              {f.required && <span className="text-[var(--color-brand)]"> *</span>}
            </span>
            {renderField(f)}
            {errors[f.name] && (
              <span className="text-xs text-[var(--color-brand)]">
                {errors[f.name]}
              </span>
            )}
          </label>
        ))}
      </div>

      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={save}
          disabled={busy}
          className="rounded bg-[var(--color-ink)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          Save draft
        </button>
        {id && status !== "published" && (
          <button
            onClick={() => doAction("publish")}
            disabled={busy}
            className="rounded bg-[var(--color-brand)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            Publish
          </button>
        )}
        {id && status === "published" && (
          <button
            onClick={() => doAction("unpublish")}
            disabled={busy}
            className="rounded border border-[var(--color-line)] px-4 py-2 text-sm"
          >
            Unpublish
          </button>
        )}
        {message && (
          <span className="text-sm text-[var(--color-muted)]">{message}</span>
        )}
      </div>
      {errors._ && (
        <p className="mt-2 text-sm text-[var(--color-brand)]">{errors._}</p>
      )}
    </div>
  );

  function renderField(f: FieldSpec) {
    const val = data[f.name];
    const input = "rounded border border-[var(--color-line)] px-3 py-2 text-sm";
    switch (f.kind) {
      case "textarea":
        return (
          <textarea
            className={input}
            rows={3}
            value={String(val ?? "")}
            onChange={(e) => set(f.name, e.target.value)}
          />
        );
      case "media":
        return (
          <MediaPicker
            value={typeof val === "string" && val ? val : undefined}
            onChange={(mediaId) => set(f.name, mediaId ?? "")}
          />
        );
      case "stringList":
        return (
          <textarea
            className={input}
            rows={2}
            placeholder="One per line"
            value={(Array.isArray(val) ? (val as string[]) : []).join("\n")}
            onChange={(e) =>
              set(
                f.name,
                e.target.value.split("\n").map((s) => s.trim()).filter(Boolean),
              )
            }
          />
        );
      case "facets":
        return <FacetsInput value={val} onChange={(v) => set(f.name, v)} />;
      case "json":
        return (
          <textarea
            className={`${input} font-mono`}
            rows={5}
            value={jsonText[f.name] ?? ""}
            onChange={(e) =>
              setJsonText((m) => ({ ...m, [f.name]: e.target.value }))
            }
          />
        );
      default:
        return (
          <input
            className={input}
            type={f.kind === "url" ? "url" : f.kind === "date" ? "date" : "text"}
            value={String(val ?? "")}
            onChange={(e) => set(f.name, e.target.value)}
          />
        );
    }
  }
}

function FacetsInput({
  value,
  onChange,
}: {
  value: unknown;
  onChange: (v: Record<string, string[]>) => void;
}) {
  const facets = (value as Record<string, string[]>) ?? {
    industry: [],
    service: [],
    region: [],
    outcome: [],
  };
  const keys = ["industry", "service", "region", "outcome"] as const;
  return (
    <div className="grid grid-cols-2 gap-2">
      {keys.map((k) => (
        <label key={k} className="flex flex-col gap-1">
          <span className="text-xs text-[var(--color-muted)]">{k}</span>
          <input
            className="rounded border border-[var(--color-line)] px-2 py-1 text-sm"
            placeholder="comma,separated"
            value={(facets[k] ?? []).join(", ")}
            onChange={(e) =>
              onChange({
                ...facets,
                [k]: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
              })
            }
          />
        </label>
      ))}
    </div>
  );
}
