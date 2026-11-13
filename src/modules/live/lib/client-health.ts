import type { AudioSenderStats, VideoSenderStats } from "livekit-client";

export const HEALTH_SOURCES = ["camera", "microphone", "screen_share", "screen_share_audio"] as const;
export type HealthSource = (typeof HEALTH_SOURCES)[number];

export interface HealthTrack {
  source: HealthSource;
  fps?: number;
  width?: number;
  height?: number;
  target_bitrate?: number;
  bitrate?: number;
  quality_limitation_reason?: "none" | "cpu" | "bandwidth" | "other";
  packets_lost?: number;
  jitter?: number;
  rtt?: number;
}

export interface ClientHealthReport {
  cpu_constrained: boolean;
  hardware_concurrency?: number;
  device_memory?: number;
  connection_quality: string;
  page_visible: boolean;
  events: string[];
  tracks: HealthTrack[];
}

const REASONS = new Set(["none", "cpu", "bandwidth", "other"]);

function finite(value: number | undefined): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function compact<T extends object>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined)) as T;
}

export function isHealthSource(source: string): source is HealthSource {
  return (HEALTH_SOURCES as readonly string[]).includes(source);
}

export function sentBytes(stats: ReadonlyArray<{ bytesSent?: number }>): number {
  return stats.reduce((sum, item) => sum + (item.bytesSent ?? 0), 0);
}

export function bitrateSince(previous: { bytes: number; at: number } | undefined, bytes: number, at: number): number | undefined {
  if (!previous || at <= previous.at || bytes < previous.bytes) return undefined;
  return Math.round(((bytes - previous.bytes) * 8 * 1000) / (at - previous.at));
}

export function videoHealth(source: HealthSource, stats: readonly VideoSenderStats[], bitrate?: number): HealthTrack | null {
  if (!stats.length) return null;
  const main = stats.reduce((best, item) => (item.frameWidth * item.frameHeight > best.frameWidth * best.frameHeight ? item : best));
  const reason = main.qualityLimitationReason;
  return compact({
    source,
    fps: finite(main.framesPerSecond),
    width: finite(main.frameWidth),
    height: finite(main.frameHeight),
    target_bitrate: finite(main.targetBitrate),
    bitrate: finite(bitrate),
    quality_limitation_reason: reason && REASONS.has(reason) ? (reason as HealthTrack["quality_limitation_reason"]) : undefined,
    packets_lost: finite(main.packetsLost),
    jitter: finite(main.jitter),
    rtt: main.roundTripTime === undefined ? undefined : Math.round(main.roundTripTime * 1000),
  });
}

export function audioHealth(source: HealthSource, stats: AudioSenderStats | undefined, bitrate?: number): HealthTrack | null {
  if (!stats) return null;
  return compact({
    source,
    bitrate: finite(bitrate),
    packets_lost: finite(stats.packetsLost),
    jitter: finite(stats.jitter),
    rtt: stats.roundTripTime === undefined ? undefined : Math.round(stats.roundTripTime * 1000),
  });
}

export function clientHealthReport(input: {
  tracks: HealthTrack[];
  events: string[];
  cpuEvent: boolean;
  connectionQuality: string;
  pageVisible: boolean;
  hardwareConcurrency?: number;
  deviceMemory?: number;
}): ClientHealthReport {
  return compact({
    cpu_constrained: input.cpuEvent || input.tracks.some((track) => track.quality_limitation_reason === "cpu"),
    hardware_concurrency: finite(input.hardwareConcurrency),
    device_memory: finite(input.deviceMemory),
    connection_quality: ["excellent", "good", "poor", "lost"].includes(input.connectionQuality) ? input.connectionQuality : "unknown",
    page_visible: input.pageVisible,
    events: input.events.slice(0, 10),
    tracks: input.tracks.slice(0, 8),
  });
}
