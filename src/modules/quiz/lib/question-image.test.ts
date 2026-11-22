import { describe, expect, it } from "vitest";
import { checkQuestionImage, pickImageFile } from "./question-image";

const file = (type: string, size = 10) => new File([new Uint8Array(size)], "x", { type });

describe("checkQuestionImage", () => {
  it("accepts png, jpg, webp and gif", () => {
    for (const type of ["image/png", "image/jpeg", "image/webp", "image/gif"]) {
      expect(checkQuestionImage(file(type))).toBeNull();
    }
  });

  it("rejects other types and files over 5 MB", () => {
    expect(checkQuestionImage(file("image/bmp"))).toBe("imageBadType");
    expect(checkQuestionImage(file("application/pdf"))).toBe("imageBadType");
    expect(checkQuestionImage(file("image/png", 5 * 1024 * 1024 + 1))).toBe("imageTooLarge");
  });
});

describe("pickImageFile", () => {
  it("returns the first image from a clipboard-like list", () => {
    const text = file("text/plain");
    const image = file("image/png");
    expect(pickImageFile([text, image])).toBe(image);
    expect(pickImageFile([text])).toBeNull();
    expect(pickImageFile(null)).toBeNull();
  });
});
