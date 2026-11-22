import { describe, expect, it } from "vitest";
import { checkAiMaterials } from "./ai-material";

const MB = 1024 * 1024;
const file = (name: string, mb = 1) => ({ name, size: mb * MB });

describe("checkAiMaterials", () => {
  it("accepts the formats the backend can read", () => {
    expect(checkAiMaterials([file("dars.PDF"), file("savollar.docx"), file("slayd.pptx"), file("jadval.xlsx"), file("izoh.md")])).toBeNull();
  });

  it("rejects old Word, images and files without an extension", () => {
    expect(checkAiMaterials([file("eski.doc")])).toEqual({ kind: "type", name: "eski.doc" });
    expect(checkAiMaterials([file("varaq.jpg")])).toEqual({ kind: "type", name: "varaq.jpg" });
    expect(checkAiMaterials([file("README")])).toEqual({ kind: "type", name: "README" });
  });

  it("enforces the 20 MB file, 5 file and 40 MB total limits", () => {
    expect(checkAiMaterials([file("katta.pdf", 21)])).toEqual({ kind: "fileSize", name: "katta.pdf", max: 20 });
    expect(checkAiMaterials(Array.from({ length: 6 }, (_, index) => file(`${index}.txt`)))).toEqual({ kind: "count", max: 5 });
    expect(checkAiMaterials([file("a.pdf", 15), file("b.pdf", 15), file("c.pdf", 15)])).toEqual({ kind: "total", max: 40 });
    expect(checkAiMaterials([file("a.pdf", 20), file("b.pdf", 20)])).toBeNull();
  });
});
