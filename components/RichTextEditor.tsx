"use client";

import { useEffect, useRef, useState } from "react";
import "quill/dist/quill.snow.css";

// Standard toolbar. Inline images upload through the media pipeline (Bunny) and
// are inserted as CDN URLs — never base64 (the sanitiser drops `data:` sources).
const TOOLBAR = [
  [{ header: [2, 3, false] }],
  ["bold", "italic", "underline"],
  [{ list: "ordered" }, { list: "bullet" }],
  ["blockquote"],
  ["link", "image"],
  ["clean"],
];

/** Upload one image through POST /api/media and return its delivery URL. */
async function uploadImage(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/media", { method: "POST", body: form });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.fields?.file ?? body.error ?? "Upload failed");
  }
  return body.deliveryUrl as string;
}

/**
 * Vanilla Quill 2 wrapped for React. Quill is loaded dynamically inside the
 * effect so it never runs during SSR (it touches `document` on init). The
 * editor is uncontrolled: `value` seeds it on mount and edits flow out via
 * `onChange`. When `resetKey` changes (e.g. after restoring a version), the
 * editor is re-seeded from the current `value` without marking the form dirty.
 */
export default function RichTextEditor({
  value,
  onChange,
  labelledBy,
  describedBy,
  invalid,
  resetKey,
  disabled,
}: {
  value: string;
  onChange: (html: string) => void;
  labelledBy?: string;
  describedBy?: string;
  invalid?: boolean;
  resetKey?: number;
  disabled?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<import("quill").default | null>(null);
  // While true, programmatic content changes must not fire onChange.
  const seedingRef = useRef(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  // Latest props kept in refs so the mount effect never needs to re-run.
  const onChangeRef = useRef(onChange);
  const valueRef = useRef(value);
  const disabledRef = useRef(disabled);
  useEffect(() => {
    onChangeRef.current = onChange;
    valueRef.current = value;
    disabledRef.current = disabled;
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let cancelled = false;

    (async () => {
      const { default: Quill } = await import("quill");
      if (cancelled) return;

      // Quill replaces this element's contents; a dedicated child keeps our
      // ref div stable for React.
      const editor = document.createElement("div");
      container.appendChild(editor);

      const quill = new Quill(editor, {
        theme: "snow",
        modules: { toolbar: TOOLBAR },
      });
      quillRef.current = quill;

      // Replace Quill's default image handler (which base64-embeds the file)
      // with one that uploads to the media pipeline and inserts the CDN URL.
      const toolbar = quill.getModule("toolbar") as {
        addHandler: (name: string, handler: () => void) => void;
      };
      toolbar.addHandler("image", () => {
        if (disabledRef.current) return;
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.onchange = async () => {
          const file = input.files?.[0];
          if (!file) return;
          setUploading(true);
          setUploadError("");
          try {
            const url = await uploadImage(file);
            const range = quill.getSelection(true);
            const index = range ? range.index : quill.getLength();
            quill.insertEmbed(index, "image", url, "user");
            quill.setSelection(index + 1, 0);
          } catch (err) {
            setUploadError(
              err instanceof Error ? err.message : "Image upload failed",
            );
          } finally {
            setUploading(false);
          }
        };
        input.click();
      });

      // Paste as plain text only: strip all formatting from clipboard content
      // (Word, web pages, etc.). Runs in the capture phase and stops Quill's own
      // paste handler so it can't re-apply the source's markup. Pasted image
      // *files* carry no `text/plain`, so they are ignored — inline images go
      // through the toolbar button and the media pipeline, never a paste.
      quill.root.addEventListener(
        "paste",
        (e: ClipboardEvent) => {
          e.preventDefault();
          e.stopImmediatePropagation();
          const text = (e.clipboardData?.getData("text/plain") ?? "").replace(
            /\r\n?/g,
            "\n",
          );
          const range = quill.getSelection(true);
          if (!range) return;
          if (range.length) quill.deleteText(range.index, range.length, "user");
          if (text) {
            quill.insertText(range.index, text, "user");
            quill.setSelection(range.index + text.length, 0, "user");
          }
        },
        true,
      );

      // Seed existing content (may be legacy plain text or HTML) BEFORE the
      // change listener, so seeding doesn't mark the form dirty.
      if (valueRef.current) {
        quill.clipboard.dangerouslyPasteHTML(valueRef.current);
      }

      if (labelledBy) quill.root.setAttribute("aria-labelledby", labelledBy);
      if (describedBy) quill.root.setAttribute("aria-describedby", describedBy);
      quill.enable(!disabledRef.current); // apply lock state once loaded

      quill.on("text-change", () => {
        if (seedingRef.current) return; // ignore programmatic re-seeds
        // Treat Quill's empty document ("<p><br></p>") as "" so required
        // validation and the unsaved-changes flag match the old textarea. An
        // image-only document has no text but is NOT empty — keep its markup.
        const hasEmbed = quill.root.querySelector("img") !== null;
        const html =
          quill.getText().trim() === "" && !hasEmbed
            ? ""
            : quill.root.innerHTML;
        onChangeRef.current(html);
      });
    })();

    return () => {
      cancelled = true;
      quillRef.current = null;
      container.innerHTML = "";
    };
    // Mount once: Quill owns its DOM after init.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-seed when the parent bumps resetKey (e.g. a version was restored). Skips
  // the initial render — mount seeding already handled that.
  const firstReset = useRef(true);
  useEffect(() => {
    if (firstReset.current) {
      firstReset.current = false;
      return;
    }
    const quill = quillRef.current;
    if (!quill) return;
    seedingRef.current = true;
    const html = valueRef.current;
    if (html) quill.clipboard.dangerouslyPasteHTML(html);
    else quill.setText("");
    seedingRef.current = false;
  }, [resetKey]);

  // Lock/unlock editing while an explicit save is in flight.
  useEffect(() => {
    quillRef.current?.enable(!disabled);
  }, [disabled]);

  return (
    // Give the editable area a taller default (min-height, so it still grows
    // with content). Targets Quill's `.ql-editor` via an arbitrary variant.
    <div
      className={`[&_.ql-editor]:min-h-52 ${
        invalid ? "rounded-md ring-1 ring-danger" : ""
      } ${disabled ? "opacity-60" : ""}`}
    >
      <div ref={containerRef} />
      {uploading && (
        <p role="status" aria-live="polite" className="mt-1 text-sm text-muted">
          Uploading image…
        </p>
      )}
      {uploadError && (
        <p role="alert" className="mt-1 text-sm text-danger">
          {uploadError}
        </p>
      )}
    </div>
  );
}
