import { useEffect } from "react";
import { useRoomContext } from "@livekit/components-react";
import {
  ConnectionState,
  LocalAudioTrack,
  LocalVideoTrack,
  ParticipantEvent,
  RoomEvent,
  Track,
  type LocalTrackPublication,
} from "livekit-client";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  audioHealth,
  bitrateSince,
  clientHealthReport,
  isHealthSource,
  liveApi,
  sentBytes,
  videoHealth,
  type HealthTrack,
} from "@/modules/live";

const HEALTH_INTERVAL_MS = 30_000;

export function useLiveHealth(lessonId: string) {
  const { t } = useTranslation("live");
  const room = useRoomContext();

  useEffect(() => {
    const events: string[] = [];
    const sent = new Map<string, { bytes: number; at: number }>();
    let cpuEvent = false;
    let lowered = false;

    const note = (event: string) => {
      if (events.length < 10 && !events.includes(event)) events.push(event);
    };

    const onCpu = (track: LocalVideoTrack, publication: LocalTrackPublication) => {
      cpuEvent = true;
      note("cpu_constrained");
      if (lowered || publication.source !== Track.Source.Camera) return;
      lowered = true;
      void track.prioritizePerformance().catch(() => undefined);
      toast.warning(t("health.cpuLowered"), { id: "cpu-lowered", duration: 12_000 });
    };
    const onReconnecting = () => note("reconnecting");

    async function trackHealth(publication: LocalTrackPublication): Promise<HealthTrack | null> {
      const { track, source } = publication;
      if (!track || !isHealthSource(source)) return null;
      const now = Date.now();
      if (track instanceof LocalVideoTrack) {
        const stats = await track.getSenderStats().catch(() => []);
        const bytes = sentBytes(stats);
        const bitrate = bitrateSince(sent.get(source), bytes, now);
        sent.set(source, { bytes, at: now });
        return videoHealth(source, stats, bitrate);
      }
      if (track instanceof LocalAudioTrack) {
        const stats = await track.getSenderStats().catch(() => undefined);
        const bytes = stats?.bytesSent ?? 0;
        const bitrate = bitrateSince(sent.get(source), bytes, now);
        sent.set(source, { bytes, at: now });
        return audioHealth(source, stats, bitrate);
      }
      return null;
    }

    async function report() {
      if (room.state !== ConnectionState.Connected) return;
      const publications = [...room.localParticipant.trackPublications.values()];
      const tracks = (await Promise.all(publications.map(trackHealth))).filter((item) => item !== null);
      const payload = clientHealthReport({
        tracks,
        events: [...events],
        cpuEvent,
        connectionQuality: room.localParticipant.connectionQuality,
        pageVisible: document.visibilityState === "visible",
        hardwareConcurrency: navigator.hardwareConcurrency,
        deviceMemory: (navigator as Navigator & { deviceMemory?: number }).deviceMemory,
      });
      events.length = 0;
      cpuEvent = false;
      await liveApi.reportHealth(lessonId, payload).catch(() => undefined);
    }

    room.localParticipant.on(ParticipantEvent.LocalTrackCpuConstrained, onCpu);
    room.on(RoomEvent.Reconnecting, onReconnecting);
    const timer = window.setInterval(() => void report(), HEALTH_INTERVAL_MS);
    return () => {
      window.clearInterval(timer);
      room.localParticipant.off(ParticipantEvent.LocalTrackCpuConstrained, onCpu);
      room.off(RoomEvent.Reconnecting, onReconnecting);
    };
  }, [room, lessonId, t]);
}
