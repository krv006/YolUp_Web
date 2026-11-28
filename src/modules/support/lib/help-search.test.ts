import { afterEach, describe, expect, it } from "vitest";
import { clearRecentSearches, highlightParts, recentSearches, rememberSearch, searchEntries } from "./help-search";

const entries = [
  { id: "a", kind: "article" as const, title: "Parolni unutdim, nima qilaman?", text: "Kirish → Parolni unutdim" },
  { id: "b", kind: "article" as const, title: "Darsga qanday qo‘shilaman?", text: "Jadval → dars" },
  { id: "c", kind: "video" as const, title: "Video: parolni tiklash", text: "" },
];

afterEach(() => clearRecentSearches());

describe("help search", () => {
  it("finds every word in the title or text, ranking title matches first", () => {
    expect(searchEntries(entries, "parol").map((entry) => entry.id)).toEqual(["a", "c"]);
    expect(searchEntries(entries, "qo'shilaman").map((entry) => entry.id)).toEqual(["b"]);
    expect(searchEntries(entries, "  ")).toEqual([]);
    expect(searchEntries(entries, "sertifikat qr kodi")).toEqual([]);
  });

  it("marks the matching part of a title", () => {
    expect(highlightParts("Parolni unutdim", "parol")).toEqual([
      { text: "Parol", match: true },
      { text: "ni unutdim", match: false },
    ]);
  });

  it("keeps the latest unique searches first and clears them", () => {
    rememberSearch("parol");
    rememberSearch("jadval");
    rememberSearch("Parol");
    expect(recentSearches()).toEqual(["Parol", "jadval"]);
    expect(rememberSearch("a")).toEqual(["Parol", "jadval"]);
    expect(clearRecentSearches()).toEqual([]);
    expect(recentSearches()).toEqual([]);
  });
});
