// @vitest-environment jsdom
import { Editor } from "@tiptap/core";
import { describe, expect, it } from "vitest";
import { createExtensions } from "./extensions";
import { toggleSmartCode } from "./smart-code";

function make(content: string) {
  return new Editor({ extensions: createExtensions({ onFormulaClick: () => undefined }), content });
}

describe("bitta Kod tugmasi", () => {
  it("belgilanmagan joyda kod bloki ochadi, ikkinchi bosishda qaytaradi", () => {
    const editor = make("<p>matn</p>");
    editor.commands.setTextSelection(2);
    toggleSmartCode(editor);
    expect(editor.isActive("codeBlock")).toBe(true);
    toggleSmartCode(editor);
    expect(editor.isActive("codeBlock")).toBe(false);
    editor.destroy();
  });

  it("bir qator ichida belgilangan so'zni qator ichidagi kodga aylantiradi va qaytaradi", () => {
    const editor = make("<p>bir ikki uch</p>");
    editor.commands.setTextSelection({ from: 5, to: 9 });
    toggleSmartCode(editor);
    expect(editor.isActive("code")).toBe(true);
    expect(editor.isActive("codeBlock")).toBe(false);
    expect(editor.getHTML()).toContain("<code>ikki</code>");
    toggleSmartCode(editor);
    expect(editor.getHTML()).not.toContain("<code>");
    editor.destroy();
  });

  it("bir necha abzats belgilansa kod bloki bo'ladi", () => {
    const editor = make("<p>a = 1</p><p>b = 2</p>");
    editor.commands.selectAll();
    toggleSmartCode(editor);
    expect(editor.getHTML().match(/<pre>/g)).toHaveLength(1); // bitta blok, abzatsma-abzats emas
    expect(editor.getHTML()).toContain("a = 1\nb = 2");
    editor.destroy();
  });
});
