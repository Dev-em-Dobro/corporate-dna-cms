import { describe, it, expect } from "vitest";
import {
  validateUpload,
  MAX_SIZE_BYTES,
} from "@/lib/media/validate";

describe("media validation (T043 / FR-013)", () => {
  it("accepts a small jpeg", () => {
    expect(validateUpload("image/jpeg", 1024).ok).toBe(true);
  });

  it("accepts documents (pdf, txt, doc, docx, xls, xlsx)", () => {
    for (const type of [
      "application/pdf",
      "text/plain",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ]) {
      expect(validateUpload(type, 1024).ok, type).toBe(true);
    }
  });

  it("rejects video uploads (videos go on YouTube)", () => {
    expect(validateUpload("video/mp4", 1024).ok).toBe(false);
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
