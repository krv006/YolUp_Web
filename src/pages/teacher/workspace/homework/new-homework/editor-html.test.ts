import { describe, expect, it } from "vitest";
import { bodyToEditorHtml } from "./editor-html";

describe("bodyToEditorHtml", () => {
  it("keeps rich HTML as it is", () => {
    expect(bodyToEditorHtml("<p>Salom</p>")).toBe("<p>Salom</p>");
  });

  it("turns old plain-text bodies into escaped paragraphs", () => {
    expect(bodyToEditorHtml("Bir\nIkki\n\nUch <b>")).toBe("<p>Bir<br>Ikki</p><p>Uch &lt;b&gt;</p>");
  });

  it("is empty for empty input", () => {
    expect(bodyToEditorHtml("  ")).toBe("");
  });
});
