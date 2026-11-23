import { describe, expect, it } from "vitest";
import {
  cloneDraft,
  createBlankDrafts,
  draftStatus,
  insertAfter,
  moveDraft,
  retypeDrafts,
  summarizeDrafts,
} from "./bulk-draft";
import { createDraft, draftToFormValues, formValuesToDraft, questionToDraft } from "./question-draft";
import type { QuizQuestion } from "@/shared/types";

let n = 0;
const key = () => `k${(n += 1)}`;

function filledSingle() {
  const draft = createDraft("single", key);
  draft.text = "Poytaxt qaysi?";
  draft.options[0].text = "Toshkent";
  draft.options[1].text = "Buxoro";
  draft.options[2].text = "Xiva";
  draft.options[3].text = "Nukus";
  draft.correctKeys = [draft.options[0].key];
  return draft;
}

describe("draftStatus", () => {
  it("fresh template is empty", () => {
    expect(draftStatus(createDraft("single", key)).state).toBe("empty");
    expect(draftStatus(createDraft("true_false", key)).state).toBe("empty");
  });

  it("question with text but no answer is partial", () => {
    const draft = createDraft("single", key);
    draft.text = "Savol";
    expect(draftStatus(draft)).toEqual({ state: "partial", error: "allOptionsRequired" });
  });

  it("only a picked true/false answer counts as touched", () => {
    const draft = createDraft("true_false", key);
    draft.correctBool = true;
    expect(draftStatus(draft).state).toBe("partial");
  });

  it("an image alone makes the question partial, not empty", () => {
    const draft = createDraft("single", key);
    draft.image = { id: "i1", url: "https://x/y.png" };
    expect(draftStatus(draft)).toEqual({ state: "partial", error: "questionTextRequired" });
  });

  it("fully filled question is ready", () => {
    expect(draftStatus(filledSingle())).toEqual({ state: "ready", error: null });
  });

  it("summarizes counts", () => {
    const drafts = [filledSingle(), createDraft("single", key), { ...createDraft("single", key), text: "x" }];
    expect(summarizeDrafts(drafts)).toEqual({ ready: 1, empty: 1, partial: 1 });
  });
});

describe("blank templates", () => {
  it("creates exactly N distinct templates of the chosen type", () => {
    const drafts = createBlankDrafts(5, "multiple", key);
    expect(drafts).toHaveLength(5);
    expect(new Set(drafts.map((draft) => draft.key)).size).toBe(5);
    expect(drafts.every((draft) => draft.type === "multiple")).toBe(true);
    expect(drafts[0].options).toHaveLength(4);
  });
});

describe("retypeDrafts", () => {
  it("changes only empty drafts by default", () => {
    const drafts = [filledSingle(), createDraft("single", key)];
    const result = retypeDrafts(drafts, "true_false", key);
    expect(result.changed).toBe(1);
    expect(result.drafts[0].type).toBe("single");
    expect(result.drafts[1].type).toBe("true_false");
  });

  it("can include filled drafts and keeps text and image", () => {
    const filled = filledSingle();
    filled.image = { id: "i1", url: "u" };
    filled.textAfter = "pastda";
    const result = retypeDrafts([filled], "true_false", key, true);
    expect(result.changed).toBe(1);
    expect(result.drafts[0]).toMatchObject({ type: "true_false", text: "Poytaxt qaysi?", textAfter: "pastda", key: filled.key });
    expect(result.drafts[0].image).toEqual({ id: "i1", url: "u" });
  });
});

describe("ordering helpers", () => {
  const a = createDraft("single", key);
  const b = createDraft("single", key);
  const c = createDraft("single", key);

  it("moves up and down and stays put at the edges", () => {
    expect(moveDraft([a, b, c], b.key, -1).map((d) => d.key)).toEqual([b.key, a.key, c.key]);
    expect(moveDraft([a, b, c], b.key, 1).map((d) => d.key)).toEqual([a.key, c.key, b.key]);
    expect(moveDraft([a, b, c], a.key, -1)).toEqual([a, b, c]);
    expect(moveDraft([a, b, c], c.key, 1)).toEqual([a, b, c]);
  });

  it("inserts after a given question", () => {
    const x = createDraft("single", key);
    expect(insertAfter([a, b], a.key, x).map((d) => d.key)).toEqual([a.key, x.key, b.key]);
  });
});

describe("cloneDraft", () => {
  it("gets fresh keys and keeps the correct answer on the copied option", () => {
    const original = filledSingle();
    const copy = cloneDraft(original, key);
    expect(copy.key).not.toBe(original.key);
    expect(copy.options.map((o) => o.key)).not.toEqual(original.options.map((o) => o.key));
    expect(copy.correctKeys).toEqual([copy.options[0].key]);
    expect(copy.text).toBe(original.text);
  });
});

describe("image fields travel through the request mapping", () => {
  it("sends image id and text after; drops text after when there is no image", () => {
    const withImage = filledSingle();
    withImage.image = { id: "img-1", url: "https://x/y.png" };
    withImage.textAfter = " Bu qanday shakl? ";
    expect(draftToFormValues(withImage)).toMatchObject({ imageId: "img-1", textAfter: "Bu qanday shakl?" });

    const noImage = filledSingle();
    noImage.textAfter = "yetim matn";
    expect(draftToFormValues(noImage)).toMatchObject({ imageId: null, textAfter: "" });
  });

  it("restores image and text after from a saved teacher question", () => {
    const question = {
      id: "q1", type: "single", groupId: null, text: "Rasmga qarang", points: 2, order: 0,
      options: [{ id: "o1", text: "A", isCorrect: true }, { id: "o2", text: "B", isCorrect: false }],
      matchLeft: [], matchRight: [], blankCount: 0,
      image: { id: "img-9", url: "https://x/z.png" }, textAfter: "pastki matn",
    } as unknown as QuizQuestion;
    const draft = questionToDraft(question, key);
    expect(draft.image).toEqual({ id: "img-9", url: "https://x/z.png" });
    expect(draft.textAfter).toBe("pastki matn");
    // saqlash aylanmasi: rasm yo'qolmaydi
    expect(draftToFormValues(draft)).toMatchObject({ imageId: "img-9", textAfter: "pastki matn" });
    expect(formValuesToDraft({ type: "single", text: "x", points: 2, options: [], textAfter: "q" }, key).textAfter).toBe("q");
  });
});
