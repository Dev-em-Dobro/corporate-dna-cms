import type { ContentType } from "./types";

export type FieldKind =
  | "text"
  | "textarea"
  | "richtext"
  | "url"
  | "email"
  | "media"
  | "date"
  | "stringList"
  | "facets"
  | "boolean"
  | "json"
  | "objectList";

/**
 * A single sub-field inside an `objectList` row. Kept to the simple text-like
 * kinds plus `media` (a file/image picker) — a repeatable group stays easy for
 * non-technical editors, so no rich text or nested lists here.
 */
export interface SubFieldSpec {
  name: string;
  label: string;
  kind: "text" | "textarea" | "url" | "media";
  required?: boolean;
  help?: string;
  /** For `media` sub-fields: the upload policy key (see FieldSpec.uploadField). */
  uploadField?: string;
}

export interface FieldSpec {
  name: string;
  label: string;
  kind: FieldKind;
  required?: boolean;
  help?: string;
  /**
   * For `media` fields: the upload policy key (see lib/media/policies.ts) sent as
   * `field` so uploads through this control are validated against that policy —
   * e.g. `logo` enforces a transparent PNG within size/dimension limits.
   */
  uploadField?: string;
  /**
   * For `objectList` fields: the sub-fields shown per row. The stored value is
   * an array of `{ [subField.name]: string }` objects — the same shape the
   * server schema validates, just entered through separate labelled inputs
   * instead of a raw JSON blob.
   */
  itemFields?: SubFieldSpec[];
  /** For `objectList` fields: singular noun for the add/remove buttons, e.g. "quote". */
  itemNoun?: string;
}

/**
 * Downloadable resources embedded in a content entry (FR: resources live inside
 * Client Impact / Solutions / Insights, not as a separate collection). One row
 * per file: a display title plus the uploaded file. Shared verbatim across the
 * three types so the stored shape and editor UI stay identical.
 */
const resourcesField: FieldSpec = {
  name: "resources",
  label: "Resources (downloads)",
  kind: "objectList",
  itemNoun: "resource",
  help: "Optional files offered for download — one per file (e.g. PDF, white paper).",
  itemFields: [
    { name: "title", label: "Title", kind: "text", required: true },
    {
      name: "fileMediaId",
      label: "File",
      kind: "media",
      required: true,
      help: "PDF / document / image to offer for download",
    },
  ],
};

/**
 * UI field layout per content type. Complex/nested fields (elements, awards
 * items) use the `json` kind — a JSON editor — to keep the generic form simple
 * while still supporting the full structured model.
 */
