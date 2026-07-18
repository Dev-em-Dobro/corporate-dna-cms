import { describe, it, expect } from "vitest";
import {
  validateUpload,
  MAX_SIZE_BYTES,
} from "@/lib/media/validate";

describe("media validation (T043 / FR-013)", () => {
  it("accepts a small jpeg", () => {
    expect(validateUpload("image/jpeg", 1024).ok).toBe(true);
  });

  it("rejects an unsupported type", () => {
    const r = validateUpload("application/x-msdownload", 1024);
    expect(r.ok).toBe(false);
  });

  it("rejects an oversized file", () => {
    const r = validateUpload("image/png", MAX_SIZE_BYTES + 1);
    expect(r.ok).toBe(false);
  });
});
