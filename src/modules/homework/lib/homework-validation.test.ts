import { describe, expect, it } from "vitest";
import { AppError } from "@/shared/api";
import { validateHomeworkFile } from "./homework-validation";

const file = (name: string, size = 1024) => new File([new Uint8Array(size)], name);

describe("validateHomeworkFile", () => {
  it("accepts iPhone photos (HEIC/HEIF) for homework answers", () => {
    expect(validateHomeworkFile(file("IMG_0001.HEIC"))).toBe(true);
    expect(validateHomeworkFile(file("photo.heif"))).toBe(true);
  });

  it("still rejects unknown types and audio outside speaking tasks", () => {
    expect(() => validateHomeworkFile(file("notes.exe"))).toThrow(AppError);
    expect(() => validateHomeworkFile(file("voice.mp3"))).toThrow(AppError);
    expect(validateHomeworkFile(file("voice.mp3"), { speaking: true })).toBe(true);
  });
});
