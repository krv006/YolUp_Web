import { AppError } from "@/shared/api";
import { lessonApi } from "../api/lesson.api";

const CHUNK_INTERVAL_MS = 30_000;
const FIRST_CHUNK_MS = 5_000;
const MAX_RETRY_DELAY_MS = 30_000;
const MIME_CANDIDATES = ["video/webm;codecs=vp8", "video/webm"] as const;

export type TeacherVideoRecordingPhase =
  | "idle"
  | "recording"
  | "uploading"
  | "retrying"
  | "stopped"
  | "unsupported"
  | "error";

export interface TeacherVideoRecordingSnapshot {
  phase: TeacherVideoRecordingPhase;
  pendingChunks: number;
  uploadedChunks: number;
  error: string | null;
}

type SnapshotListener = (snapshot: TeacherVideoRecordingSnapshot) => void;

function chooseMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  return MIME_CANDIDATES.find((mime) => MediaRecorder.isTypeSupported(mime));
}

function isRetryableUpload(error: unknown): boolean {
  if (!(error instanceof AppError)) return true;
  return error.status === 0 || error.status === 408 || error.status === 429 || error.status >= 500;
}

function newSessionId(): string {
  const random = globalThis.crypto?.randomUUID?.();
  return random ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => globalThis.setTimeout(resolve, milliseconds));
}

function waitUntilOnline(): Promise<void> {
  if (typeof navigator === "undefined" || navigator.onLine) return Promise.resolve();
  return new Promise((resolve) => {
    globalThis.addEventListener("online", () => resolve(), { once: true });
  });
}

export class TeacherVideoRecordingSession {
  readonly lessonId: string;

  private stream: MediaStream | null = null;
  private recorder: MediaRecorder | null = null;
  private pendingChunks: Array<{ blob: Blob; index: number }> = [];
  // Bo'lak raqami: javob yo'qolib qayta yuborilsa server uni ikkinchi marta yozmaydi
  private readonly sessionId = newSessionId();
  private nextIndex = 0;
  private listeners = new Set<SnapshotListener>();
  private uploadLoop: Promise<void> | null = null;
  private stopPromise: Promise<void> | null = null;
  private resolveStopped: (() => void) | null = null;
  private firstChunkTimer: ReturnType<typeof globalThis.setTimeout> | null = null;
  private startedAt: string | null = null;
  private firstChunkUploaded = false;
  private uploadedChunks = 0;
  private phase: TeacherVideoRecordingPhase = "idle";
  private error: string | null = null;
  private onTrackEnded = () => this.stopAndFlush();

  constructor(lessonId: string) {
    this.lessonId = lessonId;
  }

  get snapshot(): TeacherVideoRecordingSnapshot {
    return {
      phase: this.phase,
      pendingChunks: this.pendingChunks.length,
      uploadedChunks: this.uploadedChunks,
      error: this.error,
    };
  }

  subscribe(listener: SnapshotListener): () => void {
    this.listeners.add(listener);
    listener(this.snapshot);
    return () => this.listeners.delete(listener);
  }

  start(stream: MediaStream): void {
    if (this.recorder || this.phase === "recording") return;
    if (typeof MediaRecorder === "undefined") {
      this.setState("unsupported", "Bu brauzer dars videosini yozishni qo‘llamaydi");
      return;
    }

    try {
      this.stream = stream;
      const mimeType = chooseMimeType();
      this.recorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType, videoBitsPerSecond: 1_500_000 } : { videoBitsPerSecond: 1_500_000 }
      );
      this.recorder.ondataavailable = (event) => {
        if (event.data.size > 0) this.enqueue(event.data);
      };
      this.recorder.onerror = () => {
        this.setState("error", "Dars videosini yozishda brauzer xatosi yuz berdi");
      };
      this.recorder.onstop = () => this.resolveStopped?.();

      stream.getVideoTracks().forEach((track) => track.addEventListener("ended", this.onTrackEnded));

      this.startedAt = new Date().toISOString();
      this.recorder.start(CHUNK_INTERVAL_MS);
      this.setState("recording", null);

