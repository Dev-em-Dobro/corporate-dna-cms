import { describe, it, expect } from "vitest";
import {
  checkImagePolicy,
  getImagePolicy,
  IMAGE_POLICIES,
} from "@/lib/media/policies";

const logo = IMAGE_POLICIES.logo;
const banner = IMAGE_POLICIES.banner;

describe("per-field image policy (TAREFA 6 / FR-807/808)", () => {
  it("resolves a policy only for a known field", () => {
    expect(getImagePolicy("logo")).toBe(logo);
    expect(getImagePolicy(null)).toBeNull();
    expect(getImagePolicy("unknown")).toBeNull();
  });

  it("accepts a valid transparent PNG logo", () => {
    const r = checkImagePolicy(
      { mimeType: "image/png", sizeBytes: 50_000, width: 512, height: 512, hasAlpha: true },
      logo,
    );
    expect(r.ok).toBe(true);
  });

  it("rejects a non-PNG logo", () => {
    const r = checkImagePolicy(
      { mimeType: "image/jpeg", sizeBytes: 50_000, width: 512, height: 512, hasAlpha: false },
      logo,
    );
    expect(r.ok).toBe(false);
  });

  it("rejects a PNG logo without transparency", () => {
    const r = checkImagePolicy(
      { mimeType: "image/png", sizeBytes: 50_000, width: 512, height: 512, hasAlpha: false },
      logo,
    );
    expect(r.ok).toBe(false);
    expect((r as { error: string }).error).toMatch(/transparent/i);
  });

  it("rejects an oversized logo (dimensions)", () => {
    const r = checkImagePolicy(
      { mimeType: "image/png", sizeBytes: 50_000, width: 4000, height: 512, hasAlpha: true },
      logo,
    );
    expect(r.ok).toBe(false);
  });

  it("enforces a 16:9 aspect ratio for banners within tolerance", () => {
    expect(
      checkImagePolicy(
        { mimeType: "image/webp", sizeBytes: 1000, width: 1920, height: 1080 },
        banner,
      ).ok,
    ).toBe(true);
    expect(
      checkImagePolicy(
        { mimeType: "image/webp", sizeBytes: 1000, width: 1000, height: 1000 },
        banner,
      ).ok,
    ).toBe(false);
  });
});
