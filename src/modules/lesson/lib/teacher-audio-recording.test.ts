import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { API_ERROR_CODES, AppError } from "@/shared/api";

const upload = vi.hoisted(() => vi.fn());
vi.mock("../api/lesson.api", () => ({ lessonApi: { uploadRecordingAudio: upload } }));

import { chunkStore } from "./recording-upload-queue";
import { createTeacherAudioRecording } from "./teacher-audio-recording";

class FakeRecorder {
  static last: FakeRecorder | null = null;
  static isTypeSupported = () => true;
  state: "inactive" | "recording" = "inactive";
  ondataavailable: ((event: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  onerror: (() => void) | null = null;
  requestData = vi.fn();
  constructor() {
    FakeRecorder.last = this;
  }
  start() {
    this.state = "recording";
  }
  stop() {
    this.state = "inactive";
    queueMicrotask(() => this.onstop?.());
  }
  emit(text: string) {
    this.ondataavailable?.({ data: new Blob([text]) });
  }
}

const node = () => ({ connect: vi.fn(), disconnect: vi.fn() });

class FakeAudioContext {
  static last: FakeAudioContext | null = null;
  state = "running";
  oscillator = { ...node(), start: vi.fn(), stop: vi.fn() };
  sources: Array<ReturnType<typeof node>> = [];
  close = vi.fn(() => Promise.resolve());
  resume = vi.fn(() => Promise.resolve());
  constructor() {
    FakeAudioContext.last = this;
  }
  createMediaStreamDestination() {
    return { stream: {} };
  }
  createOscillator() {
    return this.oscillator;
  }
  createGain() {
    return { ...node(), gain: { value: 1 } };
  }
  createMediaStreamSource() {
    const source = node();
    this.sources.push(source);
    return source;
  }
}

class FakeMediaStream {
  tracks: unknown[];
  constructor(tracks: unknown[]) {
    this.tracks = tracks;
  }
}

const audioTrack = (id: string, readyState: "live" | "ended" = "live") =>
  ({ id, kind: "audio", readyState }) as unknown as MediaStreamTrack;
const tick = (ms = 0) => new Promise((resolve) => setTimeout(resolve, ms));
const recorder = () => FakeRecorder.last as FakeRecorder;
const context = () => FakeAudioContext.last as FakeAudioContext;
type UploadCall = [string, Blob, string | undefined, { session: string; index: number }];
const calls = (): UploadCall[] => (upload.mock.calls as UploadCall[]).filter((call) => call[0] === lesson);

let counter = 0;
let lesson = "";

describe("TeacherAudioRecordingSession", () => {
  beforeEach(() => {
    lesson = `audio-lesson-${++counter}`;
    upload.mockReset().mockResolvedValue(undefined);
    vi.stubGlobal("MediaRecorder", FakeRecorder);
    vi.stubGlobal("AudioContext", FakeAudioContext);
    vi.stubGlobal("MediaStream", FakeMediaStream);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("reports an unsupported browser instead of failing", () => {
    vi.stubGlobal("MediaRecorder", undefined);
    const noRecorder = createTeacherAudioRecording(lesson);
    noRecorder.start();
    expect(noRecorder.snapshot.phase).toBe("unsupported");

    vi.stubGlobal("MediaRecorder", FakeRecorder);
    vi.stubGlobal("AudioContext", undefined);
    const noAudio = createTeacherAudioRecording(lesson);
    noAudio.start();
    expect(noAudio.snapshot.phase).toBe("unsupported");
  });

  it("uploads chunks in order with the start time only on the first one", async () => {
    const session = createTeacherAudioRecording(lesson);
    session.start();
    expect(session.snapshot.phase).toBe("recording");
    recorder().emit("one");
    recorder().emit("two");
    await session.stopAndFlush();

    expect(calls().map((call) => call[3])).toEqual([
      { session: session.sessionId, index: 0 },
      { session: session.sessionId, index: 1 },
    ]);
    expect(calls()[0][2]).toEqual(expect.any(String));
    expect(calls()[1][2]).toBeUndefined();
    expect(session.snapshot).toMatchObject({ phase: "stopped", uploadedChunks: 2, pendingChunks: 0 });
  });

  it("asks for the first chunk after five seconds", () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    const session = createTeacherAudioRecording(lesson);
    session.start();
    vi.advanceTimersByTime(4999);
    expect(recorder().requestData).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(recorder().requestData).toHaveBeenCalledTimes(1);
  });

  it("mixes each live audio track once and drops tracks that left", () => {
    const session = createTeacherAudioRecording(lesson);
    session.start();
    session.syncTracks([audioTrack("a"), audioTrack("b"), audioTrack("c", "ended")]);
    session.syncTracks([audioTrack("a"), audioTrack("b")]);
    expect(context().sources).toHaveLength(2);
    session.syncTracks([audioTrack("b")]);
    expect(context().sources[0].disconnect).toHaveBeenCalledTimes(1);
    expect(context().sources[1].disconnect).not.toHaveBeenCalled();
  });

  it("sends the previous page's unsent chunks before the new session's", async () => {
    const started = new Date(Date.now() - 60_000).toISOString();
    await chunkStore.put({ lessonId: lesson, kind: "audio", session: "old", index: 3, blob: new Blob(["o3"]), startedAt: started, createdAt: Date.now() - 50_000 });

    const session = createTeacherAudioRecording(lesson);
    session.start();
    recorder().emit("fresh");
    await session.stopAndFlush();

    expect(calls().map((call) => `${call[3].session === session.sessionId ? "new" : call[3].session}:${call[3].index}`)).toEqual([
      "old:3",
      "new:0",
    ]);
    await tick(30);
    expect(await chunkStore.leftovers(lesson, "audio", new Set())).toHaveLength(0);
  });

  it("stops with an error when the server refuses the chunk for good", async () => {
    upload.mockRejectedValue(new AppError({ code: API_ERROR_CODES.FORBIDDEN, status: 403, message: "Ruxsat yo'q" }));
    const session = createTeacherAudioRecording(lesson);
    session.start();
    recorder().emit("x");
    await tick(30);
    expect(session.snapshot.phase).toBe("error");
    expect(session.snapshot.error).toBe("Ruxsat yo'q");
  });

  it("releases the audio graph when it stops", async () => {
    const session = createTeacherAudioRecording(lesson);
    session.start();
    const audio = context();
    await session.stopAndFlush();
    expect(audio.oscillator.stop).toHaveBeenCalled();
    expect(audio.close).toHaveBeenCalled();
  });
});
