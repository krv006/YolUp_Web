import { useEffect, useMemo, useRef, useState } from "react";
import {
  DisconnectButton,
  ParticipantTile,
  RoomAudioRenderer,
  TrackToggle,
  useConnectionState,
  useLocalParticipantPermissions,
  useParticipants,
  useRoomContext,
  useTracks,
  type TrackReferenceOrPlaceholder,
} from "@livekit/components-react";
import { ConnectionState, RoomEvent, Track, type Participant } from "livekit-client";
import {
  ArrowLeft,
  CircleStop,
  Hand,
  Info,
  LayoutDashboard,
  Mic,
  MicOff,
  MonitorUp,
  MoreHorizontal,
  PhoneOff,
  UserRoundPlus,
  UserRoundX,
  Users,
  Video,
  VideoOff,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { AwayStudentsNotice, BoardPanel } from "@/modules/board";
import { Drawer, DrawerContent, DrawerTitle } from "@/shared/ui/drawer";
import { i18n } from "@/shared/i18n";
import {
  FinishLessonDialog,
  useTeacherAudioRecording,
  useTeacherVideoRecording,
  type TeacherAudioRecordingSnapshot,
  type TeacherVideoRecordingSnapshot,
} from "@/modules/lesson";
import {
  AttentionCheckDialog,
  CAMERA_SOURCE,
  canPublishSource,
  decodeScreenShareRequest,
  encodeScreenShareRequest,
  LessonInviteDialog,
  MediaPermissionDialog,
  MICROPHONE_SOURCE,
  SCREEN_SHARE_SOURCE,
  useAllowShare,
  useAttentionCheck,
  useBanFromLesson,
  useCameraSignals,
  useFocusTracker,
  useMicSignals,
  type CameraRequest,
  type MicRequest,
} from "@/modules/live";
import type { Lesson } from "@/shared/types";
import { Avatar, Button } from "@/shared/ui/legacy";

type SidePanel = "board" | "people" | null;

const MAX_RECONNECT_ATTEMPTS = 5;

function useConnectionLabels(): Record<string, string> {
  const { t } = useTranslation("live");
  return {
    [ConnectionState.Connecting]: t("connection.connecting"),
    [ConnectionState.Connected]: t("connection.connected"),
    [ConnectionState.Reconnecting]: t("connection.reconnecting"),
    [ConnectionState.Disconnected]: t("connection.disconnected"),
  };
}

function useAudioRecordingLabels(): Record<TeacherAudioRecordingSnapshot["phase"], string> {
  const { t } = useTranslation("live");
  return {
    idle: t("audioRecording.idle"),
    recording: t("audioRecording.recording"),
    uploading: t("audioRecording.uploading"),
    retrying: t("audioRecording.retrying"),
    stopped: t("audioRecording.stopped"),
    unsupported: t("audioRecording.unsupported"),
    error: t("audioRecording.error"),
  };
}

function useVideoRecordingLabels(): Record<TeacherVideoRecordingSnapshot["phase"], string> {
  const { t } = useTranslation("live");
  return {
    idle: t("videoRecording.idle"),
    recording: t("videoRecording.recording"),
    uploading: t("videoRecording.uploading"),
    retrying: t("videoRecording.retrying"),
    stopped: t("videoRecording.stopped"),
    unsupported: t("videoRecording.unsupported"),
    error: t("videoRecording.error"),
  };
}

function firstName(value: string): string {
  return value.trim().split(/\s+/)[0] ?? value;
}

function CameraTile({
  track,
  compact = false,
}: {
  track: TrackReferenceOrPlaceholder;
  compact?: boolean;
}) {
  const { t } = useTranslation("live");
  const publication = "publication" in track ? track.publication : undefined;
  const cameraOff = !publication || publication.isMuted;
  const name = track.participant.name || track.participant.identity;
  const speaking = track.participant.isSpeaking;
  const micOn = track.participant.isMicrophoneEnabled;

  return (
    <article
      className={`live-camera-tile relative isolate overflow-hidden rounded-2xl bg-subtle ${
        compact ? "is-compact" : ""
      } ${cameraOff ? "is-camera-off" : ""} ${
        speaking ? "ring-2 ring-success" : "ring-1 ring-line"
      }`}
    >
      <ParticipantTile trackRef={track} disableSpeakingIndicator={cameraOff} />
      {cameraOff ? (
        <div
          className="live-camera-placeholder absolute inset-0 grid place-items-center bg-subtle"
          aria-label={t("room.cameraOffAria", { name })}
        >
          <Avatar name={name} size={compact ? "sm" : "lg"} />
        </div>
      ) : null}
      <span className="live-camera-name absolute bottom-3 left-3 z-10 flex items-center gap-2 rounded-full bg-black/55 px-3 py-1.5 text-label-strong text-white backdrop-blur-sm">
        {micOn ? (
          <Mic size={15} className="shrink-0" />
        ) : (
          <MicOff size={15} className="shrink-0 text-white/70" />
        )}
        {track.participant.isLocal ? t("room.youLabel") : firstName(name)}
      </span>
    </article>
  );
}

function ReconnectBanner() {
  const { t } = useTranslation("live");
  const room = useRoomContext();
  const connectionState = useConnectionState();
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    function onReconnecting() {
      setAttempt((current) => Math.min(current + 1, MAX_RECONNECT_ATTEMPTS));
    }
    function onReconnected() {
      setAttempt(0);
    }
    room.on(RoomEvent.Reconnecting, onReconnecting);
    room.on(RoomEvent.Reconnected, onReconnected);
    return () => {
      room.off(RoomEvent.Reconnecting, onReconnecting);
      room.off(RoomEvent.Reconnected, onReconnected);
    };
  }, [room]);

  if (connectionState !== ConnectionState.Reconnecting) return null;

  return (
    <div
      role="status"
      className="pointer-events-none absolute inset-x-0 top-3 z-30 flex justify-center px-4"
    >
      <span className="flex items-center gap-2.5 rounded-xl bg-saffron-subtle px-4 py-3 text-body-sm text-ink-inverse shadow-lg">
        <Info size={17} className="shrink-0 text-saffron-strong" />
        {t("room.reconnecting", {
          attempt: Math.max(1, attempt),
          total: MAX_RECONNECT_ATTEMPTS,
        })}
      </span>
    </div>
  );
}

