import { z } from "zod";
import { youtubeField } from "./youtube";

/** Canonical content types (mirror db enum contentTypeEnum). */
export const CONTENT_TYPES = [
  "case",
  "solution",
  "person",
  "region",
  "insight",
  "page_5h",
  "page_book",
  "page_awards",
  "page_legal",
] as const;

export type ContentType = (typeof CONTENT_TYPES)[number];

/**
 * Optional social/contact fields. The admin form sends "" for a blank input, so
 * treat empty as "not provided" before format-checking — a blank field must
 * never block a save.
 */
const optionalUrl = z.preprocess(
  (v) => (v === "" ? undefined : v),
  z.url().optional(),
);
const optionalEmail = z.preprocess(
  (v) => (v === "" ? undefined : v),
  z.email().optional(),
);

/**
 * Structured tag list (FR-817). Trims each tag, drops blanks, de-duplicates, and
 * defaults to an empty array — so the read API's tag filter always gets clean,
 * consistent values regardless of how the author entered them.
 */
const tagsField = z.preprocess(
  (v) =>
    Array.isArray(v)
      ? [...new Set(v.map((t) => String(t).trim()).filter(Boolean))]
      : v,
  z.array(z.string()).default([]),
);

/** Brand colour as a 6-digit hex string (FR-804). Blank input = not provided. */
const brandColorField = z.preprocess(
  (v) => (v === "" ? undefined : v),
  z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Must be a 6-digit hex colour like #1a2b3c")
    .optional(),
);

// ---------------------------------------------------------------------------
// Per-type field schemas (validate content_entries.data). Required fields are
// enforced here and checked at publish time (FR-006/FR-007).
// ---------------------------------------------------------------------------

export const caseSchema = z.object({
  tags: tagsField,
  title: z.string().min(1),
  quote: z.string().default(""),
  quoter: z.string().default(""),
  mutedVideoUrl: optionalUrl,
  introduction: z.string().default(""),
  text: z.string().default(""),
  // Branding (FR-804/805/806): brand colour + transparent-PNG logo. Both optional
  // — the site has a fallback and only builds the branded card when present.
  brandColor: brandColorField,
  logoMediaId: z.uuid().optional(),
  // External YouTube reference (FR-801/802/803).
  youtube: youtubeField,
});

export const solutionSchema = z.object({
  title: z.string().min(1),
  bannerMediaId: z.uuid().optional(),
  problemStatement: z.string().min(1),
  body: z.string().default(""),
});

export const personSchema = z.object({
  name: z.string().min(1),
  role: z.string().min(1),
  bio: z.string().min(1),
  photoMediaId: z.uuid().optional(),
  regionSlug: z.string().optional(),
  linkedin: optionalUrl,
  instagram: optionalUrl,
  facebook: optionalUrl,
  x: optionalUrl,
  email: optionalEmail,
});

export const regionSchema = z.object({
  name: z.string().min(1),
  city: z.string().min(1),
  country: z.string().default(""),
  summary: z.string().default(""),
  addressLines: z.array(z.string()).default([]),
});

export const insightSchema = z.object({
  tags: tagsField,
  title: z.string().min(1),
  author: z.string().default(""),
  excerpt: z.string().default(""),
  body: z.string().min(1),
  coverMediaId: z.uuid().optional(),
  publishedDate: z.string().optional(),
  youtube: youtubeField,
});

export const page5hSchema = z.object({
  title: z.string().min(1),
  intro: z.string().default(""),
  elements: z
    .array(
      z.object({
        key: z.string().min(1),
        title: z.string().min(1),
        description: z.string().default(""),
      }),
    )
    .default([]),
  ctaLabel: z.string().optional(),
  ctaHref: z.string().optional(),
  youtube: youtubeField,
});

export const pageBookSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  coverMediaId: z.uuid().optional(),
  purchaseUrl: z.url(),
  youtube: youtubeField,
});

export const pageAwardsSchema = z.object({
  title: z.string().min(1),
  items: z
    .array(
      z.object({
        name: z.string().min(1),
        year: z.string().optional(),
        logoMediaId: z.uuid().optional(),
      }),
    )
    .default([]),
});

export const pageLegalSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
});

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

export interface ContentTypeDef {
  type: ContentType;
  label: string;
  /** Plural URL segment for collection types; undefined for singletons. */
  segment?: string;
  singleton: boolean;
  schema: z.ZodType<Record<string, unknown>>;
  /** Derive a compact list-view item for admin lists and read-API lists. */
  toListItem: (data: Record<string, unknown>) => {
    title: string;
    summary?: string;
    coverMediaId?: string;
    tags?: string[];
  };
}

function titleSummary(data: Record<string, unknown>) {
  return {
    title: String(data.title ?? data.name ?? "Untitled"),
    summary:
      typeof data.summary === "string"
        ? data.summary
        : typeof data.excerpt === "string"
          ? data.excerpt
          : undefined,
    coverMediaId:
      typeof data.coverMediaId === "string" ? data.coverMediaId : undefined,
    // Surface tags on list items so the site can filter/badge without a detail
    // fetch. Only case/insight carry them; other types simply omit the field.
    tags: Array.isArray(data.tags) ? (data.tags as string[]) : undefined,
  };
}

