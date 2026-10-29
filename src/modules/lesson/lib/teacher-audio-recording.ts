import { lessonApi } from "../api/lesson.api";
import { chunkStore, newSessionId, runExclusive, uploadWithRetry } from "./recording-upload-queue";

const CHUNK_INTERVAL_MS = 30_000;
const FIRST_CHUNK_MS = 5_000;
const MIME_CANDIDATES = ["audio/webm;codecs=opus", "audio/webm"] as const;

export type TeacherAudioRecordingPhase =
  | "idle"
  | "recording"
  | "uploading"
  | "retrying"
  | "stopped"
  | "unsupported"
  | "error";

export interface TeacherAudioRecordingSnapshot {
  phase: TeacherAudioRecordingPhase;
  pendingChunks: number;
  uploadedChunks: number;
  error: string | null;
}

type SnapshotListener = (snapshot: TeacherAudioRecordingSnapshot) => void;

function chooseMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  return MIME_CANDIDATES.find((mime) => MediaRecorder.isTypeSupported(mime));
}

export class TeacherAudioRecordingSession {
  readonly lessonId: string;
  readonly sessionId = newSessionId();

  private audioContext: AudioContext | null = null;
  private destination: MediaStreamAudioDestinationNode | null = null;
  private recorder: MediaRecorder | null = null;
  private sources = new Map<string, MediaStreamAudioSourceNode>();
  private pendingChunks: Array<{ blob: Blob; index: number }> = [];
  // Bo'lak raqami: javob yo'qolib qayta yuborilsa server uni ikkinchi marta yozmaydi
  private nextIndex = 0;
  private listeners = new Set<SnapshotListener>();
  private uploadLoop: Promise<void> | null = null;
  private stopPromise: Promise<void> | null = null;
  private resolveStopped: (() => void) | null = null;
  private keepAlive: { oscillator: OscillatorNode; gain: GainNode } | null = null;
  private firstChunkTimer: ReturnType<typeof globalThis.setTimeout> | null = null;
  private startedAt: string | null = null;
  private firstChunkUploaded = false;
  private leftoversChecked = false;
  private uploadedChunks = 0;
  private phase: TeacherAudioRecordingPhase = "idle";
  private error: string | null = null;

  constructor(lessonId: string) {
    this.lessonId = lessonId;
  }

  get snapshot(): TeacherAudioRecordingSnapshot {
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

  start(): void {
    if (this.recorder || this.phase === "recording") return;
    if (typeof MediaRecorder === "undefined") {
      this.setState("unsupported", "Bu brauzer dars audiosini yozishni qo‘llamaydi");
      return;
    }

    const AudioContextConstructor =
      globalThis.AudioContext ??
      (globalThis as typeof globalThis & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioContextConstructor) {
      this.setState("unsupported", "Bu brauzer Web Audio API’ni qo‘llamaydi");
      return;
    }

    try {
      this.audioContext = new AudioContextConstructor();
      this.destination = this.audioContext.createMediaStreamDestination();
      const mimeType = chooseMimeType();
      this.recorder = new MediaRecorder(
        this.destination.stream,
        mimeType ? { mimeType, audioBitsPerSecond: 128_000 } : { audioBitsPerSecond: 128_000 }
      );
      this.recorder.ondataavailable = (event) => {
        if (event.data.size > 0) this.enqueue(event.data);
      };
      this.recorder.onerror = () => {
        this.setState("error", "Dars audiosini yozishda brauzer xatosi yuz berdi");
      };
      this.recorder.onstop = () => this.resolveStopped?.();

      if (this.audioContext.state === "suspended") {
        void this.audioContext.resume().catch(() => undefined);
      }
      this.attachSilence();

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
        error instanceof Error ? error.message : "Dars audiosini yozib bo‘lmadi"
      );
    }
  }

  private attachSilence(): void {
    if (!this.audioContext || !this.destination || this.keepAlive) return;
    const oscillator = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    gain.gain.value = 0;
    oscillator.connect(gain);
    gain.connect(this.destination);
    oscillator.start();
    this.keepAlive = { oscillator, gain };
  }

  syncTracks(tracks: readonly MediaStreamTrack[]): void {
    if (!this.audioContext || !this.destination) return;
    const currentIds = new Set(tracks.filter((track) => track.readyState === "live").map((track) => track.id));

    this.sources.forEach((source, id) => {
      if (currentIds.has(id)) return;
      source.disconnect();
      this.sources.delete(id);
    });

    tracks.forEach((track) => {
      if (track.kind !== "audio" || track.readyState !== "live" || this.sources.has(track.id)) return;
      const source = this.audioContext?.createMediaStreamSource(new MediaStream([track]));
      if (!source || !this.destination) return;
      source.connect(this.destination);
      this.sources.set(track.id, source);
    });
  }

