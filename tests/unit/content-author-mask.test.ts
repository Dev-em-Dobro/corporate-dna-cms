import { describe, it, expect } from "vitest";
import { maskUnapprovedAuthor } from "@/lib/content/published";

describe("maskUnapprovedAuthor", () => {
  it("masks an unapproved insight byline to 'Corporate DNA'", () => {
    const out = maskUnapprovedAuthor("insight", {
      author: "Rhea Leckie",
      authorApproved: false,
    });
    expect(out.author).toBe("Corporate DNA");
  });

  it("keeps the byline once approved", () => {
    const out = maskUnapprovedAuthor("insight", {
      author: "Rhea Leckie",
      authorApproved: true,
    });
    expect(out.author).toBe("Rhea Leckie");
  });

  it("leaves non-insight types untouched", () => {
    const data = { author: "Whoever", authorApproved: false };
    expect(maskUnapprovedAuthor("case", data)).toBe(data);
  });
});
