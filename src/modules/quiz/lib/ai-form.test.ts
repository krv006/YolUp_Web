import { describe, expect, it } from "vitest";
import { aiJobStep, checkAiForm, isAiJobActive } from "./ai-form";

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
