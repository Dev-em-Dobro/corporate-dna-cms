import { describe, it, expect, afterEach } from "vitest";
import {
  assetDeliveryUrl,
  collectDataMediaIds,
  attachListItemMediaUrl,
  attachDataMediaUrls,
} from "@/lib/content/media-urls";

describe("assetDeliveryUrl", () => {
  const prev = process.env.BUNNY_CDN_URL;
  afterEach(() => {
    process.env.BUNNY_CDN_URL = prev;
  });

  it("prefers the stored delivery_url", () => {
    process.env.BUNNY_CDN_URL = "https://cdn.example.net";
    expect(
      assetDeliveryUrl({ deliveryUrl: "https://stored/x.jpg", bunnyPath: "p/x.jpg" }),
    ).toBe("https://stored/x.jpg");
  });

  it("falls back to ${BUNNY_CDN_URL}/${bunny_path} (trimming a trailing slash)", () => {
    process.env.BUNNY_CDN_URL = "https://cdn.example.net/";
    expect(assetDeliveryUrl({ deliveryUrl: null, bunnyPath: "p/x.jpg" })).toBe(
      "https://cdn.example.net/p/x.jpg",
    );
  });

  it("returns undefined when nothing is usable", () => {
    delete process.env.BUNNY_CDN_URL;
    expect(assetDeliveryUrl({ deliveryUrl: null, bunnyPath: "p/x.jpg" })).toBeUndefined();
    expect(assetDeliveryUrl({ deliveryUrl: null, bunnyPath: null })).toBeUndefined();
  });
});

describe("collectDataMediaIds", () => {
  it("collects cover, photo and awards logo ids", () => {
    expect(
      collectDataMediaIds({
        coverMediaId: "c1",
        photoMediaId: "p1",
        items: [{ logoMediaId: "l1" }, { name: "no logo" }, { logoMediaId: "l2" }],
      }),
    ).toEqual(["c1", "p1", "l1", "l2"]);
  });

  it("ignores missing/non-string refs", () => {
    expect(collectDataMediaIds({ title: "x" })).toEqual([]);
    expect(collectDataMediaIds({ coverMediaId: 123 as unknown as string })).toEqual([]);
  });

  it("collects the resource file and insight attachment ids", () => {
    expect(collectDataMediaIds({ fileMediaId: "f1" })).toEqual(["f1"]);
    expect(collectDataMediaIds({ attachmentMediaId: "a1" })).toEqual(["a1"]);
  });
});

describe("attachListItemMediaUrl", () => {
  const urls = new Map([["c1", "https://cdn/c1.jpg"]]);

  it("adds coverUrl when the cover id resolves (keeping coverMediaId)", () => {
    const out = attachListItemMediaUrl({ title: "T", coverMediaId: "c1" }, urls);
    expect(out).toEqual({ title: "T", coverMediaId: "c1", coverUrl: "https://cdn/c1.jpg" });
  });

  it("leaves the item untouched when there is no cover or no match", () => {
    expect(
      attachListItemMediaUrl<{ title: string; coverMediaId?: string }>({ title: "T" }, urls),
    ).toEqual({ title: "T" });
    expect(attachListItemMediaUrl({ title: "T", coverMediaId: "miss" }, urls)).toEqual({
      title: "T",
      coverMediaId: "miss",
    });
  });
});

describe("attachDataMediaUrls", () => {
  const urls = new Map([
    ["c1", "https://cdn/c1.jpg"],
    ["p1", "https://cdn/p1.jpg"],
    ["l1", "https://cdn/l1.png"],
  ]);

  it("adds coverUrl/photoUrl and items[].logoUrl additively", () => {
    const data = {
      coverMediaId: "c1",
      photoMediaId: "p1",
      items: [{ name: "A", logoMediaId: "l1" }, { name: "B" }],
    };
    const out = attachDataMediaUrls(data, urls);

    expect(out.coverMediaId).toBe("c1");
    expect(out.coverUrl).toBe("https://cdn/c1.jpg");
    expect(out.photoUrl).toBe("https://cdn/p1.jpg");
    expect(out.items).toEqual([
      { name: "A", logoMediaId: "l1", logoUrl: "https://cdn/l1.png" },
      { name: "B" },
    ]);
    // input not mutated
    expect((data as Record<string, unknown>).coverUrl).toBeUndefined();
  });

  it("omits url fields when refs do not resolve", () => {
    const out = attachDataMediaUrls({ coverMediaId: "miss", title: "x" }, urls);
    expect(out.coverUrl).toBeUndefined();
    expect(out.coverMediaId).toBe("miss");
  });

  it("adds fileUrl and attachmentUrl additively", () => {
    const map = new Map([
      ["f1", "https://cdn/f1.pdf"],
      ["a1", "https://cdn/a1.pdf"],
    ]);
    const out = attachDataMediaUrls(
      { fileMediaId: "f1", attachmentMediaId: "a1" },
      map,
    );
    expect(out.fileMediaId).toBe("f1");
    expect(out.fileUrl).toBe("https://cdn/f1.pdf");
    expect(out.attachmentUrl).toBe("https://cdn/a1.pdf");
  });
});
