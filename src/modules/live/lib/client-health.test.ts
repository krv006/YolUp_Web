import { describe, expect, it } from "vitest";
import type { VideoSenderStats } from "livekit-client";
import { audioHealth, bitrateSince, clientHealthReport, isHealthSource, sentBytes, videoHealth } from "./client-health";

const layer = (patch: Partial<VideoSenderStats>) =>
  ({ type: "video", frameWidth: 320, frameHeight: 180, framesPerSecond: 24, targetBitrate: 150_000, timestamp: 0, ...patch }) as VideoSenderStats;

describe("client health report", () => {
  it("reports the biggest camera layer with the reason it was limited", () => {
    const stats = [layer({}), layer({ frameWidth: 960, frameHeight: 540, framesPerSecond: 9.5, qualityLimitationReason: "cpu", roundTripTime: 0.035, packetsLost: 2 })];
    expect(videoHealth("camera", stats, 400_000)).toEqual({
      source: "camera",
      fps: 9.5,
      width: 960,
      height: 540,
      target_bitrate: 150_000,
      bitrate: 400_000,
      quality_limitation_reason: "cpu",
      packets_lost: 2,
      rtt: 35,
    });
    expect(videoHealth("camera", [])).toBeNull();
  });

  it("leaves out an unknown limitation reason", () => {
    expect(videoHealth("screen_share", [layer({ qualityLimitationReason: "weird" })])).not.toHaveProperty("quality_limitation_reason");
  });

  it("measures the sending bitrate between two reports", () => {
    expect(sentBytes([{ bytesSent: 1000 }, { bytesSent: 500 }, {}])).toBe(1500);
    expect(bitrateSince({ bytes: 1000, at: 0 }, 51_000, 2000)).toBe(200_000);
    expect(bitrateSince(undefined, 51_000, 2000)).toBeUndefined();
    expect(bitrateSince({ bytes: 9000, at: 0 }, 100, 2000)).toBeUndefined();
  });

  it("builds the payload the backend expects", () => {
    const camera = videoHealth("camera", [layer({ qualityLimitationReason: "cpu" })])!;
    const mic = audioHealth("microphone", { type: "audio", timestamp: 0, jitter: 0.004, packetsLost: 0 })!;
    const report = clientHealthReport({
      tracks: [camera, mic],
      events: ["reconnecting"],
      cpuEvent: false,
      connectionQuality: "good",
      pageVisible: true,
      hardwareConcurrency: 8,
    });
    expect(report).toEqual({
      cpu_constrained: true,
      hardware_concurrency: 8,
      connection_quality: "good",
      page_visible: true,
      events: ["reconnecting"],
      tracks: [camera, { source: "microphone", packets_lost: 0, jitter: 0.004 }],
    });
    expect(clientHealthReport({ tracks: [], events: [], cpuEvent: false, connectionQuality: "excellent?", pageVisible: false }).connection_quality).toBe("unknown");
    expect(isHealthSource("screen_share_audio")).toBe(true);
    expect(isHealthSource("unknown")).toBe(false);
  });
});
