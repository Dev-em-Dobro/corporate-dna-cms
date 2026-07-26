import { describe, it, expect } from "vitest";
import {
  sanitizeRichHtml,
  richTextFields,
  sanitizeRichText,
} from "@/lib/content/sanitize";

describe("rich-text sanitisation", () => {
  it("keeps allowed formatting", () => {
    const html =
      "<h2>Title</h2><p><strong>bold</strong> <em>it</em></p>" +
      "<ul><li>one</li></ul><blockquote>q</blockquote>";
    expect(sanitizeRichHtml(html)).toBe(html);
  });

  it("removes script tags and their contents", () => {
    const out = sanitizeRichHtml("<p>hi</p><script>alert(1)</script>");
    expect(out).toBe("<p>hi</p>");
    expect(out).not.toContain("script");
    expect(out).not.toContain("alert");
  });

  it("strips event handlers and disallowed attributes", () => {
    const out = sanitizeRichHtml('<p onclick="steal()" style="color:red">x</p>');
    expect(out).toBe("<p>x</p>");
  });

  it("keeps safe links but forces a safe rel", () => {
    const out = sanitizeRichHtml('<a href="https://example.com">go</a>');
    expect(out).toContain('href="https://example.com"');
    expect(out).toContain('rel="noopener nofollow"');
  });

  it("drops javascript: hrefs", () => {
    const out = sanitizeRichHtml('<a href="javascript:alert(1)">x</a>');
    expect(out).not.toContain("javascript:");
  });

  it("keeps inline images with an http(s) src and alt", () => {
    const out = sanitizeRichHtml(
      '<p><img src="https://cdn.example.net/a.webp" alt="a"></p>',
    );
    expect(out).toContain('src="https://cdn.example.net/a.webp"');
    expect(out).toContain('alt="a"');
  });

  it("drops base64 (data:) image sources", () => {
    const out = sanitizeRichHtml(
      '<img src="data:image/png;base64,AAAA" alt="x">',
    );
    expect(out).not.toContain("data:");
    expect(out).not.toContain("base64");
  });

  it("strips event handlers off images", () => {
    const out = sanitizeRichHtml(
      '<img src="https://cdn.example.net/a.webp" onerror="steal()">',
    );
    expect(out).not.toContain("onerror");
  });

  it("keeps a YouTube video iframe, rewritten to a canonical nocookie embed", () => {
    // Quill emits the watch/embed URL of whatever host; we canonicalise it.
    const out = sanitizeRichHtml(
      '<iframe class="ql-video" frameborder="0" allowfullscreen="true"' +
        ' src="https://www.youtube.com/embed/dQw4w9WgXcQ?showinfo=0"></iframe>',
    );
    expect(out).toContain(
      'src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"',
    );
    expect(out).toContain("<iframe");
  });

  it("drops iframes whose src is not a YouTube video", () => {
    for (const src of [
      "https://evil.example.com/x",
      "https://www.youtube.com/", // a YouTube host, but not a video
      "javascript:alert(1)",
    ]) {
      const out = sanitizeRichHtml(`<iframe src="${src}"></iframe>`);
      expect(out, src).not.toContain("<iframe");
    }
  });

  it("does not let a video iframe smuggle extra attributes", () => {
    const out = sanitizeRichHtml(
      '<iframe src="https://youtu.be/dQw4w9WgXcQ"' +
        ' onload="steal()" srcdoc="<script>x</script>" sandbox=""></iframe>',
    );
    expect(out).not.toContain("onload");
    expect(out).not.toContain("srcdoc");
    expect(out).not.toContain("sandbox");
    expect(out).toContain(
      'src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"',
    );
  });
});

describe("richTextFields", () => {
  it("lists the rich-text fields for a type and excludes short ones", () => {
    const insight = richTextFields("insight");
    expect(insight).toContain("body");
    expect(insight).toContain("excerpt");
    expect(insight).not.toContain("title");
    expect(insight).not.toContain("coverMediaId");
  });
});

describe("sanitizeRichText", () => {
  it("sanitises only rich-text fields and leaves the rest untouched", () => {
    const out = sanitizeRichText("insight", {
      title: "<b>not touched</b>",
      excerpt: "<p>ok</p><script>bad()</script>",
      body: '<p onclick="x">hi</p>',
      coverMediaId: "abc",
    });
    expect(out.title).toBe("<b>not touched</b>"); // short text field, left as-is
    expect(out.excerpt).toBe("<p>ok</p>");
    expect(out.body).toBe("<p>hi</p>");
    expect(out.coverMediaId).toBe("abc");
  });
});
