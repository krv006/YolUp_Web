import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useLiveHealth } from "./use-live-health";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const mocks = vi.hoisted(() => {
  class LocalVideoTrack {
    getSenderStats = vi.fn(async () => [
      { type: "video", frameWidth: 960, frameHeight: 540, framesPerSecond: 8, targetBitrate: 900_000, qualityLimitationReason: "cpu", bytesSent: 1000, timestamp: 0 },
    ]);
    prioritizePerformance = vi.fn(async () => undefined);
  }
  class LocalAudioTrack {
    getSenderStats = vi.fn(async () => ({ type: "audio", jitter: 0.002, packetsLost: 0, bytesSent: 500, timestamp: 0 }));
  }
  const handlers = new Map<string, (...args: unknown[]) => void>();
  const camera = new LocalVideoTrack();
  const room = {
    state: "connected",
    on: vi.fn(),
    off: vi.fn(),
    localParticipant: {
      connectionQuality: "good",
      trackPublications: new Map([
        ["c", { source: "camera", track: camera }],
        ["m", { source: "microphone", track: new LocalAudioTrack() }],
      ]),
      on: vi.fn((event: string, handler: (...args: unknown[]) => void) => handlers.set(event, handler)),
      off: vi.fn(),
    },
  };
  return { LocalVideoTrack, LocalAudioTrack, handlers, camera, room, report: vi.fn(async () => ({})), warning: vi.fn() };
});

vi.mock("@livekit/components-react", () => ({ useRoomContext: () => mocks.room }));
vi.mock("livekit-client", () => ({
  ConnectionState: { Connected: "connected" },
  LocalAudioTrack: mocks.LocalAudioTrack,
  LocalVideoTrack: mocks.LocalVideoTrack,
  ParticipantEvent: { LocalTrackCpuConstrained: "localTrackCpuConstrained" },
  RoomEvent: { Reconnecting: "reconnecting" },
  Track: { Source: { Camera: "camera" } },
}));
vi.mock("sonner", () => ({ toast: { warning: mocks.warning } }));
vi.mock("@/modules/live", async () => {
  const health = await import("@/modules/live/lib/client-health");
  return { ...health, liveApi: { reportHealth: mocks.report } };
});

function Probe() {
  useLiveHealth("l1");
  return null;
}

let root: Root;
beforeEach(() => {
  vi.useFakeTimers();
  root = createRoot(document.createElement("div"));
  act(() => root.render(<Probe />));
});
afterEach(() => {
  act(() => root.unmount());
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe("live health", () => {
  it("sends a diagnostics report every 30 seconds", async () => {
    await act(async () => {
      await vi.advanceTimersByTimeAsync(30_000);
    });
    expect(mocks.report).toHaveBeenCalledTimes(1);
    const [lessonId, payload] = mocks.report.mock.calls[0] as unknown as [string, Record<string, unknown>];
    expect(lessonId).toBe("l1");
    expect(payload).toMatchObject({
      cpu_constrained: true,
      connection_quality: "good",
      tracks: [
        { source: "camera", fps: 8, width: 960, height: 540, quality_limitation_reason: "cpu" },
        { source: "microphone", jitter: 0.002, packets_lost: 0 },
      ],
    });
  });

  it("lowers the camera once and tells the user when the computer is overloaded", async () => {
    const onCpu = mocks.handlers.get("localTrackCpuConstrained")!;
    act(() => onCpu(mocks.camera, { source: "camera" }));
    act(() => onCpu(mocks.camera, { source: "camera" }));
    expect(mocks.camera.prioritizePerformance).toHaveBeenCalledTimes(1);
    expect(mocks.warning).toHaveBeenCalledTimes(1);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(30_000);
    });
    expect((mocks.report.mock.calls[0] as unknown as [string, { events: string[] }])[1].events).toEqual(["cpu_constrained"]);
  });
});