function MediaPermissionWatcher({ onDenied }: { onDenied: () => void }) {
  const room = useRoomContext();

  useEffect(() => {
    function onError(error: Error) {
      if (error.name === "NotAllowedError" || error.name === "SecurityError") onDenied();
    }
    room.on(RoomEvent.MediaDevicesError, onError);
    return () => {
      room.off(RoomEvent.MediaDevicesError, onError);
    };
  }, [room, onDenied]);

  return null;
}

function StudentMicControl({
  onRequest,
  requesting,
  waiting,
}: {
  onRequest: () => void;
  requesting: boolean;
  waiting: boolean;
}) {
  const { t } = useTranslation("live");
  const permissions = useLocalParticipantPermissions();
  const canSpeak = canPublishSource(permissions, MICROPHONE_SOURCE);

  if (canSpeak) {
    return (
      <TrackToggle
        source={Track.Source.Microphone}
        showIcon={false}
        className="live-control"
        aria-label={t("mic.label")}
      >
        <Mic size={19} />
        <MicOff size={19} className="live-control-off" />
      </TrackToggle>
    );
  }

  return (
    <button
      type="button"
      className={`live-control live-control--mic-request ${waiting ? "is-waiting" : ""}`}
      aria-label={waiting ? t("mic.requestSentAria") : t("mic.requestAria")}
      title={waiting ? t("mic.requestSentTitle") : t("mic.requestTitle")}
      disabled={requesting || waiting}
      onClick={onRequest}
    >
      <MicOff size={19} />
      <Hand size={13} className="live-control-corner" aria-hidden="true" />
    </button>
  );
}

function TeacherMicControl() {
  const { t } = useTranslation("live");
  const permissions = useLocalParticipantPermissions();

  if (canPublishSource(permissions, MICROPHONE_SOURCE)) {
    return (
      <TrackToggle
        source={Track.Source.Microphone}
        showIcon={false}
        className="live-control"
        aria-label={t("mic.label")}
      >
        <Mic size={19} />
        <MicOff size={19} className="live-control-off" />
      </TrackToggle>
    );
  }

  return (
    <button
      type="button"
      className="live-control"
      disabled
      aria-label={t("mic.disabledAria")}
      title={t("mic.disabledTitle")}
    >
      <MicOff size={19} />
    </button>
  );
}

function StudentCameraControl({
  onRequest,
  requesting,
  waiting,
}: {
  onRequest: () => void;
  requesting: boolean;
  waiting: boolean;
}) {
  const { t } = useTranslation("live");
  const permissions = useLocalParticipantPermissions();
  const canPublishCamera = canPublishSource(permissions, CAMERA_SOURCE);

  if (canPublishCamera) {
    return (
      <TrackToggle
        source={Track.Source.Camera}
        showIcon={false}
        className="live-control"
        aria-label={t("camera.label")}
      >
        <Video size={19} />
        <VideoOff size={19} className="live-control-off" />
      </TrackToggle>
    );
  }

  return (
    <button
      type="button"
      className={`live-control live-control--mic-request ${waiting ? "is-waiting" : ""}`}
      aria-label={waiting ? t("camera.requestSentAria") : t("camera.requestAria")}
      title={waiting ? t("camera.requestSentTitle") : t("camera.requestTitle")}
      disabled={requesting || waiting}
      onClick={onRequest}
    >
      <VideoOff size={19} />
      <Hand size={13} className="live-control-corner" aria-hidden="true" />
    </button>
  );
}