  async stopAndFlush(): Promise<void> {
    if (this.phase === "unsupported") return;

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
    this.keepAlive?.oscillator.stop();
    this.keepAlive?.oscillator.disconnect();
    this.keepAlive?.gain.disconnect();
    this.keepAlive = null;
    this.sources.forEach((source) => source.disconnect());
    this.sources.clear();
    await this.audioContext?.close().catch(() => undefined);
    this.audioContext = null;
    this.destination = null;
    this.recorder = null;
    this.setState("stopped", null);
  }

  private enqueue(chunk: Blob): void {
    const index = this.nextIndex++;
    this.pendingChunks.push({ blob: chunk, index });
    // Yuklanmaguncha brauzer xotirasida ham saqlanadi: sahifa yopilsa/yangilansa keyingi sessiya yuboradi
    void chunkStore.put({
      lessonId: this.lessonId,
      kind: "audio",
      session: this.sessionId,
      index,
      blob: chunk,
      startedAt: index === 0 ? (this.startedAt ?? undefined) : undefined,
      createdAt: Date.now(),
    });
    this.setState("uploading", null);
    void this.drainUploads().catch(() => undefined);
  }

  private drainUploads(): Promise<void> {
    if (!this.pendingChunks.length) return Promise.resolve();
    if (this.uploadLoop) return this.uploadLoop;

    // Bir dars uchun audio yuklashlari ketma-ket (eski sessiyaning bo'laklari yangisidan oldin yetib borishi kerak)
    this.uploadLoop = runExclusive(`${this.lessonId}|audio`, () => this.uploadPendingChunks()).finally(() => {
      this.uploadLoop = null;
    });
    return this.uploadLoop;
  }

  /** Oldingi sessiyadan (sahifa yopilgan/yangilangan) yuklanmay qolgan bo'laklar — yangi sessiyadan OLDIN. */
  private async uploadLeftovers(): Promise<void> {
    if (this.leftoversChecked) return;
    const leftovers = await chunkStore.leftovers(this.lessonId, "audio", activeSessionIds(this.lessonId));
    for (const chunk of leftovers) {
      try {
        await uploadWithRetry(
          () =>
            lessonApi.uploadRecordingAudio(this.lessonId, chunk.blob, chunk.startedAt, {
              session: chunk.session,
              index: chunk.index,
            }),
          (error) => this.setState("retrying", error instanceof Error ? error.message : null)
        );
      } catch {
        // qayta urinib bo'lmaydigan xato (dars yopilgan, ruxsat yo'q): bu bo'lak endi kerak emas
      }
      await chunkStore.remove(chunk);
    }
    this.leftoversChecked = true;
  }

  private async uploadPendingChunks(): Promise<void> {
    await this.uploadLeftovers();
    while (this.pendingChunks.length) {
      const chunk = this.pendingChunks[0];
      if (!chunk) return;
      try {
        await uploadWithRetry(
          () =>
            lessonApi.uploadRecordingAudio(
              this.lessonId,
              chunk.blob,
              this.firstChunkUploaded ? undefined : (this.startedAt ?? undefined),
              { session: this.sessionId, index: chunk.index }
            ),
          (error) =>
            this.setState("retrying", error instanceof Error ? error.message : "Audio bo‘lagini yuklab bo‘lmadi")
        );
      } catch (error) {
        this.setState("error", error instanceof Error ? error.message : "Audio bo‘lagini yuklab bo‘lmadi");
        throw error;
      }
      this.pendingChunks.shift();
      void chunkStore.remove({ lessonId: this.lessonId, kind: "audio", session: this.sessionId, index: chunk.index });
      this.firstChunkUploaded = true;
      this.uploadedChunks += 1;
      this.setState(this.recorder?.state === "recording" ? "recording" : "uploading", null);
    }
  }

  private setState(phase: TeacherAudioRecordingPhase, error: string | null): void {
    this.phase = phase;
    this.error = error;
    const snapshot = this.snapshot;
    this.listeners.forEach((listener) => listener(snapshot));
  }
}

const sessionsByLesson = new Map<string, Set<TeacherAudioRecordingSession>>();

function activeSessionIds(lessonId: string): Set<string> {
  return new Set([...(sessionsByLesson.get(lessonId) ?? [])].map((session) => session.sessionId));
}

export function createTeacherAudioRecording(lessonId: string): TeacherAudioRecordingSession {
  const session = new TeacherAudioRecordingSession(lessonId);
  const sessions = sessionsByLesson.get(lessonId) ?? new Set<TeacherAudioRecordingSession>();
  sessions.add(session);
  sessionsByLesson.set(lessonId, sessions);
  return session;
}

export function releaseTeacherAudioRecording(session: TeacherAudioRecordingSession): void {
  void session
    .stopAndFlush()
    .then(() => {
      const sessions = sessionsByLesson.get(session.lessonId);
      sessions?.delete(session);
      if (!sessions?.size) sessionsByLesson.delete(session.lessonId);
    })
    .catch(() => undefined);
}

export async function flushTeacherAudioRecording(lessonId: string): Promise<void> {
  const sessions = [...(sessionsByLesson.get(lessonId) ?? [])];
  await Promise.all(sessions.map((session) => session.stopAndFlush()));
  sessionsByLesson.delete(lessonId);
}
