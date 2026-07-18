import { describe, it, expect } from "vitest";
import { validateContent } from "@/lib/content/types";

describe("case validation (T017)", () => {
  it("rejects a case missing required fields", () => {
    const r = validateContent("case", { title: "Only a title" });
    expect(r.ok).toBe(false);
    expect(r.errors).toBeDefined();
    // challenge/approach/outcome/measurableResult/clientQuote are required
    expect(Object.keys(r.errors!)).toEqual(
      expect.arrayContaining(["challenge", "approach", "outcome"]),
    );
  });

  it("accepts a complete case and applies facet defaults", () => {
    const r = validateContent("case", {
      title: "Turnaround at ACME",
      challenge: "c",
      approach: "a",
      outcome: "o",
      measurableResult: "m",
      clientQuote: "q",
    });
    expect(r.ok).toBe(true);
    expect(r.data!.facets).toEqual({
      industry: [],
      service: [],
      region: [],
      outcome: [],
    });
  });

  it("rejects a non-YouTube video URL", () => {
    const r = validateContent("case", {
      title: "t",
      challenge: "c",
      approach: "a",
      outcome: "o",
      measurableResult: "m",
      clientQuote: "q",
      videoUrl: "https://vimeo.com/123",
    });
    expect(r.ok).toBe(false);
    expect(r.errors!.videoUrl).toBeDefined();
  });
});
