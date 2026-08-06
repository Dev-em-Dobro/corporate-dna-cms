import { describe, it, expect } from "vitest";
import {
  validateContent,
  SEGMENT_TO_TYPE,
  isContentType,
} from "@/lib/content/types";

const FILE_ID = "11111111-1111-4111-8111-111111111111";

describe("embedded resources (case / solution / insight)", () => {
  it("accepts a list of { title, fileMediaId } on a case", () => {
    const r = validateContent("case", {
      title: "Acme turnaround",
      resources: [{ title: "2026 Leadership Report", fileMediaId: FILE_ID }],
    });
    expect(r.ok).toBe(true);
    expect(r.data!.resources).toEqual([
      { title: "2026 Leadership Report", fileMediaId: FILE_ID },
    ]);
  });

  it("defaults resources to an empty array when omitted", () => {
    for (const type of ["case", "solution", "insight"] as const) {
      const r = validateContent(type, {
        title: "t",
        // per-type required fields
        problemStatement: "p",
        body: "b",
      });
      expect(r.ok).toBe(true);
      expect(r.data!.resources).toEqual([]);
    }
  });

  it("requires a title and a file on every resource row", () => {
    const missingFile = validateContent("solution", {
      title: "t",
      problemStatement: "p",
      resources: [{ title: "No file" }],
    });
    expect(missingFile.ok).toBe(false);
    expect(missingFile.errors!["resources.0.fileMediaId"]).toBeDefined();

    const missingTitle = validateContent("insight", {
      title: "t",
      body: "b",
      resources: [{ fileMediaId: FILE_ID }],
    });
    expect(missingTitle.ok).toBe(false);
    expect(missingTitle.errors!["resources.0.title"]).toBeDefined();
  });

  it("no longer exposes a standalone 'resource' content type", () => {
    expect(SEGMENT_TO_TYPE.resources).toBeUndefined();
    expect(isContentType("resource")).toBe(false);
  });
});