export const FIELDS: Record<ContentType, FieldSpec[]> = {
  case: [
    { name: "tags", label: "Tags", kind: "stringList" },
    { name: "title", label: "Page title", kind: "text", required: true },
    { name: "quote", label: "Quote", kind: "textarea" },
    { name: "quoter", label: "Quoter", kind: "text" },
    {
      name: "mutedVideoUrl",
      label: "Interview video (URL)",
      kind: "url",
      help: "Video that autoplays without sound",
    },
    {
      name: "youtube",
      label: "YouTube video (URL)",
      kind: "url",
      help: "watch / youtu.be / embed / shorts link",
    },
    {
      name: "brandColor",
      label: "Brand colour",
      kind: "text",
      help: "6-digit hex, e.g. #1a2b3c (leave blank to use the default)",
    },
    {
      name: "logoMediaId",
      label: "Brand logo",
      kind: "media",
      uploadField: "logo",
      help: "Transparent PNG, up to 1024×1024",
    },
    { name: "introduction", label: "Introduction", kind: "richtext" },
    { name: "text", label: "Text", kind: "richtext" },
    resourcesField,
  ],
  solution: [
    { name: "title", label: "Title", kind: "text", required: true },
    {
      name: "bannerMediaId",
      label: "Banner background image",
      kind: "media",
      help: "Background image for the banner",
    },
    {
      name: "problemStatement",
      label: "Problem statement",
      kind: "richtext",
      required: true,
    },
    { name: "body", label: "Body", kind: "richtext" },
    {
      name: "proofRefs",
      label: "Proof / testimonials",
      kind: "objectList",
      itemNoun: "quote",
      help: "One block per quote. All fields are optional.",
      itemFields: [
        { name: "quote", label: "Quote", kind: "textarea" },
        { name: "author", label: "Author", kind: "text" },
        { name: "role", label: "Role", kind: "text", help: "e.g. CEO, Head of HR" },
        {
          name: "caseSlug",
          label: "Case study link (slug)",
          kind: "text",
          help: "Optional — slug of a case study to link this quote to",
        },
      ],
    },
    resourcesField,
  ],
  person: [
    { name: "name", label: "Name", kind: "text", required: true },
    { name: "role", label: "Role", kind: "text", required: true },
    { name: "bio", label: "Bio", kind: "richtext", required: true },
    { name: "photoMediaId", label: "Photo", kind: "media" },
    { name: "regionSlug", label: "Region slug", kind: "text" },
    { name: "linkedin", label: "LinkedIn URL", kind: "url" },
    { name: "instagram", label: "Instagram URL", kind: "url" },
    { name: "facebook", label: "Facebook URL", kind: "url" },
    { name: "x", label: "X (Twitter) URL", kind: "url" },
    { name: "email", label: "Email", kind: "email" },
  ],
  region: [
    { name: "name", label: "Name", kind: "text", required: true },
    { name: "city", label: "City", kind: "text", required: true },
    { name: "country", label: "Country", kind: "text" },
    { name: "summary", label: "Summary", kind: "richtext" },
    { name: "addressLines", label: "Address lines", kind: "stringList" },
  ],
  insight: [
    { name: "tags", label: "Tags", kind: "stringList" },
    { name: "title", label: "Title", kind: "text", required: true },
    { name: "author", label: "Author", kind: "text", help: "Shown as “By …” on the insight" },
    { name: "excerpt", label: "Excerpt", kind: "richtext" },
    { name: "body", label: "Body", kind: "richtext", required: true },
    { name: "coverMediaId", label: "Cover image", kind: "media" },
    {
      name: "youtube",
      label: "YouTube video (URL)",
      kind: "url",
      help: "watch / youtu.be / embed / shorts link",
    },
    { name: "publishedDate", label: "Published date", kind: "date" },
    { name: "originalSource", label: "Originally published on", kind: "text", help: "Source publication name" },
    { name: "originalPublicationDate", label: "Original publication date", kind: "date" },
    { name: "sourceLink", label: "Source link", kind: "url" },
    { name: "authorApproved", label: "Author approved", kind: "boolean", help: "Until ticked, the byline shows as “Corporate DNA” on the site" },
    resourcesField,
  ],
  page_5h: [
    { name: "title", label: "Title", kind: "text", required: true },
    { name: "intro", label: "Intro", kind: "richtext" },
    { name: "elements", label: "Elements [ {key,title,description} ]", kind: "json" },
    {
      name: "youtube",
      label: "YouTube video (URL)",
      kind: "url",
      help: "watch / youtu.be / embed / shorts link",
    },
    { name: "ctaLabel", label: "CTA label", kind: "text" },
    { name: "ctaHref", label: "CTA href", kind: "text" },
  ],
  page_book: [
    { name: "title", label: "Title", kind: "text", required: true },
    { name: "description", label: "Description", kind: "richtext", required: true },
    { name: "coverMediaId", label: "Cover image", kind: "media" },
    {
      name: "youtube",
      label: "YouTube video (URL)",
      kind: "url",
      help: "watch / youtu.be / embed / shorts link",
    },
    { name: "purchaseUrl", label: "Purchase URL", kind: "url", required: true },
  ],
  page_awards: [
    { name: "title", label: "Title", kind: "text", required: true },
    { name: "items", label: "Items [ {name,year,logoMediaId} ]", kind: "json" },
  ],
  page_legal: [
    { name: "title", label: "Title", kind: "text", required: true },
    { name: "body", label: "Body", kind: "richtext", required: true },
  ],
  page_home: [
    { name: "years", label: "Years", kind: "text", required: true, help: "e.g. 18" },
    { name: "countries", label: "Countries", kind: "text", required: true, help: "e.g. 36" },
    { name: "faculty", label: "Faculty", kind: "text", required: true, help: "e.g. 75" },
    { name: "sponsoredPct", label: "Chairman/CXO-sponsored", kind: "text", required: true, help: "e.g. 90%" },
  ],
};

export function emptyData(type: ContentType): Record<string, unknown> {
  const base: Record<string, unknown> = {};
  for (const f of FIELDS[type]) {
    switch (f.kind) {
      case "stringList":
        base[f.name] = [];
        break;
      case "facets":
        base[f.name] = { industry: [], service: [], region: [], outcome: [] };
        break;
      case "boolean":
        base[f.name] = false;
        break;
      case "json":
        base[f.name] = [];
        break;
      case "objectList":
        base[f.name] = [];
        break;
      default:
        base[f.name] = "";
    }
  }
  return base;
}
