import type { ContentType } from "./types";

export type FieldKind =
  | "text"
  | "textarea"
  | "url"
  | "media"
  | "date"
  | "stringList"
  | "facets"
  | "json";

export interface FieldSpec {
  name: string;
  label: string;
  kind: FieldKind;
  required?: boolean;
  help?: string;
}

/**
 * UI field layout per content type. Complex/nested fields (cta, elements, awards
 * items) use the `json` kind — a JSON editor — to keep the generic form simple
 * while still supporting the full structured model.
 */
export const FIELDS: Record<ContentType, FieldSpec[]> = {
  case: [
    { name: "title", label: "Title", kind: "text", required: true },
    { name: "summary", label: "Summary", kind: "textarea" },
    { name: "challenge", label: "Challenge", kind: "textarea", required: true },
    { name: "approach", label: "Approach", kind: "textarea", required: true },
    { name: "outcome", label: "Outcome", kind: "textarea", required: true },
    {
      name: "measurableResult",
      label: "Measurable result",
      kind: "textarea",
      required: true,
    },
    { name: "clientQuote", label: "Client quote", kind: "textarea", required: true },
    { name: "coverMediaId", label: "Cover image", kind: "media" },
    {
      name: "videoUrl",
      label: "Video (YouTube URL)",
      kind: "url",
      help: "Optional YouTube link",
    },
    { name: "facets", label: "Facets", kind: "facets" },
  ],
  solution: [
    { name: "title", label: "Title", kind: "text", required: true },
    {
      name: "problemStatement",
      label: "Problem statement",
      kind: "textarea",
      required: true,
    },
    { name: "body", label: "Body", kind: "textarea" },
    { name: "cta", label: "CTA { label, href }", kind: "json" },
    { name: "proofRefs", label: "Proof references", kind: "stringList" },
  ],
  person: [
    { name: "name", label: "Name", kind: "text", required: true },
    { name: "role", label: "Role", kind: "text", required: true },
    { name: "bio", label: "Bio", kind: "textarea", required: true },
    { name: "photoMediaId", label: "Photo", kind: "media" },
    { name: "regionSlug", label: "Region slug", kind: "text" },
    { name: "linkedin", label: "LinkedIn URL", kind: "url" },
  ],
  region: [
    { name: "name", label: "Name", kind: "text", required: true },
    { name: "city", label: "City", kind: "text", required: true },
    { name: "country", label: "Country", kind: "text" },
    { name: "summary", label: "Summary", kind: "textarea" },
    { name: "addressLines", label: "Address lines", kind: "stringList" },
  ],
  insight: [
    { name: "title", label: "Title", kind: "text", required: true },
    { name: "excerpt", label: "Excerpt", kind: "textarea" },
    { name: "body", label: "Body", kind: "textarea", required: true },
    { name: "coverMediaId", label: "Cover image", kind: "media" },
    { name: "publishedDate", label: "Published date", kind: "date" },
  ],
  page_5h: [
    { name: "title", label: "Title", kind: "text", required: true },
    { name: "intro", label: "Intro", kind: "textarea" },
    { name: "elements", label: "Elements [ {key,title,description} ]", kind: "json" },
    { name: "ctaLabel", label: "CTA label", kind: "text" },
    { name: "ctaHref", label: "CTA href", kind: "text" },
  ],
  page_book: [
    { name: "title", label: "Title", kind: "text", required: true },
    { name: "description", label: "Description", kind: "textarea", required: true },
    { name: "coverMediaId", label: "Cover image", kind: "media" },
    { name: "purchaseUrl", label: "Purchase URL", kind: "url", required: true },
  ],
  page_awards: [
    { name: "title", label: "Title", kind: "text", required: true },
    { name: "items", label: "Items [ {name,year,logoMediaId} ]", kind: "json" },
  ],
  page_legal: [
    { name: "title", label: "Title", kind: "text", required: true },
    { name: "body", label: "Body", kind: "textarea", required: true },
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
      case "json":
        base[f.name] =
          f.name === "cta" ? { label: "", href: "" } : [];
        break;
      default:
        base[f.name] = "";
    }
  }
  return base;
}
