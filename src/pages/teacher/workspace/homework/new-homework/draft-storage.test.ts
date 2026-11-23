import { beforeEach, describe, expect, it } from "vitest";
import { clearDraft, hasDraftContent, loadDraft, saveDraft, type StoredDraft } from "./draft-storage";

const draft: StoredDraft = {
  html: "<p>Salom</p>",
  group: "g1",
  date: "2030-05-05",
  time: "18:00",
  grading: "hundred",
  aiCheck: true,
  announce: true,
  googleFormUrl: "",
  questions: [],
};

describe("homework draft storage", () => {
  beforeEach(() => window.localStorage.clear());

  it("round-trips a draft and clears it", () => {
    expect(saveDraft(draft)).toBe(true);
    expect(loadDraft()).toEqual(draft);
    clearDraft();
    expect(loadDraft()).toBeNull();
  });

  it("ignores corrupted or foreign data", () => {
    window.localStorage.setItem("yolup:homework-draft:v1", "{not json");
    expect(loadDraft()).toBeNull();
    window.localStorage.setItem("yolup:homework-draft:v1", JSON.stringify({ html: 1 }));
    expect(loadDraft()).toBeNull();
  });

  it("only counts text, questions or a form link as content", () => {
    expect(hasDraftContent({ html: "", questions: [], googleFormUrl: "  " })).toBe(false);
    expect(hasDraftContent({ html: "<p>x</p>", questions: [], googleFormUrl: "" })).toBe(true);
    expect(hasDraftContent({ html: "", questions: [], googleFormUrl: "https://forms.gle/x" })).toBe(true);
  });
});
