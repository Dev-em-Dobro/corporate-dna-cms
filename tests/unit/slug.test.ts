import { describe, it, expect } from "vitest";
import { slugify } from "@/lib/content/slug";

describe("slugify", () => {
  it("lowercases and hyphenates", () => {
    expect(slugify("Turnaround at ACME Corp")).toBe("turnaround-at-acme-corp");
  });
  it("strips accents and punctuation", () => {
    expect(slugify("Liderança & Estratégia!")).toBe("lideranca-estrategia");
  });
  it("falls back for empty input", () => {
    expect(slugify("!!!")).toBe("untitled");
  });
});
