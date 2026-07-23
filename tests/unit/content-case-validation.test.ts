import { describe, it, expect } from "vitest";
import { validateContent } from "@/lib/content/types";

describe("case validation (T017)", () => {
  it("rejects a case missing the required title", () => {
    const r = validateContent("case", { quote: "just a quote" });
    expect(r.ok).toBe(false);
    expect(r.errors).toBeDefined();
    expect(Object.keys(r.errors!)).toEqual(expect.arrayContaining(["title"]));
  });

  it("accepts a title-only case and applies field defaults", () => {
    const r = validateContent("case", { title: "Turnaround at ACME" });
    expect(r.ok).toBe(true);
    expect(r.data!.tags).toEqual([]);
    expect(r.data!.quote).toBe("");
    expect(r.data!.quoter).toBe("");
    expect(r.data!.introduction).toBe("");
    expect(r.data!.text).toBe("");
  });

  it("rejects an invalid interview video URL", () => {
    const r = validateContent("case", {
      title: "t",
      mutedVideoUrl: "not-a-url",
    });
    expect(r.ok).toBe(false);
    expect(r.errors!.mutedVideoUrl).toBeDefined();
  });
});