      this.firstChunkTimer = globalThis.setTimeout(() => {
        this.firstChunkTimer = null;
        if (this.recorder?.state === "recording") this.recorder.requestData();
      }, FIRST_CHUNK_MS);
    } catch (error) {
      this.setState(
        "error",
        error instanceof Error ? error.message : "Dars videosini yozib bo‘lmadi"
      );
    }
  }

  async stopAndFlush(): Promise<void> {
    if (this.phase === "unsupported" || this.phase === "stopped") return;

    if (this.firstChunkTimer) {
      globalThis.clearTimeout(this.firstChunkTimer);
      this.firstChunkTimer = null;
    }

    if (this.recorder && this.recorder.state !== "inactive") {
      if (!this.stopPromise) {
        this.stopPromise = new Promise((resolve) => {
          this.resolveStopped = resolve;
        });
        this.recorder.stop();
      }
      await this.stopPromise;
    }

    await this.drainUploads();
    this.stream?.getTracks().forEach((track) => {
      track.removeEventListener("ended", this.onTrackEnded);
      track.stop();
    });
    this.stream = null;
    this.recorder = null;
    this.setState("stopped", null);
  }

  private enqueue(chunk: Blob): void {
    this.pendingChunks.push({ blob: chunk, index: this.nextIndex++ });
    this.setState("uploading", null);
    void this.drainUploads().catch(() => undefined);
  }

  private drainUploads(): Promise<void> {
    if (!this.pendingChunks.length) return Promise.resolve();
    if (this.uploadLoop) return this.uploadLoop;

    this.uploadLoop = this.uploadPendingChunks().finally(() => {
      this.uploadLoop = null;
    });
    return this.uploadLoop;
  }

  private async uploadPendingChunks(): Promise<void> {
    let attempt = 0;
    while (this.pendingChunks.length) {
      const chunk = this.pendingChunks[0];
      if (!chunk) return;
      try {
        await lessonApi.uploadRecordingVideo(
          this.lessonId,
          chunk.blob,
          this.firstChunkUploaded ? undefined : (this.startedAt ?? undefined),
          { session: this.sessionId, index: chunk.index }
        );
        this.pendingChunks.shift();
        this.firstChunkUploaded = true;
        this.uploadedChunks += 1;
        attempt = 0;
        this.setState(this.recorder?.state === "recording" ? "recording" : "uploading", null);
      } catch (error) {
        this.error = error instanceof Error ? error.message : "Video bo‘lagini yuklab bo‘lmadi";
        if (!isRetryableUpload(error)) {
          this.setState("error", this.error);
          throw error;
        }

        this.setState("retrying", this.error);
        await waitUntilOnline();
        const delay = Math.min(1_000 * 2 ** attempt, MAX_RETRY_DELAY_MS);
        attempt += 1;
        await wait(delay);
      }
    }
  }

  private setState(phase: TeacherVideoRecordingPhase, error: string | null): void {
    this.phase = phase;
    this.error = error;
    const snapshot = this.snapshot;
    this.listeners.forEach((listener) => listener(snapshot));
  }
}

const sessionsByLesson = new Map<string, Set<TeacherVideoRecordingSession>>();

export function createTeacherVideoRecording(lessonId: string): TeacherVideoRecordingSession {
  const session = new TeacherVideoRecordingSession(lessonId);
  const sessions = sessionsByLesson.get(lessonId) ?? new Set<TeacherVideoRecordingSession>();
  sessions.add(session);
  sessionsByLesson.set(lessonId, sessions);
  return session;
}

export function releaseTeacherVideoRecording(session: TeacherVideoRecordingSession): void {
  void session
    .stopAndFlush()
    .then(() => {
      const sessions = sessionsByLesson.get(session.lessonId);
      sessions?.delete(session);
      if (!sessions?.size) sessionsByLesson.delete(session.lessonId);
    })
    .catch(() => undefined);
}

export async function flushTeacherVideoRecording(lessonId: string): Promise<void> {
  const sessions = [...(sessionsByLesson.get(lessonId) ?? [])];
  await Promise.all(sessions.map((session) => session.stopAndFlush()));
  sessionsByLesson.delete(lessonId);
}
