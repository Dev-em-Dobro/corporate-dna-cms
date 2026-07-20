"use client";

import { useEffect, useRef } from "react";
import "quill/dist/quill.snow.css";

// Standard toolbar (no inline images — those stay on the cover Media field).
const TOOLBAR = [
  [{ header: [2, 3, false] }],
  ["bold", "italic", "underline"],
  [{ list: "ordered" }, { list: "bullet" }],
  ["blockquote"],
  ["link"],
  ["clean"],
];

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
        // validation and the unsaved-changes flag match the old textarea.
        const html = quill.getText().trim() === "" ? "" : quill.root.innerHTML;
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
    </div>
  );
}
