import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { API_ERROR_CODES, AppError } from "@/shared/api";

const upload = vi.hoisted(() => vi.fn());
vi.mock("../api/lesson.api", () => ({ lessonApi: { uploadRecordingVideo: upload } }));

import { chunkStore } from "./recording-upload-queue";
import { createTeacherVideoRecording } from "./teacher-video-recording";

class FakeRecorder {
  static last: FakeRecorder | null = null;
  static isTypeSupported = () => true;
  state: "inactive" | "recording" = "inactive";
  ondataavailable: ((event: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  onerror: (() => void) | null = null;
  constructor() {
    FakeRecorder.last = this;
  }
  start() {
    this.state = "recording";
  }
  requestData() {
    /* sinov bo'laklarni o'zi beradi */
  }
  stop() {
    this.state = "inactive";
    queueMicrotask(() => this.onstop?.());
  }
  emit(text: string) {
    this.ondataavailable?.({ data: new Blob([text]) });
  }
}

function fakeStream() {
  const listeners = new Map<string, () => void>();
  const track = {
    addEventListener: (name: string, fn: () => void) => listeners.set(name, fn),
    removeEventListener: (name: string) => listeners.delete(name),
    stop: vi.fn(),
  };
  return {
    stream: { getVideoTracks: () => [track], getTracks: () => [track] } as unknown as MediaStream,
    end: () => listeners.get("ended")?.(),
  };
}

const tick = (ms = 0) => new Promise((resolve) => setTimeout(resolve, ms));
const recorder = () => FakeRecorder.last as FakeRecorder;
type UploadCall = [string, Blob, string | undefined, { session: string; index: number }];
// Boshqa testda tugamay qolgan sessiya umumiy mock'ni chaqirishi mumkin: faqat shu testning darsi hisoblanadi
const calls = (): UploadCall[] => (upload.mock.calls as UploadCall[]).filter((call) => call[0] === lesson);
const callOf = (index: number) => calls()[index] as UploadCall;

let counter = 0;
let lesson = "";

describe("TeacherVideoRecordingSession", () => {
  beforeEach(() => {
    // Har testga o'z darsi: oldingi testda qayta urinib turgan sessiya keyingisini bloklamasin
    lesson = `lesson-${++counter}`;
    upload.mockReset().mockResolvedValue(undefined);
    vi.stubGlobal("MediaRecorder", FakeRecorder);
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("uploads chunks in order with the session id, the index and the start time only on the first one", async () => {
    const session = createTeacherVideoRecording(lesson);
    session.start(fakeStream().stream);
    recorder().emit("one");
    recorder().emit("two");
    await session.stopAndFlush();

    expect(calls()).toHaveLength(2);
    expect(callOf(0)[0]).toBe(lesson);
    expect(callOf(0)[2]).toEqual(expect.any(String)); // startedAt (birinchi bo'lak)
    expect(callOf(0)[3]).toEqual({ session: session.sessionId, index: 0 });
    expect(callOf(1)[2]).toBeUndefined();
    expect(callOf(1)[3]).toEqual({ session: session.sessionId, index: 1 });
    expect(session.snapshot.uploadedChunks).toBe(2);
    expect(session.snapshot.pendingChunks).toBe(0);
  });

  it("removes a chunk from the browser store once it is uploaded", async () => {
    const session = createTeacherVideoRecording(lesson);
    session.start(fakeStream().stream);
    recorder().emit("one");
    await session.stopAndFlush();
    await tick(30);
    expect(await chunkStore.leftovers(lesson, "video", new Set())).toHaveLength(0);
  });

  it("keeps the chunk in the browser store while the upload keeps failing", async () => {
    upload.mockRejectedValue(new AppError({ code: API_ERROR_CODES.NETWORK_ERROR, status: 0 }));
    const session = createTeacherVideoRecording(lesson);
    session.start(fakeStream().stream);
    recorder().emit("offline-chunk");
    await tick(150);
    expect(session.snapshot.phase).toBe("retrying");
    expect(session.snapshot.pendingChunks).toBe(1);
    const stored = await chunkStore.leftovers(lesson, "video", new Set());
    expect(stored.map((c) => c.index)).toEqual([0]);
  });

  it("after a page reload sends the previous session's unsent chunks BEFORE the new session's", async () => {
    // oldingi sahifalardan yuklanmay qolgan bo'laklar (sessiyalar "older" va "old")
    const started = new Date(Date.now() - 60_000).toISOString();
    const base = { lessonId: lesson, kind: "video" as const };
    await chunkStore.put({ ...base, session: "old", index: 4, blob: new Blob(["o4"]), createdAt: Date.now() - 50_000 });
    await chunkStore.put({ ...base, session: "old", index: 5, blob: new Blob(["o5"]), createdAt: Date.now() - 40_000 });
    await chunkStore.put({ ...base, session: "older", index: 0, blob: new Blob(["x"]), startedAt: started, createdAt: Date.now() - 90_000 });

    const session = createTeacherVideoRecording(lesson);
    session.start(fakeStream().stream);
    recorder().emit("fresh");
    await session.stopAndFlush();

    const sent = calls().map((call) => `${call[3].session === session.sessionId ? "new" : call[3].session}:${call[3].index}`);
    expect(sent).toEqual(["older:0", "old:4", "old:5", "new:0"]);
    expect(callOf(0)[2]).toBe(started); // eski sessiyaning boshlanish vaqti ham yuboriladi
    await tick(30);
    expect(await chunkStore.leftovers(lesson, "video", new Set())).toHaveLength(0);
  });

  it("does not resend chunks that belong to a session which is still alive in this page", async () => {
    upload
      .mockRejectedValueOnce(new AppError({ code: API_ERROR_CODES.NETWORK_ERROR, status: 0 }))
      .mockResolvedValue(undefined);
    const first = createTeacherVideoRecording(lesson);
    first.start(fakeStream().stream);
    const firstRecorder = recorder();
    firstRecorder.emit("a0"); // birinchi urinish muvaffaqiyatsiz, IndexedDB'da turibdi, 1 s dan keyin qayta uriniladi
    await tick(100);

    const second = createTeacherVideoRecording(lesson);
    second.start(fakeStream().stream);
    recorder().emit("b0");
    await Promise.all([first.stopAndFlush(), second.stopAndFlush()]);

    const sent = calls().map((call) => `${call[3].session === first.sessionId ? "first" : "second"}:${call[3].index}`);
    // a0: bir marta xato + bir marta muvaffaqiyat; b0 faqat a0 dan keyin; qoldiq sifatida ikkinchi marta yuborilmaydi
    expect(sent).toEqual(["first:0", "first:0", "second:0"]);
  });

  it("stops and reports an error when the server refuses the chunk for good", async () => {
    upload.mockRejectedValue(new AppError({ code: API_ERROR_CODES.FORBIDDEN, status: 403, message: "Ruxsat yo'q" }));
    const session = createTeacherVideoRecording(lesson);
    session.start(fakeStream().stream);
    recorder().emit("x");
    await tick(30);
    expect(session.snapshot.phase).toBe("error");
    expect(session.snapshot.error).toBe("Ruxsat yo'q");
    expect(calls()).toHaveLength(1);
  });

  it("flags the recording as interrupted when the browser ends the screen share", async () => {
    const { stream, end } = fakeStream();
    const session = createTeacherVideoRecording(lesson);
    session.start(stream);
    expect(session.snapshot.interrupted).toBe(false);
    recorder().emit("a");
    end(); // "Ulashishni to'xtatish"
    await tick(30);
    expect(session.snapshot.interrupted).toBe(true);
    expect(session.snapshot.phase).toBe("stopped");
    expect(calls()).toHaveLength(1); // bor bo'lak saqlanib yuborildi
  });

  it("a normal stop (finishing the lesson) is NOT reported as an interruption", async () => {
    const session = createTeacherVideoRecording(lesson);
    session.start(fakeStream().stream);
    recorder().emit("a");
    await session.stopAndFlush();
    expect(session.snapshot.interrupted).toBe(false);
  });
});
