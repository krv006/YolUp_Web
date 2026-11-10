import { afterEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/shared/api";
import { materialApi } from "./material.api";

afterEach(() => vi.restoreAllMocks());

describe("materialApi folders", () => {
  it("maps a lesson folder with its recording and board", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue({
      lesson: { id: "l1", title: "Present Perfect", starts_at: "2026-11-09T10:00:00Z" },
      files: [{ id: 5, course_id: "c1", title: "Konspekt", kind: "pdf", lesson_id: "l1" }],
      recording: { status: "converting", info_url: "/api/v1/lessons/l1/recording/" },
      board: { pdf_url: "/api/v1/materials/lessons/l1/board.pdf" },
    });
    const folder = await materialApi.lessonFolder("l1");
    expect(folder.recordingStatus).toBe("converting");
    expect(folder.hasBoard).toBe(true);
    expect(folder.files[0]).toMatchObject({ id: "5", lessonId: "l1", kind: "pdf" });
  });

  it("uploads into a lesson folder only when one is chosen", async () => {
    const post = vi.spyOn(apiClient, "post").mockResolvedValue({ id: 1, course_id: "c1" });
    const file = new File(["x"], "a.pdf");
    await materialApi.upload({ course: "c1", lesson: "l1", file });
    expect((post.mock.calls[0][1] as FormData).get("lesson")).toBe("l1");
    await materialApi.upload({ course: "c1", lesson: null, file });
    expect((post.mock.calls[1][1] as FormData).has("lesson")).toBe(false);
  });

  it("lists the general folder of a course", async () => {
    const get = vi.spyOn(apiClient, "get").mockResolvedValue({ results: [] });
    await materialApi.list({ course: "c1", lesson: "general" });
    expect(get.mock.calls[0][1]?.query).toMatchObject({ course: "c1", lesson: "general" });
  });
});
