import { describe, expect, it } from "vitest";
import { isRichHtmlEmpty, richTitle, sanitizeRichHtml } from "./rich-html";

describe("sanitizeRichHtml", () => {
  it("keeps editor output: tables, formulas, code, colours, own images", () => {
    const html =
      '<h2 style="text-align: center;">Sarlavha</h2><p><span style="color: rgb(229, 72, 77);">qizil</span></p>' +
      '<span data-type="inline-math" data-latex="x^2"></span><pre><code class="language-python">print(1)</code></pre>' +
      '<table><tbody><tr><th colspan="2">A</th></tr></tbody></table><img src="https://api.example.uz/media/homework_images/a.png" style="width: 60%;" alt="r">';
    const out = sanitizeRichHtml(html);
    for (const piece of ['data-latex="x^2"', "language-python", "<table>", 'colspan="2"', "color: rgb(229, 72, 77)", "text-align: center", "width: 60%", "homework_images/a.png"]) {
      expect(out).toContain(piece);
    }
  });

  it("removes scripts, handlers, javascript links, foreign styles and non-http image sources", () => {
    const out = sanitizeRichHtml(
      '<p onclick="x()" style="position: fixed; color: red; background-image: url(http://evil/x.png)">a</p><script>alert(1)</script>' +
        '<a href="javascript:alert(2)">l</a><img src="data:image/png;base64,AAAA"><iframe src="https://evil.example"></iframe>'
    );
    expect(out).not.toMatch(/onclick|script|alert|javascript:|iframe|position|url\(|data:image/);
    expect(out).toContain('style="color: red"');
  });

  it("keeps formulas whose LaTeX looks like a URL scheme", () => {
    const out = sanitizeRichHtml('<span data-type="inline-math" data-latex="f: A \\to B"></span>');
    expect(out).toContain('data-latex="f: A \\to B"');
  });

  it("forces safe link attributes", () => {
    const out = sanitizeRichHtml('<a href="https://example.com">x</a>');
    expect(out).toContain('rel="noopener noreferrer nofollow"');
    expect(out).toContain('target="_blank"');
  });
});

describe("richTitle", () => {
  it("uses the first non-empty line, trimmed and shortened", () => {
    expect(richTitle("<p></p><h1> Present   Perfect </h1><p>keyingi</p>")).toBe("Present Perfect");
    expect(richTitle(`<p>${"a".repeat(120)}</p>`)).toHaveLength(81);
  });

  it("falls back to a formula, then to the given fallback", () => {
    expect(richTitle('<p><span data-type="inline-math" data-latex="x^2+1"></span></p>')).toBe("x^2+1");
    expect(richTitle("<p></p>", "Nomsiz")).toBe("Nomsiz");
    expect(richTitle("")).toBe("");
  });
});

describe("isRichHtmlEmpty", () => {
  it("is empty without text, images, tables, formulas or code", () => {
    expect(isRichHtmlEmpty("")).toBe(true);
    expect(isRichHtmlEmpty("<p></p><p> </p>")).toBe(true);
  });

  it("is not empty with any content", () => {
    expect(isRichHtmlEmpty("<p>x</p>")).toBe(false);
    expect(isRichHtmlEmpty('<img src="/media/a.png">')).toBe(false);
    expect(isRichHtmlEmpty("<table><tbody><tr><td></td></tr></tbody></table>")).toBe(false);
    expect(isRichHtmlEmpty('<span data-type="inline-math" data-latex="x"></span>')).toBe(false);
  });
});
