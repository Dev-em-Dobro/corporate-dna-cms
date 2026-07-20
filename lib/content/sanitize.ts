import sanitizeHtml from "sanitize-html";
import { FIELDS } from "./ui-fields";
import type { ContentType } from "./types";

/**
 * Rich-text fields hold HTML produced by the Quill editor. Because a separate
 * public site renders that HTML, every value is sanitised on the server before
 * it is persisted — no unsanitised markup ever reaches the database.
 *
 * The allowlist mirrors the editor toolbar (headings, emphasis, lists, quote,
 * link); anything else — scripts, event handlers, styles, iframes — is dropped.
 */
const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "p",
    "br",
    "strong",
    "em",
    "u",
    "s",
    "h2",
    "h3",
    "ol",
    "ul",
    "li",
    "a",
    "blockquote",
  ],
  allowedAttributes: { a: ["href", "rel"] },
  allowedSchemes: ["http", "https", "mailto"],
  allowProtocolRelative: false,
  transformTags: {
    // Force safe rel on every link regardless of what the editor emitted.
    a: (_tag, attribs) => ({
      tagName: "a",
      attribs: { ...attribs, rel: "noopener nofollow" },
    }),
  },
};

export function sanitizeRichHtml(html: string): string {
  return sanitizeHtml(html, OPTIONS);
}

/** Names of the rich-text fields for a type (single source of truth: FIELDS). */
export function richTextFields(type: ContentType): string[] {
  return FIELDS[type].filter((f) => f.kind === "richtext").map((f) => f.name);
}

/** Return a copy of `data` with every rich-text field sanitised. */
export function sanitizeRichText(
  type: ContentType,
  data: Record<string, unknown>,
): Record<string, unknown> {
  const out = { ...data };
  for (const name of richTextFields(type)) {
    if (typeof out[name] === "string") {
      out[name] = sanitizeRichHtml(out[name] as string);
    }
  }
  return out;
}
