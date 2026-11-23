import { describe, expect, it } from "vitest";
import { aiJobStep, checkAiForm, deriveAiTopic, isAiJobActive } from "./ai-form";

describe("deriveAiTopic", () => {
  const base = { topic: "", fileNames: [] as string[], text: "", fallback: "AI test" };

  it("keeps an explicit topic", () => {
    expect(deriveAiTopic({ ...base, topic: "  Present Perfect ", fileNames: ["x.pdf"] })).toBe("Present Perfect");
  });

  it("falls back to the first file name without extension", () => {
    expect(deriveAiTopic({ ...base, fileNames: ["Biologiya_9-sinf_fotosintez.pdf"] })).toBe("Biologiya 9 sinf fotosintez");
  });

  it("then to the first line of pasted text, then to the fallback", () => {
    expect(deriveAiTopic({ ...base, text: "\n\nFotosintez nima?\nBatafsil..." })).toBe("Fotosintez nima?");
    expect(deriveAiTopic(base)).toBe("AI test");
  });

  it("never exceeds the backend limit", () => {
    expect(deriveAiTopic({ ...base, topic: "a".repeat(500) })).toHaveLength(200);
  });
});

describe("checkAiForm", () => {
  const ok = { fileCount: 1, text: "", topic: "", simple: true, examName: "", count: 20 };

  it("needs a file, text or topic", () => {
    expect(checkAiForm({ ...ok, fileCount: 0 })).toBe("needMaterial");
    expect(checkAiForm({ ...ok, fileCount: 0, topic: "Mavzu" })).toBeNull();
    expect(checkAiForm({ ...ok, fileCount: 0, text: "matn" })).toBeNull();
  });

  it("requires an exam name for a non-simple format", () => {
    expect(checkAiForm({ ...ok, simple: false })).toBe("enterExam");
    expect(checkAiForm({ ...ok, simple: false, examName: "SAT Math" })).toBeNull();
  });

  it("limits the count only for the simple format", () => {
    expect(checkAiForm({ ...ok, count: 4 })).toBe("countRange");
    expect(checkAiForm({ ...ok, count: 61 })).toBe("countRange");
    expect(checkAiForm({ ...ok, simple: false, examName: "SAT Math", count: 0 })).toBeNull();
  });
});

describe("job status helpers", () => {
  it("maps the status to a progress step", () => {
    expect(aiJobStep("queued")).toBe(0);
    expect(aiJobStep("processing")).toBe(0);
    expect(aiJobStep("generating")).toBe(1);
    expect(aiJobStep("done")).toBe(3);
  });

  it("knows which statuses are still running", () => {
    expect(isAiJobActive("queued")).toBe(true);
    expect(isAiJobActive("generating")).toBe(true);
    expect(isAiJobActive("done")).toBe(false);
    expect(isAiJobActive("failed")).toBe(false);
  });
});
