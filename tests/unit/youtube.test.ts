import { describe, it, expect } from "vitest";
import { normalizeYouTube, youtubeEmbedUrl } from "@/lib/content/youtube";
import { validateContent } from "@/lib/content/types";

const CANONICAL = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";

describe("YouTube normalisation (TAREFA 4 / FR-801-803)", () => {
  it("normalises every accepted URL form to the same canonical reference", () => {
    for (const input of [
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      "https://youtube.com/watch?v=dQw4w9WgXcQ&t=42s",
      "https://youtu.be/dQw4w9WgXcQ",
      "https://www.youtube.com/embed/dQw4w9WgXcQ",
      "https://www.youtube.com/shorts/dQw4w9WgXcQ",
      "https://m.youtube.com/watch?v=dQw4w9WgXcQ",
      "  https://youtu.be/dQw4w9WgXcQ  ",
    ]) {
      const ref = normalizeYouTube(input);
      expect(ref, input).toEqual({
        provider: "youtube",
        videoId: "dQw4w9WgXcQ",
        url: CANONICAL,
      });
    }
  });

  it("returns null for malformed or non-YouTube URLs", () => {
    for (const input of [
      "",
      "not a url",
      "https://vimeo.com/12345",
      "https://www.youtube.com/watch?v=short",
      "ftp://youtu.be/dQw4w9WgXcQ",
    ]) {
      expect(normalizeYouTube(input), input).toBeNull();
    }
  });
});

describe("youtubeEmbedUrl (inline video embed)", () => {
  const EMBED = "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ";

  it("builds a canonical nocookie embed from any accepted form", () => {
    for (const input of [
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      "https://youtu.be/dQw4w9WgXcQ",
      "https://www.youtube.com/embed/dQw4w9WgXcQ?showinfo=0",
      "https://www.youtube.com/shorts/dQw4w9WgXcQ",
    ]) {
      expect(youtubeEmbedUrl(input), input).toBe(EMBED);
    }
  });

  it("is idempotent on its own output", () => {
    expect(youtubeEmbedUrl(EMBED)).toBe(EMBED);
  });

  it("returns null for malformed or non-YouTube URLs", () => {
    for (const input of ["", "https://vimeo.com/12345", "javascript:alert(1)"]) {
      expect(youtubeEmbedUrl(input), input).toBeNull();
    }
  });
});

describe("case/insight youtube field", () => {
  it("stores a canonical reference for a valid link", () => {
    const r = validateContent("case", {
      title: "t",
      youtube: "https://youtu.be/dQw4w9WgXcQ",
    });
    expect(r.ok).toBe(true);
    expect(r.data!.youtube).toEqual({
      provider: "youtube",
      videoId: "dQw4w9WgXcQ",
      url: CANONICAL,
    });
  });

  it("round-trips an already-normalised reference (publish re-validation)", () => {
    const ref = {
      provider: "youtube",
      videoId: "dQw4w9WgXcQ",
      url: CANONICAL,
    };
    const r = validateContent("insight", {
      title: "t",
      body: "b",
      youtube: ref,
    });
    expect(r.ok).toBe(true);
    expect(r.data!.youtube).toEqual(ref);
  });

  it("treats a blank link as not provided", () => {
    const r = validateContent("case", { title: "t", youtube: "" });
    expect(r.ok).toBe(true);
    expect(r.data!.youtube).toBeUndefined();
  });

  it("rejects a non-YouTube URL with a specific message", () => {
    const r = validateContent("case", {
      title: "t",
      youtube: "https://vimeo.com/12345",
    });
    expect(r.ok).toBe(false);
    expect(r.errors!.youtube).toBeDefined();
  });
});
