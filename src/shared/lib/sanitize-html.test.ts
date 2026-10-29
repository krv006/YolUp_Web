import { describe, expect, it } from "vitest";
import { htmlToPlainText, sanitizeHtml } from "./sanitize-html";

describe("sanitizeHtml", () => {
  it("keeps harmless formatting", () => {
    expect(sanitizeHtml("<p>Salom <b>dunyo</b></p>")).toBe("<p>Salom <b>dunyo</b></p>");
  });

  it("removes scripts, event handlers and dangerous tags", () => {
    const out = sanitizeHtml('<p onclick="x()">a</p><script>alert(1)</script><img src=x onerror="alert(1)"><iframe src="https://evil"></iframe>');
    expect(out).toBe("<p>a</p>");
  });

  it("drops javascript: and data: links but keeps https", () => {
    expect(sanitizeHtml('<a href="javascript:alert(1)">x</a>')).not.toContain("javascript");
    expect(sanitizeHtml('<a href="data:text/html;base64,AAAA">x</a>')).not.toContain("data:");
    expect(sanitizeHtml('<a href="https://yolup.uz/x">x</a>')).toContain('href="https://yolup.uz/x"');
  });

  it("strips style attributes", () => {
    expect(sanitizeHtml('<p style="position:fixed;top:0">x</p>')).toBe("<p>x</p>");
  });

  it("handles empty and nullish input", () => {
    expect(sanitizeHtml("")).toBe("");
    expect(sanitizeHtml(undefined as unknown as string)).toBe("");
  });
});

describe("htmlToPlainText", () => {
  it("returns collapsed text without markup", () => {
    expect(htmlToPlainText("<p>Bir</p>\n<p>ikki   <b>uch</b></p><script>x</script>")).toBe("Bir ikki uch");
  });

  it("truncates long text with an ellipsis", () => {
    const text = htmlToPlainText(`<p>${"a".repeat(300)}</p>`, 20);
    expect(text).toHaveLength(21);
    expect(text.endsWith("…")).toBe(true);
  });
});
