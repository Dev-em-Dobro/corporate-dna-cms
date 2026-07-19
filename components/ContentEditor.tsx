"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { FieldSpec } from "@/lib/content/ui-fields";
import MediaPicker from "./MediaPicker";
import { StatusBadge, StatusMessage } from "./ui/Feedback";
import {
  buttonDark,
  buttonPrimary,
  buttonSecondary,
  input,
  textarea,
} from "./ui/styles";

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
  const formId = useId();
  const [data, setData] = useState<Record<string, unknown>>(initial.data);
  const [id, setId] = useState(initial.id);
  const [versionId, setVersionId] = useState(initial.currentVersionId ?? null);
  const [status, setStatus] = useState(initial.status ?? "draft");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{
    tone: "success" | "error";
    text: string;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const errorSummaryRef = useRef<HTMLDivElement>(null);

  // Raw JSON text for `json` fields (parsed on save).
  const [jsonText, setJsonText] = useState<Record<string, string>>(() => {
    const m: Record<string, string> = {};
    for (const f of fields)
      if (f.kind === "json")
        m[f.name] = JSON.stringify(initial.data[f.name] ?? null, null, 2);
    return m;
  });

  // Warn before losing unsaved edits on reload/close. In-app navigation is
  // guarded separately by the browser only for full loads, so keep edits
  // visible by never clearing state on failure.
  useEffect(() => {
    if (!dirty) return;
    function onBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  // Send focus to the error summary so keyboard users land on the problem.
  useEffect(() => {
    if (Object.keys(errors).length > 0) errorSummaryRef.current?.focus();
  }, [errors]);

  function set(name: string, value: unknown) {
    setDirty(true);
    setData((d) => ({ ...d, [name]: value }));
  }

  function buildPayload(): Record<string, unknown> | null {
    const payload = { ...data };
    for (const f of fields) {
      if (f.kind === "json") {
        try {
          payload[f.name] = JSON.parse(jsonText[f.name] || "null");
        } catch {
          setErrors({ [f.name]: "Invalid JSON — check for a trailing comma or unquoted key." });
          return null;
        }
      }
    }
    return payload;
  }

  async function save() {
    setBusy(true);
    setMessage(null);
    setErrors({});
    const payload = buildPayload();
    if (!payload) {
      setBusy(false);
      return;
    }
    try {
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

      if (res.status === 422)
        return setErrors(body.fields ?? { _: body.error ?? "Validation failed" });
      if (res.status === 409)
        return setMessage({
          tone: "error",
          text:
            body.error ??
            "Someone else saved this entry while you were editing. Reload to get their changes.",
        });
      if (!res.ok)
        return setMessage({ tone: "error", text: body.error ?? "Save failed" });

      setId(body.id);
      setVersionId(body.currentVersionId ?? null);
      setStatus(body.status ?? "draft");
      setDirty(false);
      setMessage({ tone: "success", text: "Draft saved." });
      if (!id && mode === "collection") {
        router.replace(`/${collection}/${body.id}`);
      }
    } catch {
      setMessage({
        tone: "error",
        text: "Could not reach the server. Your edits are still here — retry.",
      });
    } finally {
      setBusy(false);
    }
  }

  async function doAction(action: "publish" | "unpublish") {
    if (!id) return;
    setBusy(true);
    setMessage(null);
    setErrors({});
    try {
      const res = await fetch(`/api/admin/${apiType}/${id}/${action}`, {
        method: "POST",
      });
      const body = await res.json();
      if (res.status === 422)
        return setErrors(body.fields ?? { _: body.error ?? "Validation failed" });
      if (!res.ok)
        return setMessage({ tone: "error", text: body.error ?? "Action failed" });
      setStatus(body.status);
      setMessage({
        tone: "success",
        text: action === "publish" ? "Published." : "Unpublished.",
      });
    } catch {
      setMessage({ tone: "error", text: "Could not reach the server. Retry." });
    } finally {
      setBusy(false);
    }
  }

  async function preview() {
    if (!id) return;
    // Open synchronously inside the click gesture, then redirect. Calling
    // window.open() after an await gets blocked as an unsolicited popup.
    const tab = window.open("", "_blank");
    try {
      const res = await fetch(`/api/admin/${apiType}/${id}/preview`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("preview failed");
      const { url } = await res.json();
      if (tab) tab.location.href = url;
      else setMessage({ tone: "error", text: "Allow popups to open the preview." });
    } catch {
      tab?.close();
      setMessage({ tone: "error", text: "Could not open preview." });
    }
  }

  const fieldErrors = fields.filter((f) => errors[f.name]);

  return (
    <div className="max-w-2xl">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">{label}</h1>
          <div className="mt-1.5 flex items-center gap-2">
            <StatusBadge status={status} />
            {dirty && (
              <span className="text-xs text-muted">Unsaved changes</span>
            )}
          </div>
        </div>
        {id && (
          <button type="button" onClick={preview} className={buttonSecondary}>
            Preview
          </button>
        )}
      </div>

      {/* Error summary: announced, focusable, and links to each bad field. */}
      {(fieldErrors.length > 0 || errors._) && (
        <div
          ref={errorSummaryRef}
          tabIndex={-1}
          role="alert"
          className="mb-5 rounded border border-danger bg-danger-surface p-3 outline-none"
        >
          <p className="text-sm font-semibold text-danger">
            {errors._ ?? "Fix the following before saving:"}
          </p>
          {fieldErrors.length > 0 && (
            <ul className="mt-1.5 flex list-disc flex-col gap-0.5 pl-5 text-sm text-danger">
              {fieldErrors.map((f) => (
                <li key={f.name}>
                  <a href={`#${formId}-${f.name}`} className="underline">
                    {f.label}
                  </a>
                  : {errors[f.name]}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="flex flex-col gap-5">
        {fields.map((f) => {
          const fieldId = `${formId}-${f.name}`;
          const helpId = f.help ? `${fieldId}-help` : undefined;
          const errorId = errors[f.name] ? `${fieldId}-error` : undefined;
          const describedBy =
            [helpId, errorId].filter(Boolean).join(" ") || undefined;

          // `facets` and `media` render multiple controls, so they get a group
          // label rather than a <label for> pointing at one input.
          const isGroup = f.kind === "facets" || f.kind === "media";

          return (
            <div key={f.name} className="flex flex-col gap-1.5">
              {isGroup ? (
                <span id={`${fieldId}-label`} className="text-sm font-medium text-ink">
                  {f.label}
                  {f.required && (
                    <span className="text-danger" aria-hidden="true">
                      {" "}
                      *
                    </span>
                  )}
                  {f.required && <span className="sr-only"> (required)</span>}
                </span>
              ) : (
                <label htmlFor={fieldId} className="text-sm font-medium text-ink">
                  {f.label}
                  {f.required && (
                    <span className="text-danger" aria-hidden="true">
                      {" "}
                      *
                    </span>
                  )}
                  {f.required && <span className="sr-only"> (required)</span>}
                </label>
              )}

              {f.help && (
                <p id={helpId} className="text-xs text-muted">
                  {f.help}
                </p>
              )}

              {renderField(f, fieldId, describedBy)}

              {errors[f.name] && (
                <p id={errorId} className="text-xs font-medium text-danger">
                  {errors[f.name]}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Actions stay reachable on long forms without hiding page content. */}
      <div className="sticky bottom-0 mt-8 flex flex-wrap items-center gap-3 border-t border-line bg-white/95 py-4 backdrop-blur">
        <button
          type="button"
          onClick={save}
          disabled={busy}
          aria-busy={busy}
          className={buttonDark}
        >
          {busy ? "Saving…" : "Save draft"}
        </button>
        {id && status !== "published" && (
          <button
            type="button"
            onClick={() => doAction("publish")}
            disabled={busy}
            aria-busy={busy}
            className={buttonPrimary}
          >
            Publish
          </button>
        )}
        {id && status === "published" && (
          <button
            type="button"
            onClick={() => doAction("unpublish")}
            disabled={busy}
            aria-busy={busy}
            className={buttonSecondary}
          >
            Unpublish
          </button>
        )}
        {message && (
          <StatusMessage tone={message.tone}>{message.text}</StatusMessage>
        )}
      </div>
    </div>
  );

  function renderField(f: FieldSpec, fieldId: string, describedBy?: string) {
    const val = data[f.name];
    const invalid = Boolean(errors[f.name]);
    const a11y = {
      id: fieldId,
      "aria-describedby": describedBy,
      "aria-invalid": invalid || undefined,
      "aria-required": f.required || undefined,
    };
    const ring = invalid ? "border-danger" : "";

    switch (f.kind) {
      case "textarea":
        return (
          <textarea
            {...a11y}
            className={`${textarea} ${ring}`}
            rows={3}
            value={String(val ?? "")}
            onChange={(e) => set(f.name, e.target.value)}
          />
        );
      case "media":
        return (
          <MediaPicker
            labelledBy={`${fieldId}-label`}
            describedBy={describedBy}
            value={typeof val === "string" && val ? val : undefined}
            onChange={(mediaId) => set(f.name, mediaId ?? "")}
          />
        );
      case "stringList":
        return (
          <textarea
            {...a11y}
            className={`${textarea} ${ring}`}
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
        return (
          <FacetsInput
            fieldId={fieldId}
            labelledBy={`${fieldId}-label`}
            value={val}
            onChange={(v) => set(f.name, v)}
          />
        );
      case "json":
        return (
          <textarea
            {...a11y}
            className={`${textarea} ${ring} font-mono`}
            rows={5}
            spellCheck={false}
            value={jsonText[f.name] ?? ""}
            onChange={(e) => {
              setDirty(true);
              setJsonText((m) => ({ ...m, [f.name]: e.target.value }));
            }}
          />
        );
      default:
        return (
          <input
            {...a11y}
            className={`${input} ${ring}`}
            type={f.kind === "url" ? "url" : f.kind === "date" ? "date" : "text"}
            value={String(val ?? "")}
            onChange={(e) => set(f.name, e.target.value)}
          />
        );
    }
  }
}

const FACET_KEYS = ["industry", "service", "region", "outcome"] as const;

function FacetsInput({
  fieldId,
  labelledBy,
  value,
  onChange,
}: {
  fieldId: string;
  labelledBy: string;
  value: unknown;
  onChange: (v: Record<string, string[]>) => void;
}) {
  const facets = (value as Record<string, string[]>) ?? {
    industry: [],
    service: [],
    region: [],
    outcome: [],
  };
  return (
    <div
      role="group"
      aria-labelledby={labelledBy}
      className="grid gap-3 sm:grid-cols-2"
    >
      {FACET_KEYS.map((k) => {
        const id = `${fieldId}-${k}`;
        return (
          <div key={k} className="flex flex-col gap-1">
            <label htmlFor={id} className="text-xs font-medium capitalize text-muted">
              {k}
            </label>
            <input
              id={id}
              className={input}
              placeholder="comma, separated"
              value={(facets[k] ?? []).join(", ")}
              onChange={(e) =>
                onChange({
                  ...facets,
                  [k]: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                })
              }
            />
          </div>
        );
      })}
    </div>
  );
}
