import { describe, it, expect } from "vitest";
import { validateContent, SEGMENT_TO_TYPE, REGISTRY } from "@/lib/content/types";

describe("resource collection", () => {
  it("accepts a title, description and required file", () => {
    const r = validateContent("resource", {
      title: "2026 Leadership Report",
      description: "Annual findings.",
      fileMediaId: "11111111-1111-4111-8111-111111111111",
    });
    expect(r.ok).toBe(true);
    expect(r.data!.description).toBe("Annual findings.");
  });

  it("requires a file", () => {
    const r = validateContent("resource", { title: "No file" });
    expect(r.ok).toBe(false);
    expect(r.errors!.fileMediaId).toBeDefined();
  });

  it("defaults description to empty and exposes the cover on list items", () => {
    const r = validateContent("resource", {
      title: "t",
      fileMediaId: "11111111-1111-4111-8111-111111111111",
    });
    expect(r.data!.description).toBe("");
    const item = REGISTRY.resource.toListItem({
      title: "t",
      coverMediaId: "c1",
    });
    expect(item.coverMediaId).toBe("c1");
  });

  it("is reachable via the 'resources' collection segment", () => {
    expect(SEGMENT_TO_TYPE.resources).toBe("resource");
  });
});