export const REGISTRY: Record<ContentType, ContentTypeDef> = {
  case: {
    type: "case",
    label: "Case study",
    segment: "cases",
    singleton: false,
    schema: caseSchema as unknown as z.ZodType<Record<string, unknown>>,
    toListItem: titleSummary,
  },
  solution: {
    type: "solution",
    label: "Solution",
    segment: "solutions",
    singleton: false,
    schema: solutionSchema as unknown as z.ZodType<Record<string, unknown>>,
    toListItem: titleSummary,
  },
  person: {
    type: "person",
    label: "Person",
    segment: "people",
    singleton: false,
    schema: personSchema as unknown as z.ZodType<Record<string, unknown>>,
    toListItem: (d) => ({
      title: String(d.name ?? "Unnamed"),
      summary: typeof d.role === "string" ? d.role : undefined,
      coverMediaId:
        typeof d.photoMediaId === "string" ? d.photoMediaId : undefined,
    }),
  },
  region: {
    type: "region",
    label: "Region",
    segment: "regions",
    singleton: false,
    schema: regionSchema as unknown as z.ZodType<Record<string, unknown>>,
    toListItem: (d) => ({
      title: String(d.name ?? "Region"),
      summary: typeof d.city === "string" ? d.city : undefined,
    }),
  },
  insight: {
    type: "insight",
    label: "Insight",
    segment: "insights",
    singleton: false,
    schema: insightSchema as unknown as z.ZodType<Record<string, unknown>>,
    toListItem: titleSummary,
  },
  page_5h: {
    type: "page_5h",
    label: "5H Framework page",
    singleton: true,
    schema: page5hSchema as unknown as z.ZodType<Record<string, unknown>>,
    toListItem: titleSummary,
  },
  page_book: {
    type: "page_book",
    label: "Book page",
    singleton: true,
    schema: pageBookSchema as unknown as z.ZodType<Record<string, unknown>>,
    toListItem: titleSummary,
  },
  page_awards: {
    type: "page_awards",
    label: "Awards & partnerships",
    singleton: true,
    schema: pageAwardsSchema as unknown as z.ZodType<Record<string, unknown>>,
    toListItem: titleSummary,
  },
  page_legal: {
    type: "page_legal",
    label: "Legal page",
    singleton: true,
    schema: pageLegalSchema as unknown as z.ZodType<Record<string, unknown>>,
    toListItem: titleSummary,
  },
};

/** Collection types exposed as plural segments in the API. */
export const SEGMENT_TO_TYPE: Record<string, ContentType> = Object.fromEntries(
  Object.values(REGISTRY)
    .filter((d) => d.segment)
    .map((d) => [d.segment as string, d.type]),
);

/** Singleton page keys used by /api/content/pages/{key}. */
export const SINGLETON_PAGES: Record<
  string,
  { type: ContentType; slug: string }
> = {
  "5h": { type: "page_5h", slug: "5h" },
  book: { type: "page_book", slug: "book" },
  awards: { type: "page_awards", slug: "awards" },
  privacy: { type: "page_legal", slug: "privacy" },
  cookies: { type: "page_legal", slug: "cookies" },
  terms: { type: "page_legal", slug: "terms" },
};

export function defForType(type: ContentType): ContentTypeDef {
  return REGISTRY[type];
}

export function isContentType(v: string): v is ContentType {
  return (CONTENT_TYPES as readonly string[]).includes(v);
}

/**
 * Resolve a URL `[type]` param to a ContentType. Accepts a plural collection
 * segment (e.g. "cases") or a raw type name (e.g. "page_book" for singletons).
 */
export function resolveTypeParam(param: string): ContentType | null {
  if (SEGMENT_TO_TYPE[param]) return SEGMENT_TO_TYPE[param];
  if (isContentType(param)) return param;
  return null;
}

export interface ValidationResult {
  ok: boolean;
  data?: Record<string, unknown>;
  /** field path -> message */
  errors?: Record<string, string>;
}

/** Validate a content payload against its type schema. */
export function validateContent(
  type: ContentType,
  data: unknown,
): ValidationResult {
  const parsed = REGISTRY[type].schema.safeParse(data);
  if (parsed.success) return { ok: true, data: parsed.data };
  const errors: Record<string, string> = {};
  for (const issue of parsed.error.issues) {
    errors[issue.path.join(".") || "_"] = issue.message;
  }
  return { ok: false, errors };
}

/** Extract the case facet columns from a validated case payload. */
export function extractCaseFacets(data: Record<string, unknown>) {
  const f = (data.facets ?? {}) as Record<string, string[] | undefined>;
  return {
    industry: f.industry ?? [],
    service: f.service ?? [],
    regionSlugs: f.region ?? [],
    outcome: f.outcome ?? [],
  };
}
