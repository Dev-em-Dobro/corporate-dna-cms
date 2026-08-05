import { describe, it, expect } from "vitest";
import { validateContent } from "@/lib/content/types";
import { emptyData } from "@/lib/content/ui-fields";

describe("insight optional fields", () => {
  const base = { title: "t", body: "b" };

  it("accepts the new source/attachment/approval fields", () => {
    const r = validateContent("insight", {
      ...base,
      originalSource: "Harvard Business Review",
      originalPublicationDate: "2026-01-15",
      sourceLink: "https://hbr.org/article",
      authorApproved: true,
      attachmentMediaId: "11111111-1111-4111-8111-111111111111",
    });
    expect(r.ok).toBe(true);
    expect(r.data!.originalSource).toBe("Harvard Business Review");
    expect(r.data!.authorApproved).toBe(true);
    expect(r.data!.attachmentMediaId).toBe(
      "11111111-1111-4111-8111-111111111111",
    );
  });

  it("defaults authorApproved to false and treats a blank sourceLink as unset", () => {
    const r = validateContent("insight", { ...base, sourceLink: "" });
    expect(r.ok).toBe(true);
    expect(r.data!.authorApproved).toBe(false);
    expect(r.data!.sourceLink).toBeUndefined();
    expect(r.data!.originalSource).toBe("");
  });

  it("rejects a malformed sourceLink", () => {
    const r = validateContent("insight", { ...base, sourceLink: "not-a-url" });
    expect(r.ok).toBe(false);
    expect(r.errors!.sourceLink).toBeDefined();
  });

  it("seeds authorApproved:false in emptyData", () => {
    expect(emptyData("insight").authorApproved).toBe(false);
  });
});
