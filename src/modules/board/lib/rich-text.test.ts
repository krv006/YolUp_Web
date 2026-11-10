import { describe, expect, it } from "vitest";
import { linesToHtml, plainTextToLines } from "./rich-text";

describe("linesToHtml", () => {
  it("rebuilds editor markup with formatting, lists and empty lines", () => {
    expect(
      linesToHtml([
        { runs: [{ text: "Qalin", bold: true }, { text: " va <oddiy>" }] },
        { runs: [] },
        { runs: [{ text: "bir" }], list: "bullet" },
        { runs: [{ text: "ikki", italic: true, underline: true }], list: "bullet" },
        { runs: [{ text: "1-qadam" }], list: "number" },
      ])
    ).toBe(
      "<div><b>Qalin</b> va &lt;oddiy&gt;</div><div><br></div><ul><li>bir</li><li><i><u>ikki</u></i></li></ul><ol><li>1-qadam</li></ol>"
    );
  });
});

describe("plainTextToLines", () => {
  it("turns plain board text back into editable lines", () => {
    expect(plainTextToLines("a\n\nb")).toEqual([{ runs: [{ text: "a" }] }, { runs: [] }, { runs: [{ text: "b" }] }]);
  });
});
