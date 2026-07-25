import { describe, it, expect } from "vitest";
import { validateContent, REGISTRY } from "@/lib/content/types";

describe("tags field (TAREFA 2 / FR-817)", () => {
  it("normalises tags on cases and insights: trim, drop blanks, de-dupe", () => {
    for (const type of ["case", "insight"] as const) {
      const base = type === "insight" ? { title: "t", body: "b" } : { title: "t" };
      const r = validateContent(type, {
        ...base,
        tags: [" strategy ", "strategy", "", "  ", "M&A"],
      });
      expect(r.ok, type).toBe(true);
      expect(r.data!.tags).toEqual(["strategy", "M&A"]);
    }
  });

  it("defaults tags to an empty array", () => {
    const r = validateContent("insight", { title: "t", body: "b" });
    expect(r.data!.tags).toEqual([]);
  });

  it("exposes tags on the list item for case and insight", () => {
    const item = REGISTRY.case.toListItem({ title: "t", tags: ["a", "b"] });
    expect(item.tags).toEqual(["a", "b"]);
  });
});

describe("case branding (TAREFA 3 / FR-804/805)", () => {
  it("accepts a valid hex brand colour and a logo media id", () => {
    const r = validateContent("case", {
      title: "t",
      brandColor: "#1A2b3C",
      logoMediaId: "11111111-1111-4111-8111-111111111111",
    });
    expect(r.ok).toBe(true);
    expect(r.data!.brandColor).toBe("#1A2b3C");
    expect(r.data!.logoMediaId).toBe("11111111-1111-4111-8111-111111111111");
  });

  it("treats a blank brand colour as not provided", () => {
    const r = validateContent("case", { title: "t", brandColor: "" });
    expect(r.ok).toBe(true);
    expect(r.data!.brandColor).toBeUndefined();
  });

  it("rejects a malformed brand colour", () => {
    const r = validateContent("case", { title: "t", brandColor: "blue" });
    expect(r.ok).toBe(false);
    expect(r.errors!.brandColor).toBeDefined();
  });
});
