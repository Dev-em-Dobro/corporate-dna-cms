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