function TeacherCameraControl() {
  const { t } = useTranslation("live");
  const permissions = useLocalParticipantPermissions();

  if (canPublishSource(permissions, CAMERA_SOURCE)) {
    return (
      <TrackToggle
        source={Track.Source.Camera}
        showIcon={false}
        className="live-control"
        aria-label={t("camera.label")}
      >
        <Video size={19} />
        <VideoOff size={19} className="live-control-off" />
      </TrackToggle>
    );
  }

  return (
    <button
      type="button"
      className="live-control"
      disabled
      aria-label={t("camera.disabledAria")}
      title={t("camera.disabledTitle")}
    >
      <VideoOff size={19} />
    </button>
  );
}

async function waitForVideoDimensions(track: MediaStreamTrack, timeoutMs = 500): Promise<void> {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const { width, height } = track.getSettings();
    if (width && height) return;
    await new Promise((resolve) => globalThis.setTimeout(resolve, 30));
  }
}

function TeacherShareControl({ screenStream }: { screenStream: MediaStream }) {
  const { t } = useTranslation("live");
  const room = useRoomContext();
  const connectionState = useConnectionState();
  const [sharing, setSharing] = useState(false);
  const [starting, setStarting] = useState(false);
  const publishedRef = useRef<MediaStreamTrack[]>([]);
  const autoStartedRef = useRef(false);

  async function stopSharing() {
    const toStop = publishedRef.current;
    publishedRef.current = [];
    setSharing(false);
    await Promise.all(
      toStop.map((track) => room.localParticipant.unpublishTrack(track, true))
    );
  }

  async function startSharing() {
    setStarting(true);
    try {
      const toPublish: Array<{ track: MediaStreamTrack; source: Track.Source }> = [];
      const videoTrack = screenStream.getVideoTracks()[0];
      const audioTrack = screenStream.getAudioTracks()[0];
      if (videoTrack) {
        const clone = videoTrack.clone();
        await waitForVideoDimensions(clone);
        toPublish.push({ track: clone, source: Track.Source.ScreenShare });
      }
      if (audioTrack) toPublish.push({ track: audioTrack.clone(), source: Track.Source.ScreenShareAudio });

      try {
        const published: MediaStreamTrack[] = [];
        for (const { track, source } of toPublish) {
          await room.localParticipant.publishTrack(track, { source });
          published.push(track);
        }
        publishedRef.current = published;
        setSharing(true);
      } catch {
        toPublish.forEach(({ track }) => track.stop());
        toast.error(t("share.failedToast"));
      }
    } finally {
      setStarting(false);
    }
  }

  useEffect(() => {
    const videoTrack = screenStream.getVideoTracks()[0];
    if (!videoTrack) return undefined;
    const handleEnded = () => void stopSharing();
    videoTrack.addEventListener("ended", handleEnded);
    return () => videoTrack.removeEventListener("ended", handleEnded);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screenStream]);

  useEffect(() => {
    if (autoStartedRef.current) return;
    if (connectionState !== ConnectionState.Connected) return;
    autoStartedRef.current = true;
    queueMicrotask(() => void startSharing());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectionState]);

  async function toggleShare() {
    if (starting) return;
    if (sharing) {
      await stopSharing();
      return;
    }
    await startSharing();
  }

  return (
    <button
      type="button"
      className="live-control live-control--share"
      data-lk-enabled={sharing}
      aria-pressed={sharing}
      aria-label={t("share.teacherAria")}
      title={t("share.teacherTitle")}
      disabled={starting}
      onClick={toggleShare}
    >
      <MonitorUp size={19} />
    </button>
  );
}

function StudentShareControl() {
  const { t } = useTranslation("live");
  const room = useRoomContext();
  const permissions = useLocalParticipantPermissions();
  const [requesting, setRequesting] = useState(false);
  const canShare = canPublishSource(permissions, SCREEN_SHARE_SOURCE);

  if (canShare) {
    return (
      <TrackToggle
        source={Track.Source.ScreenShare}
        captureOptions={{ audio: true, selfBrowserSurface: "exclude" }}
        showIcon={false}
        className="live-control live-control--share"
        aria-label={t("share.studentAria")}
      >
        <MonitorUp size={19} />
      </TrackToggle>
    );
  }

  async function requestShare() {
    if (requesting) return;
    setRequesting(true);
    try {
      const signal = encodeScreenShareRequest(
        room.localParticipant.name || room.localParticipant.identity
      );
      await room.localParticipant.publishData(signal.payload, {
        reliable: true,
        topic: signal.topic,
      });
      toast.success(t("share.requestSentToast"));
    } catch {
      toast.error(t("share.requestFailedToast"));
    } finally {
      setRequesting(false);
    }
  }

  return (
    <button
      type="button"
      className="live-control live-control--share-request"
      aria-label={t("share.requestAria")}
      title={t("share.requestTitle")}
      disabled={requesting}
      onClick={requestShare}
    >
      <MonitorUp size={19} />
      <span className="live-control-request-dot" aria-hidden="true" />
    </button>
  );
}

