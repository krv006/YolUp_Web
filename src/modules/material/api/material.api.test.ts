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

  it("maps course folder counts and defaults missing video and board counts to zero", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue([
      { id: "c1", title: "Ingliz Tili A1", kind: "group", file_count: 2, recording_count: 3, board_count: 1 },
      { id: "c2", title: "RV", kind: "club", file_count: 0 },
    ]);
    const folders = await materialApi.courses();
    expect(folders[0]).toMatchObject({ fileCount: 2, recordingCount: 3, boardCount: 1 });
    expect(folders[1]).toMatchObject({ fileCount: 0, recordingCount: 0, boardCount: 0, kind: "club" });
  });

  it("marks files sent in the group chat and downloads them through the chat endpoint", async () => {
    const get = vi.spyOn(apiClient, "get").mockResolvedValueOnce({
      count: 2,
      next: null,
      previous: null,
      results: [
        { id: 7, course_id: "c1", title: "Konspekt.pdf", kind: "pdf", source: "chat", url: "/api/v1/chat/attachments/7/" },
        { id: 8, course_id: "c1", title: "Test.pdf", kind: "pdf", source: "upload", url: "/api/v1/materials/8/file/" },
      ],
    });
    const [chat, upload] = await materialApi.list({ course: "c1", lesson: "general" });
    expect(chat).toMatchObject({ source: "chat", url: "/api/v1/chat/attachments/7/" });
    expect(upload.source).toBe("upload");
    get.mockResolvedValue(new Blob(["x"]));
    await materialApi.download(chat);
    expect(get).toHaveBeenLastCalledWith("/api/v1/chat/attachments/7/", { responseType: "blob" });
    await materialApi.download(upload);
    expect(get.mock.lastCall?.[0]).not.toBe("/api/v1/chat/attachments/7/");
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
