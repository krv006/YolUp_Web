import { afterEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/shared/api";
import { lessonApi } from "../api/lesson.api";
import { mapLessonRecordingDto } from "./lesson.mappers";

afterEach(() => vi.restoreAllMocks());

describe("mapLessonRecordingDto", () => {
  it("keeps a converting recording closed until the MP4 copy is ready", () => {
    const recording = mapLessonRecordingDto({ status: "converting", ready: false, stream_url: null, post_to_chat: false });
    expect(recording.status).toBe("converting");
    expect(recording.ready).toBe(false);
    expect(recording.postToChat).toBe(false);
  });

  it("posts to the chat by default when an older server omits the flag", () => {
    expect(mapLessonRecordingDto({ status: "completed", ready: true, stream_url: "/s" }).postToChat).toBe(true);
  });
});

describe("lessonApi.finish", () => {
  it("tells the server whether to post the recording", async () => {
    const post = vi.spyOn(apiClient, "post").mockResolvedValue({ id: "l1", title: "Dars", starts_at: "2026-11-10T10:00:00Z" });
    await lessonApi.finish("l1", { postRecording: false });
    expect(post).toHaveBeenCalledWith(expect.stringContaining("/lessons/l1/finish/"), { post_recording: false });
    await lessonApi.finish("l1", { recordingTitle: "  Speaking  ", postRecording: true });
    expect(post).toHaveBeenLastCalledWith(expect.any(String), { recording_title: "Speaking", post_recording: true });
  });
});
