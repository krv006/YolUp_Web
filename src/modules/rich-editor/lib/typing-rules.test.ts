// @vitest-environment jsdom
import { Editor } from "@tiptap/core";
import { describe, expect, it } from "vitest";
import { createExtensions } from "./extensions";

function typeText(editor: Editor, text: string) {
  for (const char of text) {
    const { from, to } = editor.state.selection;
    const handled = editor.view.someProp("handleTextInput", (handler) => handler(editor.view, from, to, char, () => editor.state.tr.insertText(char, from, to)));
    if (!handled) editor.view.dispatch(editor.state.tr.insertText(char, from, to));
  }
}

function make() {
  return new Editor({ extensions: createExtensions({ onFormulaClick: () => undefined }), content: "<p></p>" });
}

describe("muharrirda avtomatik yozish qoidalari", () => {
  it("$$x^2$$ yozilsa formulaga aylanadi", () => {
    const editor = make();
    typeText(editor, "$$x^2$$");
    expect(JSON.stringify(editor.getJSON())).toContain("inlineMath");
    expect(editor.getHTML()).toContain("x^2");
    editor.destroy();
  });

  it("Typography: -> va != almashadi", () => {
    const editor = make();
    typeText(editor, "a -> b != c");
    expect(editor.getText()).toBe("a → b ≠ c");
    editor.destroy();
  });
});
