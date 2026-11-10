import hljs from "highlight.js/lib/core";
import python from "highlight.js/lib/languages/python";
import sql from "highlight.js/lib/languages/sql";
import { describe, expect, it } from "vitest";
import { CODE_COLORS, codeLines, detectCodeLanguage, highlightedLines, plainLines, tokenizeCode } from "./code-highlight";

hljs.registerLanguage("sql", sql);
hljs.registerLanguage("python", python);

describe("detectCodeLanguage", () => {
  it("recognises languages with the same rules as the server", () => {
    expect(detectCodeLanguage("SELECT name\nFROM students\nWHERE age > 18;")).toBe("sql");
    expect(detectCodeLanguage("def salom(ism):\n    print(ism)")).toBe("python");
    expect(detectCodeLanguage("<div class=\"a\">Salom</div>")).toBe("html");
    expect(detectCodeLanguage("#include <iostream>\nusing namespace std;")).toBe("cpp");
    expect(detectCodeLanguage("const x = 1;")).toBe("javascript");
    expect(detectCodeLanguage("Bu oddiy matn")).toBe("plaintext");
  });
});

describe("code lines", () => {
  it("keeps indentation and empty lines, tabs become four spaces", () => {
    expect(codeLines("a\n\tb\n\n    c")).toEqual(["a", "    b", "", "    c"]);
    expect(plainLines("x\n\ny")).toEqual([[{ text: "x", color: null }], [], [{ text: "y", color: null }]]);
  });

  it("splits highlighted markup into coloured tokens per line", () => {
    const lines = highlightedLines('<span class="hljs-comment">/* a\nb */</span> x &lt; <span class="hljs-number">1</span>');
    expect(lines).toEqual([
      [{ text: "/* a", color: CODE_COLORS.comment }],
      [
        { text: "b */", color: CODE_COLORS.comment },
        { text: " x < ", color: null },
        { text: "1", color: CODE_COLORS.number },
      ],
    ]);
  });
});

describe("tokenizeCode", () => {
  it("colours SQL keywords, strings and numbers", () => {
    const [line] = tokenizeCode(hljs, "SELECT 'a' FROM t WHERE id = 5", "auto");
    const colors = Object.fromEntries(line.map((token) => [token.text.trim(), token.color]));
    expect(colors.SELECT).toBe(CODE_COLORS.keyword);
    expect(colors["'a'"]).toBe(CODE_COLORS.string);
    expect(colors["5"]).toBe(CODE_COLORS.number);
  });

  it("falls back to plain lines for languages it does not know", () => {
    expect(tokenizeCode(hljs, "salom\n  dunyo", "plaintext")).toEqual(plainLines("salom\n  dunyo"));
  });
});