function ShareRequestListener({ lessonId, enabled }: { lessonId: string; enabled: boolean }) {
  const room = useRoomContext();
  const { mutate: grantShare } = useAllowShare(lessonId);

  useEffect(() => {
    if (!enabled) return;

    function receive(
      payload: Uint8Array,
      participant: Participant | undefined,
      _kind: unknown,
      topic?: string
    ) {
      const request = decodeScreenShareRequest(payload, topic);
      if (!request || !participant) return;
      const identity = participant.identity;
      const name = request.name || participant.name || identity;

      toast(i18n.t("live:share.requestNotifyTitle", { name }), {
        description: i18n.t("live:share.requestNotifyDescription"),
        duration: 12_000,
        action: {
          label: i18n.t("live:share.grantAction"),
          onClick: () => grantShare(identity),
        },
      });
    }

    room.on(RoomEvent.DataReceived, receive);
    return () => {
      room.off(RoomEvent.DataReceived, receive);
    };
  }, [enabled, grantShare, room]);

  return null;
}

export interface LiveRoomProps {
  lesson: Lesson;
  isTeacher: boolean;
  screenStream: MediaStream | null;
  onLeave: () => void;
}

export function LiveRoom({ lesson, isTeacher, screenStream, onLeave }: LiveRoomProps) {
  const { t } = useTranslation("live");
  const connectionLabels = useConnectionLabels();
  const audioRecordingLabels = useAudioRecordingLabels();
  const videoRecordingLabels = useVideoRecordingLabels();
  const [panel, setPanel] = useState<SidePanel>(() =>
    window.matchMedia("(max-width: 1023px)").matches ? null : "people"
  );
  const [inviteOpen, setInviteOpen] = useState(false);
  const [finishOpen, setFinishOpen] = useState(false);
  const connectionState = useConnectionState();
  const participants = useParticipants();
  const room = useRoomContext();
  const attention = useAttentionCheck(lesson.id, !isTeacher);
  const mic = useMicSignals(lesson.id, isTeacher);
  const camera = useCameraSignals(lesson.id, isTeacher);
  useFocusTracker(lesson.id, !isTeacher);

  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false }
  );
  const audioTrackReferences = useTracks(
    [Track.Source.Microphone, Track.Source.ScreenShareAudio],
    { onlySubscribed: false }
  );
  const audioMediaTracks = useMemo(
    () =>
      audioTrackReferences.flatMap((trackReference) => {
        const mediaTrack = trackReference.publication.track?.mediaStreamTrack;
        return mediaTrack ? [mediaTrack] : [];
      }),
    [audioTrackReferences]
  );
  const screenTracks = tracks.filter((track) => track.source === Track.Source.ScreenShare);
  const cameraTracks = tracks.filter((track) => track.source === Track.Source.Camera);
  const activeShare = screenTracks[0] ?? null;
  const pendingRequestsCount = mic.requests.length + camera.requests.length;

  const audioRecording = useTeacherAudioRecording(lesson.id, audioMediaTracks, isTeacher);
  const screenVideoOnlyStream = useMemo(() => {
    const videoTrack = screenStream?.getVideoTracks()[0];
    return videoTrack ? new MediaStream([videoTrack]) : null;
  }, [screenStream]);
  const videoRecording = useTeacherVideoRecording(lesson.id, screenVideoOnlyStream, isTeacher);

  const boardOpen = panel === "board";
  const peopleOpen = panel === "people";
  const [moreOpen, setMoreOpen] = useState(false);
  const [permissionOpen, setPermissionOpen] = useState(false);
  const [joinedAt] = useState(() => new Date());
  const joinedLabel = `${String(joinedAt.getHours()).padStart(2, "0")}:${String(
    joinedAt.getMinutes()
  ).padStart(2, "0")}`;
  const connected = connectionState === ConnectionState.Connected;

  const recordingChips = isTeacher
    ? [
        audioRecording.phase === "recording"
          ? { id: "audio", label: audioRecordingLabels.recording }
          : null,
        screenStream && videoRecording.phase === "recording"
          ? { id: "video", label: videoRecordingLabels.recording }
          : null,
      ].filter(Boolean)
    : [];

  return (
    <div
      data-theme="dark"
      data-lk-theme="default"
      className="live-room-shell dark relative flex h-dvh min-h-0 flex-col overflow-hidden bg-canvas text-ink"
    >
      <header className="flex shrink-0 flex-col gap-2.5 px-4 pt-3 pb-2.5 lg:px-5 lg:pt-4 lg:pb-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="grid size-9 shrink-0 place-items-center rounded-full text-ink-secondary transition-colors hover:bg-subtle hover:text-ink"
            aria-label={t("room.leaveAria")}
            onClick={onLeave}
          >
            <ArrowLeft size={20} />
          </button>

          <div className="flex min-w-0 flex-1 flex-col">
            <strong className="flex min-w-0 items-center gap-2 font-heading text-title text-ink">
              <span
                className={`size-2 shrink-0 rounded-full ${
                  connected ? "bg-success" : "bg-saffron-strong"
                }`}
                aria-hidden="true"
              />
              <span className="truncate">{lesson.title}</span>
            </strong>
            <small className="truncate text-caption text-ink-tertiary">
              {lesson.courseTitle} · {connectionLabels[connectionState] ?? connectionState}
              {connected ? ` · ${joinedLabel}` : ""}
            </small>
          </div>

          <span className="flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-subtle px-3 text-label-strong text-ink">
            <Users size={15} /> {participants.length}
          </span>

          {isTeacher ? (
            <button
              type="button"
              className="grid size-9 shrink-0 place-items-center rounded-full bg-subtle text-ink transition-colors hover:bg-muted"
              onClick={() => setInviteOpen(true)}
              aria-label={t("room.inviteAria")}
              title={t("room.inviteAria")}
            >
              <UserRoundPlus size={18} />
            </button>
          ) : null}
        </div>

        {recordingChips.length ? (
          <div className="flex flex-wrap items-center gap-2">
            {recordingChips.map((chip) => (
              <span
                key={chip!.id}
                className="flex h-7 items-center gap-2 rounded-full bg-subtle px-3 text-caption-strong text-ink-secondary"
                role="status"
              >
                <i className="size-1.5 shrink-0 rounded-full bg-error-text" aria-hidden="true" />
                {chip!.label}
              </span>
            ))}
          </div>
        ) : null}
      </header>

      {boardOpen || peopleOpen ? (
        <div className="flex shrink-0 items-center gap-1 px-4 pb-2 lg:hidden">
          {(["video", "board", "people"] as const).map((item) => {
            const active =
              item === "video" ? !boardOpen && !peopleOpen : item === "board" ? boardOpen : peopleOpen;
            return (
              <button
                key={item}
                type="button"
                className={`h-9 rounded-full px-3.5 text-label-strong transition-colors ${
                  active ? "bg-subtle text-ink" : "text-ink-tertiary"
                }`}
                onClick={() => setPanel(item === "video" ? null : item)}
              >
                {t(`room.switch.${item}`)}
              </button>
            );
          })}
        </div>
      ) : null}

      <ReconnectBanner />

      <div className="flex min-h-0 flex-1 gap-4 px-4 pb-24 lg:px-5">
        <main className="flex min-w-0 flex-1 flex-col">
          {boardOpen ? (
            <BoardPanel
              lessonId={lesson.id}
              courseId={lesson.courseId}
              currentUserId={room.localParticipant.identity}
            />
          ) : activeShare ? (
            <div className="flex min-h-0 flex-1 gap-3">
              <div className="min-w-0 flex-1 overflow-hidden rounded-2xl bg-subtle">
                <ParticipantTile trackRef={activeShare} />
              </div>
              <div
                className="flex w-[180px] shrink-0 flex-col gap-3 overflow-y-auto"
                aria-label={t("room.filmstripAria")}
              >
                {cameraTracks.map((track) => (
                  <CameraTile
                    key={`${track.participant.identity}-${track.source}`}
                    track={track}
                    compact
                  />
                ))}
              </div>
            </div>
          ) : cameraTracks.length ? (
            <div className="grid min-h-0 flex-1 auto-rows-min grid-cols-2 content-start gap-4 overflow-y-auto lg:grid-cols-3">
              {cameraTracks.map((track) => (
                <CameraTile key={`${track.participant.identity}-${track.source}`} track={track} />
              ))}
            </div>
          ) : (
            <div className="m-auto flex flex-col items-center gap-3 text-ink-tertiary">
              <Video size={30} />
              <p className="text-body-sm">{t("room.empty")}</p>
            </div>
          )}
        </main>

        {boardOpen ? (
          <div
            className="hidden w-[180px] shrink-0 flex-col gap-3 overflow-y-auto lg:flex"
            aria-label={t("room.filmstripAria")}
          >
            {cameraTracks.map((track) => (
              <CameraTile
                key={`${track.participant.identity}-${track.source}`}
                track={track}
                compact
              />
            ))}
          </div>
        ) : peopleOpen ? (
          <aside
            className="hidden w-[340px] shrink-0 flex-col gap-3 self-start rounded-2xl bg-surface p-4 lg:flex"
            aria-label={t("room.sidePanelAria")}
          >
            <div className="flex items-center justify-between gap-2">
              <strong className="font-heading text-h3 text-ink">
                {t("room.participantsCount", { count: participants.length })}
              </strong>
              <button
                type="button"
                className="grid size-8 shrink-0 place-items-center rounded-full text-ink-tertiary transition-colors hover:bg-subtle hover:text-ink"
                onClick={() => setPanel(null)}
                aria-label={t("room.closePanelAria")}
              >
                <X size={17} />
              </button>
            </div>

            <ParticipantsPanel
              lessonId={lesson.id}
              isTeacher={isTeacher}
              micRequests={mic.requests}
              onGrantMic={mic.grant.mutate}
              onDenyMic={mic.deny.mutate}
              micAnswerPending={mic.grant.isPending || mic.deny.isPending}
              cameraRequests={camera.requests}
              onGrantCamera={camera.grant.mutate}
              onDenyCamera={camera.deny.mutate}
              cameraAnswerPending={camera.grant.isPending || camera.deny.isPending}
              onInvite={() => setInviteOpen(true)}
            />
          </aside>
        ) : null}
      </div>

      <footer className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex justify-center px-4 pb-5">
        <div className="pointer-events-auto flex items-center gap-3">
          {isTeacher ? (
            <TeacherMicControl />
          ) : (
            <StudentMicControl
              onRequest={mic.requestMic}
              requesting={mic.requesting}
              waiting={mic.waiting}
            />
          )}
          {isTeacher ? (
            <TeacherCameraControl />
          ) : (
            <StudentCameraControl
              onRequest={camera.requestCamera}
              requesting={camera.requesting}
              waiting={camera.waiting}
            />
          )}
          {isTeacher ? (
            screenStream && <TeacherShareControl screenStream={screenStream} />
          ) : (
            <StudentShareControl />
          )}

          <button
            type="button"
            className={`live-control ${boardOpen ? "is-active" : ""}`}
            onClick={() => setPanel(boardOpen ? null : "board")}
            aria-label={t("room.openBoardAria")}
            aria-pressed={boardOpen}
          >
            <LayoutDashboard size={19} />
          </button>

          <div className="relative">
            <button
              type="button"
              className={`live-control ${moreOpen ? "is-active" : ""}`}
              onClick={() => setMoreOpen((current) => !current)}
              aria-label={t("room.moreAria")}
              aria-expanded={moreOpen}
            >
              <MoreHorizontal size={19} />
              {pendingRequestsCount ? (
                <span className="live-control-badge">{pendingRequestsCount}</span>
              ) : null}
            </button>

            {moreOpen ? (
              <div className="absolute bottom-[calc(100%+10px)] right-0 z-30 flex w-[230px] flex-col gap-1 rounded-2xl bg-surface p-2 shadow-xl">
                <button
                  type="button"
                  className="flex h-11 items-center gap-2.5 rounded-xl px-3 text-left text-label-strong text-ink transition-colors hover:bg-subtle"
                  onClick={() => {
                    setMoreOpen(false);
                    setPanel(peopleOpen ? null : "people");
                  }}
                >
                  <Users size={17} />
                  {t("room.participants")}
                  {pendingRequestsCount ? (
                    <b className="ml-auto grid size-6 place-items-center rounded-full bg-action text-caption-strong text-on-action">
                      {pendingRequestsCount}
                    </b>
                  ) : null}
                </button>
                {isTeacher ? (
                  <button
                    type="button"
                    className="flex h-11 items-center gap-2.5 rounded-xl px-3 text-left text-label-strong text-error-text transition-colors hover:bg-error-bg"
                    onClick={() => {
                      setMoreOpen(false);
                      setFinishOpen(true);
                    }}
                  >
                    <CircleStop size={17} /> {t("room.finish")}
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>

          <DisconnectButton className="live-control live-control--leave">
            <PhoneOff size={19} />
          </DisconnectButton>
        </div>
      </footer>

      <AwayStudentsNotice lessonId={lesson.id} enabled={isTeacher} />

      {isTeacher ? (
        <LessonInviteDialog
          lessonId={lesson.id}
          courseId={lesson.courseId}
          open={inviteOpen}
          onOpenChange={setInviteOpen}
        />
      ) : null}

      {isTeacher ? (
        <FinishLessonDialog
          lesson={finishOpen ? lesson : null}
          onOpenChange={(open) => setFinishOpen(open)}
          onFinished={onLeave}
          onLeaveOnly={onLeave}
        />
      ) : null}

      <Drawer
        open={peopleOpen}
        onOpenChange={(open) => (open ? setPanel("people") : setPanel(null))}
      >
        <DrawerContent className="max-h-[80dvh] px-4 pb-6 lg:hidden">
          <DrawerTitle className="px-1 pt-2 pb-3 font-heading text-h3 text-ink">
            {t("room.participantsCount", { count: participants.length })}
          </DrawerTitle>
          <ParticipantsPanel
            lessonId={lesson.id}
            isTeacher={isTeacher}
            micRequests={mic.requests}
            onGrantMic={mic.grant.mutate}
            onDenyMic={mic.deny.mutate}
            micAnswerPending={mic.grant.isPending || mic.deny.isPending}
            cameraRequests={camera.requests}
            onGrantCamera={camera.grant.mutate}
            onDenyCamera={camera.deny.mutate}
            cameraAnswerPending={camera.grant.isPending || camera.deny.isPending}
            onInvite={() => {
              setPanel(null);
              setInviteOpen(true);
            }}
          />
        </DrawerContent>
      </Drawer>

      <MediaPermissionDialog open={permissionOpen} onOpenChange={setPermissionOpen} />
      <MediaPermissionWatcher onDenied={() => setPermissionOpen(true)} />
      <RoomAudioRenderer />
      <ShareRequestListener lessonId={lesson.id} enabled={isTeacher} />
      {!isTeacher ? <AttentionCheckDialog lessonId={lesson.id} check={attention.data} /> : null}
    </div>
  );
}

interface ParticipantsPanelProps {
  lessonId: string;
  isTeacher: boolean;
  micRequests: MicRequest[];
  onGrantMic: (studentId: string) => void;
  onDenyMic: (studentId: string) => void;
  micAnswerPending: boolean;
  cameraRequests: CameraRequest[];
  onGrantCamera: (studentId: string) => void;
  onDenyCamera: (studentId: string) => void;
  cameraAnswerPending: boolean;
  onInvite: () => void;
}

function RequestRow({
  name,
  index,
  note,
  pending,
  onGrant,
  onDeny,
}: {
  name: string;
  index: number;
  note: string;
  pending: boolean;
  onGrant: () => void;
  onDeny: () => void;
}) {
  const { t } = useTranslation("live");

  return (
    <article className="flex items-center gap-2.5 rounded-xl bg-subtle p-2.5">
      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-action text-caption-strong text-on-action">
        {index + 1}
      </span>
      <Avatar name={name} size="sm" />
      <span className="flex min-w-0 flex-1 flex-col">
        <strong className="truncate text-label-strong text-ink">{name}</strong>
        <small className="truncate text-caption text-ink-tertiary">{note}</small>
      </span>
      <Button size="sm" disabled={pending} onClick={onGrant}>
        {t("participantsPanel.grant")}
      </Button>
      <button
        type="button"
        className="grid size-8 shrink-0 place-items-center rounded-full text-error-text transition-colors hover:bg-error-bg"
        aria-label={t("participantsPanel.denyAria", { name })}
        title={t("participantsPanel.denyTitle")}
        disabled={pending}
        onClick={onDeny}
      >
        <X size={16} />
      </button>
    </article>
  );
}

function ParticipantsPanel({
  lessonId,
  isTeacher,
  micRequests,
  onGrantMic,
  onDenyMic,
  micAnswerPending,
  cameraRequests,
  onGrantCamera,
  onDenyCamera,
  cameraAnswerPending,
  onInvite,
}: ParticipantsPanelProps) {
  const { t } = useTranslation("live");
  const participants = useParticipants();
  const allowShare = useAllowShare(lessonId);
  const ban = useBanFromLesson(lessonId);
  const raisedHands = new Set([
    ...micRequests.map((request) => request.name),
    ...cameraRequests.map((request) => request.name),
  ]);

  return (
    <div className="flex min-h-0 flex-col gap-3">
      {micRequests.length ? (
        <section
          className="flex flex-col gap-2"
          aria-label={t("participantsPanel.micRequestsAria")}
        >
          <h4 className="flex items-center gap-1.5 px-1 text-caption-strong tracking-wide text-ink-tertiary uppercase">
            <Hand size={13} /> {t("participantsPanel.wantsToSpeak", { count: micRequests.length })}
          </h4>
          {micRequests.map((request, index) => (
            <RequestRow
              key={request.studentId}
              name={request.name}
              index={index}
              note={t("participantsPanel.micRequesting")}
              pending={micAnswerPending}
              onGrant={() => onGrantMic(request.studentId)}
              onDeny={() => onDenyMic(request.studentId)}
            />
          ))}
        </section>
      ) : null}

      {cameraRequests.length ? (
        <section
          className="flex flex-col gap-2"
          aria-label={t("participantsPanel.cameraRequestsAria")}
        >
          <h4 className="flex items-center gap-1.5 px-1 text-caption-strong tracking-wide text-ink-tertiary uppercase">
            <Video size={13} />{" "}
            {t("participantsPanel.wantsCamera", { count: cameraRequests.length })}
          </h4>
          {cameraRequests.map((request, index) => (
            <RequestRow
              key={request.studentId}
              name={request.name}
              index={index}
              note={t("participantsPanel.cameraRequesting")}
              pending={cameraAnswerPending}
              onGrant={() => onGrantCamera(request.studentId)}
              onDeny={() => onDenyCamera(request.studentId)}
            />
          ))}
        </section>
      ) : null}

      <div className="-mr-1 flex min-h-0 flex-col gap-0.5 overflow-y-auto pr-1">
        {participants.map((participant) => {
          const name = participant.name || participant.identity;
          const speaking = participant.isSpeaking;
          const micOn = participant.isMicrophoneEnabled;
          const cameraOn = participant.isCameraEnabled;
          const raisedHand = raisedHands.has(name);
          const note = participant.isLocal
            ? isTeacher
              ? t("participantsPanel.teacherYou")
              : t("participantsPanel.you")
            : speaking
              ? t("participantsPanel.speaking")
              : raisedHand
                ? t("participantsPanel.raisedHand")
                : t("participantsPanel.participant");

          return (
            <article
              key={participant.identity}
              className="group flex items-center gap-2.5 rounded-xl px-1 py-2 transition-colors hover:bg-subtle"
            >
              <Avatar name={name} size="sm" />
              <span className="flex min-w-0 flex-1 flex-col">
                <strong className="truncate text-label-strong text-ink">{name}</strong>
                <small
                  className={`truncate text-caption ${
                    speaking ? "text-success-text" : "text-ink-tertiary"
                  }`}
                >
                  {note}
                </small>
              </span>

              {raisedHand ? (
                <Hand size={16} className="shrink-0 text-saffron-strong" aria-hidden="true" />
              ) : null}
              {micOn ? (
                <Mic size={16} className="shrink-0 text-ink-secondary" aria-hidden="true" />
              ) : (
                <MicOff size={16} className="shrink-0 text-error-text" aria-hidden="true" />
              )}
              {cameraOn ? (
                <Video size={16} className="shrink-0 text-ink-secondary" aria-hidden="true" />
              ) : (
                <VideoOff size={16} className="shrink-0 text-error-text" aria-hidden="true" />
              )}

              {isTeacher && !participant.isLocal ? (
                <span className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                  <button
                    type="button"
                    className="grid size-8 place-items-center rounded-full text-ink-secondary transition-colors hover:bg-muted hover:text-ink disabled:opacity-50"
                    disabled={allowShare.isPending}
                    aria-label={t("participantsPanel.allowShare")}
                    title={t("participantsPanel.allowShare")}
                    onClick={() => allowShare.mutate(participant.identity)}
                  >
                    <MonitorUp size={15} />
                  </button>
                  <button
                    type="button"
                    className="grid size-8 place-items-center rounded-full text-error-text transition-colors hover:bg-error-bg disabled:opacity-50"
                    aria-label={t("participantsPanel.banAria", { name })}
                    title={t("participantsPanel.banTitle")}
                    disabled={ban.isPending}
                    onClick={() => ban.mutate(participant.identity)}
                  >
                    <UserRoundX size={15} />
                  </button>
                </span>
              ) : null}
            </article>
          );
        })}
        {!participants.length ? (
          <p className="px-1 py-3 text-body-sm text-ink-tertiary">
            {t("participantsPanel.empty")}
          </p>
        ) : null}
      </div>

      {isTeacher ? (
        <div className="flex items-center gap-2 border-t border-line pt-3">
          <button
            type="button"
            className="h-11 flex-1 rounded-full border border-line text-label-strong text-ink transition-colors hover:bg-subtle"
            onClick={() => toast.info(t("participantsPanel.muteAllUnavailable"))}
          >
            {t("participantsPanel.muteAll")}
          </button>
          <button
            type="button"
            className="h-11 flex-1 rounded-full bg-action text-label-strong text-on-action transition-colors hover:bg-action-hover"
            onClick={onInvite}
          >
            {t("participantsPanel.invite")}
          </button>
        </div>
      ) : null}
    </div>
  );
}
