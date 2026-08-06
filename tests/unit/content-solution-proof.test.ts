import { describe, it, expect } from "vitest";
import { validateContent } from "@/lib/content/types";

describe("solution proofRefs", () => {
  const base = { title: "t", problemStatement: "p" };

  it("accepts a list of proof blocks and defaults author/role to empty", () => {
    const r = validateContent("solution", {
      ...base,
      proofRefs: [{ quote: "It worked.", caseSlug: "acme" }],
    });
    expect(r.ok).toBe(true);
    const refs = r.data!.proofRefs as Array<Record<string, unknown>>;
    expect(refs[0]).toEqual({
      quote: "It worked.",
      author: "",
      role: "",
      caseSlug: "acme",
    });
  });

  it("defaults proofRefs to an empty array when omitted", () => {
    const r = validateContent("solution", base);
    expect(r.ok).toBe(true);
    expect(r.data!.proofRefs).toEqual([]);
  });

  it("accepts a proof block with an empty quote (all fields optional)", () => {
    const r = validateContent("solution", {
      ...base,
      proofRefs: [{ quote: "" }],
    });
    expect(r.ok).toBe(true);
    const refs = r.data!.proofRefs as Array<Record<string, unknown>>;
    expect(refs[0]).toEqual({ quote: "", author: "", role: "" });
  });
});
