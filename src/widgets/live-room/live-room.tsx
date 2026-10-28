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

// Ekran ulashish bitreyti: 15 kadr/s, ~1.5 Mbit/s gacha. Statik slaydlarda real bitreyt ancha past; bu faqat
// harakatli kontentda server trafigi (har tomoshabinga) cheksiz o'smasligi uchun yuqori chegara.
const SCREEN_SHARE_ENCODING = { maxBitrate: 1_500_000, maxFramerate: 15 } as const;
import {
  CircleStop,
  Hand,
  Info,
  LogOut,
  PencilLine,
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
import { useCourse } from "@/modules/course";
import { AppDialog } from "@/shared/ui/app-dialog";
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
  useMuteAll,
  type CameraRequest,
  type MicRequest,
} from "@/modules/live";
import type { Lesson } from "@/shared/types";
import { useIsCompact } from "@/shared/hooks/use-media-query";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { Icon } from "@/shared/ui/icon";
import { Avatar } from "@/shared/ui/legacy";
import { MobileLiveRoom } from "./mobile-live-room";
import { formatElapsed, useElapsedSeconds } from "./use-elapsed-seconds";
import { useScreenShareRequest } from "./use-screen-share-request";

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
  label,
}: {
  track: TrackReferenceOrPlaceholder;
  compact?: boolean;
  label?: string;
}) {
  const { t } = useTranslation("live");
  const publication = "publication" in track ? track.publication : undefined;
  const cameraOff = !publication || publication.isMuted;
  const name = track.participant.name || track.participant.identity;
  const speaking = track.participant.isSpeaking;

  return (
    <article
      className={`live-camera-tile relative isolate overflow-hidden rounded-lg bg-subtle ${
        compact ? "is-compact aspect-3/2" : "aspect-5/3"
      } ${cameraOff ? "is-camera-off" : ""} ${speaking ? "ring-2 ring-success" : ""}`}
    >
      <ParticipantTile trackRef={track} disableSpeakingIndicator={cameraOff} />
      {cameraOff ? (
        <div
          className="live-camera-placeholder absolute inset-0 grid place-items-center bg-subtle"
          aria-label={t("room.cameraOffAria", { name })}
        >
          <strong className="font-heading text-h1 text-ink">{firstName(name).slice(0, 1)}</strong>
        </div>
      ) : null}
      <span className="live-camera-name absolute bottom-2 left-2 z-10 flex max-w-[calc(100%-16px)] items-center rounded-sm bg-canvas/70 px-2 py-1 text-micro text-ink backdrop-blur-sm">
        <span className="truncate">
          {label ?? (track.participant.isLocal ? t("room.youLabel") : firstName(name))}
        </span>
      </span>
    </article>
  );
}

function RecordingChip({ startedAt }: { startedAt: Date }) {
  const { t } = useTranslation("live");
  const label = formatElapsed(useElapsedSeconds(startedAt));

  return (
    <span
      className="flex h-6 shrink-0 items-center gap-1.5 rounded-full bg-danger px-2.5 text-caption-strong text-ink"
      role="status"
    >
      <i className="size-1.5 shrink-0 rounded-full bg-ink not-italic" aria-hidden="true" />
      {t("room.rec")} {label}
    </span>
  );
}

function ReconnectBanner({ compact = false }: { compact?: boolean }) {
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

  if (compact)
    return (
      <p
        role="status"
        className="pointer-events-none absolute inset-x-4 top-[72px] z-30 flex min-h-15 items-center gap-3 rounded-xl bg-surface px-4 py-2.5 text-body-sm font-medium text-ink shadow-lg"
      >
        <Icon name="wifi" size={22} className="shrink-0" />
        {t("room.reconnectingMobile")}
      </p>
    );

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
      data-lk-enabled="false"
      aria-label={t("mic.disabledAria")}
      title={t("mic.disabledTitle")}
      onClick={() => toast.error(t("mic.disabledTitle"))}
    >
      <MicOff size={19} className="live-control-off" />
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
      data-lk-enabled="false"
      aria-label={t("camera.disabledAria")}
      title={t("camera.disabledTitle")}
      onClick={() => toast.error(t("camera.disabledTitle"))}
    >
      <VideoOff size={19} className="live-control-off" />
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
          await room.localParticipant.publishTrack(
            track,
            source === Track.Source.ScreenShare
              ? { source, screenShareEncoding: SCREEN_SHARE_ENCODING }
              : { source }
          );
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
  const permissions = useLocalParticipantPermissions();
  const { request: requestShare, requesting } = useScreenShareRequest();
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

interface ShareRequest {
  identity: string;
  name: string;
}

function ShareRequestListener({
  lessonId,
  enabled,
  onRequest,
}: {
  lessonId: string;
  enabled: boolean;
  onRequest?: (request: ShareRequest) => void;
}) {
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

      if (onRequest) {
        onRequest({ identity, name });
        return;
      }

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
  }, [enabled, grantShare, onRequest, room]);

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
  const [shareRequest, setShareRequest] = useState<ShareRequest | null>(null);
  const isCompact = useIsCompact();
  const allowShare = useAllowShare(lesson.id);
  const connectionState = useConnectionState();
  const participants = useParticipants();
  const room = useRoomContext();
  const attention = useAttentionCheck(lesson.id, !isTeacher);
  const mic = useMicSignals(lesson.id, isTeacher);
  const camera = useCameraSignals(lesson.id, isTeacher);
  useFocusTracker(lesson.id, !isTeacher);
  const course = useCourse(lesson.courseId || null);
  const teacherId = course.data?.teacherUser?.id ?? null;

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

  const localCamera =
    cameraTracks.find((track) => track.participant.isLocal) ?? cameraTracks[0] ?? null;
  const leadCamera = isTeacher
    ? localCamera
    : (cameraTracks.find((track) => track.participant.identity === teacherId) ?? localCamera);
  const remoteCameras = cameraTracks.filter((track) => track !== leadCamera);
  const raisedHand = !isTeacher && (mic.waiting || camera.waiting);
  const hostName = room.localParticipant.name ?? "";
  const studentCount = Math.max(participants.length - 1, 0);

  const boardOpen = panel === "board";
  const peopleOpen = panel === "people";
  const [moreOpen, setMoreOpen] = useState(false);
  const [permissionOpen, setPermissionOpen] = useState(false);
  const [joinedAt] = useState(() => new Date());
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

  const dialogs = (
    <>
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

      <AppDialog
        open={peopleOpen}
        onOpenChange={(open) => setPanel(open ? "people" : null)}
        variant="panel"
        width="lg:w-100"
        title={
          isCompact
            ? t("room.mobileParticipantsCount", { count: participants.length })
            : t("room.participantsCount", { count: participants.length })
        }
      >
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
      </AppDialog>

      <MediaPermissionDialog open={permissionOpen} onOpenChange={setPermissionOpen} />
      <MediaPermissionWatcher onDenied={() => setPermissionOpen(true)} />
      <RoomAudioRenderer />
      <ShareRequestListener
        lessonId={lesson.id}
        enabled={isTeacher}
        onRequest={isCompact ? setShareRequest : undefined}
      />
      <ConfirmDialog
        open={Boolean(shareRequest)}
        onOpenChange={(open) => {
          if (!open) setShareRequest(null);
        }}
        tone="brand"
        icon="laptop"
        title={t("share.requestNotifyTitle", { name: shareRequest?.name ?? "" })}
        description={t("share.requestNotifyDescription")}
        confirmLabel={t("share.grantAction")}
        cancelLabel={t("share.denyAction")}
        pending={allowShare.isPending}
        onConfirm={() => {
          if (!shareRequest) return;
          allowShare.mutate(shareRequest.identity, { onSettled: () => setShareRequest(null) });
        }}
      />
      {!isTeacher ? <AttentionCheckDialog lessonId={lesson.id} check={attention.data} /> : null}
    </>
  );

  if (isCompact)
    return (
      <div
        data-theme="dark"
        data-lk-theme="default"
        className="live-room-shell dark relative h-dvh min-h-0 overflow-hidden bg-canvas text-ink"
      >
        <ReconnectBanner compact />
        <MobileLiveRoom
          lesson={lesson}
          isTeacher={isTeacher}
          currentUserId={room.localParticipant.identity}
          startedAt={joinedAt}
          recording={recordingChips.length > 0}
          participants={participants.length}
          requests={pendingRequestsCount}
          cameraTracks={cameraTracks}
          activeShare={activeShare}
          boardOpen={boardOpen}
          mic={mic}
          camera={camera}
          onBack={onLeave}
          onBoard={(open) => setPanel(open ? "board" : null)}
          onPeople={() => setPanel("people")}
          onEnd={() => (isTeacher ? setFinishOpen(true) : void room.disconnect())}
        />
        {dialogs}
      </div>
    );

  return (
    <div
      data-theme="dark"
      data-lk-theme="default"
      className="live-room-shell dark relative flex h-dvh min-h-0 flex-col overflow-hidden bg-canvas text-ink"
    >
      <header className="flex h-19.5 shrink-0 items-center gap-3 px-6">
        <button
          type="button"
          className="grid size-9 shrink-0 place-items-center rounded-full text-ink transition-colors hover:bg-subtle"
          aria-label={t("room.leaveAria")}
          onClick={onLeave}
        >
          <Icon name="y-logo" size={26} />
        </button>

        <div className="flex min-w-0 flex-1 flex-col">
          <strong className="truncate font-heading text-title-lg text-ink">
            {lesson.courseTitle} — {lesson.title}
          </strong>
          <small className="truncate text-body-xs text-ink-tertiary">
            {isTeacher
              ? `${hostName ? `${hostName} · ` : ""}${t("room.studentsPresent", { count: studentCount })}`
              : `${course.data?.teacher ? `${course.data.teacher} · ` : ""}${t("room.peopleInLesson", { count: participants.length })}`}
            {connected ? "" : ` · ${connectionLabels[connectionState] ?? connectionState}`}
          </small>
        </div>

        {recordingChips.length ? <RecordingChip startedAt={joinedAt} /> : null}

        {!isTeacher && lesson.status === "live" ? (
          <>
            <RecordingChip startedAt={new Date(lesson.startsAt)} />
            <span className="flex h-6 shrink-0 items-center rounded-full bg-subtle px-3 text-caption text-ink-secondary" role="status">
              {t("room.recordingStudent")}
            </span>
          </>
        ) : null}

        {recordingChips.map((chip) => (
          <span
            key={chip!.id}
            className="flex h-6 shrink-0 items-center rounded-full bg-subtle px-3 text-caption text-ink-secondary"
            role="status"
          >
            {chip!.label}
          </span>
        ))}

        <span className="flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-subtle px-3 text-caption-strong text-ink lg:hidden">
          <Users size={15} /> {participants.length}
        </span>
      </header>

      <ReconnectBanner />

      <div className="flex min-h-0 flex-1 gap-4 px-6">
        <main className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-xl">
          {boardOpen ? (
            <BoardPanel
              lessonId={lesson.id}
              courseId={lesson.courseId}
              currentUserId={room.localParticipant.identity}
            />
          ) : activeShare ? (
            <div className="min-h-0 flex-1 overflow-hidden rounded-xl bg-subtle">
              <ParticipantTile trackRef={activeShare} />
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

        <aside
          className="hidden w-84 shrink-0 flex-col gap-2.5 overflow-y-auto lg:flex"
          aria-label={t("room.filmstripAria")}
        >
          {leadCamera ? (
            <CameraTile
              track={leadCamera}
              label={
                leadCamera.participant.isLocal
                  ? `${t("room.youLabel")}${isTeacher ? ` · ${t("room.teacherRole")}` : ""}`
                  : `${firstName(leadCamera.participant.name || leadCamera.participant.identity)} · ${t("room.teacherRole")}`
              }
            />
          ) : null}

          {remoteCameras.length ? (
            <div className="grid grid-cols-2 gap-2.5">
              {remoteCameras.map((track) => (
                <CameraTile
                  key={`${track.participant.identity}-${track.source}`}
                  track={track}
                  compact
                />
              ))}
            </div>
          ) : null}

          {raisedHand ? (
            <section className="flex flex-col gap-3 rounded-lg bg-surface p-3.5">
              <strong className="text-title-sm text-ink">{t("room.queueTitle", { count: 1 })}</strong>
              <span className="flex items-center gap-2.5">
                <Avatar name={room.localParticipant.name || t("room.youLabel")} size="xs" />
                <small className="min-w-0 flex-1 truncate text-body-xs text-ink">
                  {t("room.youLabel")} · ✋ {t("room.handRaised")}
                </small>
                <button
                  type="button"
                  className="flex h-8 shrink-0 items-center rounded-full bg-brand px-4 text-caption-strong text-on-action transition-colors hover:bg-brand-strong"
                  onClick={() => toast.info(t("room.soon"))}
                >
                  {t("room.cancelRequest")}
                </button>
              </span>
            </section>
          ) : null}

          {isTeacher && pendingRequestsCount ? (
            <section className="flex flex-col gap-3 rounded-lg bg-surface p-3.5">
              <strong className="text-title-sm text-ink">
                {t("room.wantsToSpeak", { count: pendingRequestsCount })}
              </strong>

              {mic.requests.slice(0, 2).map((request) => (
                <span key={request.studentId} className="flex items-center gap-2.5">
                  <Avatar name={request.name} size="xs" />
                  <small className="min-w-0 flex-1 truncate text-body-xs text-ink">
                    {request.name} · ✋
                  </small>
                  <button
                    type="button"
                    className="flex h-8 shrink-0 items-center rounded-full bg-brand px-4 text-caption-strong text-on-action transition-colors hover:bg-brand-strong disabled:opacity-50"
                    disabled={mic.grant.isPending || mic.deny.isPending}
                    onClick={() => mic.grant.mutate(request.studentId)}
                  >
                    {t("room.allow")}
                  </button>
                </span>
              ))}

              {camera.requests.slice(0, 2).map((request) => (
                <span key={request.studentId} className="flex items-center gap-2.5">
                  <Avatar name={request.name} size="xs" />
                  <small className="min-w-0 flex-1 truncate text-body-xs text-ink">
                    {request.name} · 📷
                  </small>
                  <button
                    type="button"
                    className="flex h-8 shrink-0 items-center rounded-full bg-brand px-4 text-caption-strong text-on-action transition-colors hover:bg-brand-strong disabled:opacity-50"
                    disabled={camera.grant.isPending || camera.deny.isPending}
                    onClick={() => camera.grant.mutate(request.studentId)}
                  >
                    {t("room.allow")}
                  </button>
                </span>
              ))}
            </section>
          ) : null}
        </aside>
      </div>

      <footer className="flex h-30.5 shrink-0 items-center justify-center px-6">
        <div className="flex items-center gap-3">
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
            <PencilLine size={19} />
          </button>

          <button
            type="button"
            className={`live-control ${peopleOpen ? "is-active" : ""}`}
            onClick={() => setPanel(peopleOpen ? null : "people")}
            aria-label={t("room.participants")}
            aria-pressed={peopleOpen}
          >
            <Users size={19} />
            {pendingRequestsCount ? (
              <span className="live-control-badge">{pendingRequestsCount}</span>
            ) : null}
          </button>

          {isTeacher ? (
            <button
              type="button"
              className="live-control"
              onClick={() => setInviteOpen(true)}
              aria-label={t("room.inviteAria")}
            >
              <UserRoundPlus size={19} />
            </button>
          ) : null}

          <div className="relative">
            <button
              type="button"
              className={`live-control ${moreOpen ? "is-active" : ""}`}
              onClick={() => setMoreOpen((current) => !current)}
              aria-label={t("room.moreAria")}
              aria-expanded={moreOpen}
            >
              <MoreHorizontal size={19} />
            </button>

            {moreOpen ? (
              <div className="absolute bottom-[calc(100%+10px)] right-0 z-30 flex w-[230px] flex-col gap-1 rounded-2xl bg-surface p-2 shadow-xl">
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

          {isTeacher ? (
            <button
              type="button"
              className="live-control live-control--leave"
              onClick={() => setFinishOpen(true)}
            >
              <LogOut size={19} />
              {t("room.finish")}
            </button>
          ) : (
            <DisconnectButton className="live-control live-control--leave">
              <PhoneOff size={19} />
              {t("room.leave")}
            </DisconnectButton>
          )}
        </div>
      </footer>

      {dialogs}
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
  note,
  pending,
  secondary = false,
  onGrant,
  onDeny,
}: {
  name: string;
  note: string;
  pending: boolean;
  secondary?: boolean;
  onGrant: () => void;
  onDeny: () => void;
}) {
  const { t } = useTranslation("live");

  return (
    <article className="flex items-center gap-3 rounded-lg bg-warning-bg px-3 py-2.5 max-lg:h-16 max-lg:rounded-xl max-lg:bg-accent-saffron-bg max-lg:py-0">
      <Avatar name={name} size="sm" className="max-lg:[&_.avatar]:size-9" />
      <span className="flex min-w-0 flex-1 flex-col">
        <strong className="truncate text-title-sm text-ink max-lg:text-title max-lg:font-semibold">{name}</strong>
        <small className="truncate text-body-xs text-warning-fg">{note}</small>
      </span>
      <button
        type="button"
        className="grid size-9 shrink-0 place-items-center rounded-full bg-surface text-ink transition-opacity hover:opacity-80 disabled:opacity-50 max-lg:size-11"
        aria-label={t("participantsPanel.denyAria", { name })}
        title={t("participantsPanel.denyTitle")}
        disabled={pending}
        onClick={onDeny}
      >
        <X size={16} />
      </button>
      <button
        type="button"
        className={`flex h-9 shrink-0 items-center rounded-full bg-brand px-4 text-button text-on-action transition-colors hover:bg-brand-strong disabled:opacity-50 max-lg:h-11 max-lg:px-3 max-lg:text-button-sm ${
          secondary ? "max-lg:bg-brand-subtle max-lg:text-brand" : ""
        }`}
        disabled={pending}
        onClick={onGrant}
      >
        {t("participantsPanel.grant")}
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
  const isCompact = useIsCompact();
  const participants = useParticipants();
  const allowShare = useAllowShare(lessonId);
  const ban = useBanFromLesson(lessonId);
  const muteAll = useMuteAll(lessonId);
  const raisedHands = new Set([
    ...micRequests.map((request) => request.name),
    ...cameraRequests.map((request) => request.name),
  ]);

  return (
    <div className="flex min-h-0 flex-col gap-2">
      {micRequests.map((request) => (
        <RequestRow
          key={`mic-${request.studentId}`}
          name={request.name}
          note={isCompact ? t("participantsPanel.mobileMicRequesting") : t("participantsPanel.micRequesting")}
          pending={micAnswerPending}
          onGrant={() => onGrantMic(request.studentId)}
          onDeny={() => onDenyMic(request.studentId)}
        />
      ))}

      {cameraRequests.map((request) => (
        <RequestRow
          key={`camera-${request.studentId}`}
          name={request.name}
          note={isCompact ? t("participantsPanel.mobileCameraRequesting") : t("participantsPanel.cameraRequesting")}
          secondary
          pending={cameraAnswerPending}
          onGrant={() => onGrantCamera(request.studentId)}
          onDeny={() => onDenyCamera(request.studentId)}
        />
      ))}

      <div className="-mr-1 flex min-h-0 flex-col overflow-y-auto pr-1">
        {participants.map((participant) => {
          const name = participant.name || participant.identity;
          const speaking = participant.isSpeaking;
          const micOn = participant.isMicrophoneEnabled;
          const raisedHand = raisedHands.has(name);
          const note = participant.isLocal && !isCompact
            ? isTeacher
              ? t("participantsPanel.teacherYou")
              : t("participantsPanel.you")
            : speaking
              ? t("participantsPanel.speaking")
              : raisedHand
                ? t("participantsPanel.raisedHand")
                : micOn
                  ? t("participantsPanel.online")
                  : t("participantsPanel.micOff");

          return (
            <article key={participant.identity} className="group flex items-center gap-3 py-2.5 max-lg:py-[7px]">
              <Avatar name={name} size="sm" className="max-lg:[&_.avatar]:size-9" />
              <span className="flex min-w-0 flex-1 flex-col">
                <strong className="truncate text-title-sm text-ink max-lg:text-title max-lg:font-semibold">
                  {participant.isLocal
                    ? isCompact
                      ? isTeacher
                        ? t("participantsPanel.teacherYouMobile")
                        : t("participantsPanel.studentYouMobile")
                      : `${t("room.youLabel")} · ${
                          isTeacher ? t("room.teacherRole") : t("participantsPanel.studentRole")
                        }`
                    : name}
                </strong>
                <small className="truncate text-body-xs text-ink-tertiary max-lg:text-ink-secondary">{note}</small>
              </span>

              {raisedHand ? (
                <Hand size={16} className="shrink-0 text-warning-fg" aria-hidden="true" />
              ) : null}

              {isTeacher && !participant.isLocal ? (
                <span className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                  <button
                    type="button"
                    className="grid size-8 place-items-center rounded-full text-ink-secondary transition-colors hover:bg-subtle hover:text-ink disabled:opacity-50"
                    disabled={allowShare.isPending}
                    aria-label={t("participantsPanel.allowShare")}
                    title={t("participantsPanel.allowShare")}
                    onClick={() => allowShare.mutate(participant.identity)}
                  >
                    <MonitorUp size={15} />
                  </button>
                  <button
                    type="button"
                    className="grid size-8 place-items-center rounded-full text-danger transition-colors hover:bg-danger-bg disabled:opacity-50"
                    aria-label={t("participantsPanel.banAria", { name })}
                    title={t("participantsPanel.banTitle")}
                    disabled={ban.isPending}
                    onClick={() => ban.mutate(participant.identity)}
                  >
                    <UserRoundX size={15} />
                  </button>
                </span>
              ) : null}

              {isCompact ? (
                <Icon
                  name="mic"
                  size={20}
                  className={`shrink-0 ${micOn ? "text-brand" : "text-icon-disabled"}`}
                />
              ) : micOn ? (
                <Mic size={17} className="shrink-0 text-brand" aria-hidden="true" />
              ) : (
                <MicOff size={17} className="shrink-0 text-icon-disabled" aria-hidden="true" />
              )}
            </article>
          );
        })}

        {!participants.length ? (
          <p className="py-3 text-body-sm text-ink-tertiary">{t("participantsPanel.empty")}</p>
        ) : null}
      </div>

      {isTeacher ? (
        <div className="flex items-center gap-2.5 pt-2">
          <button
            type="button"
            className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-subtle text-button text-ink transition-colors hover:bg-muted disabled:opacity-60 max-lg:h-12 max-lg:border max-lg:border-line-strong max-lg:bg-surface"
            disabled={muteAll.isPending}
            onClick={() =>
              muteAll.mutate([], {
                onSuccess: (count) => toast.success(t("participantsPanel.muteAllDone", { count })),
              })
            }
          >
            {isCompact ? <Icon name="notifications-off" size={18} /> : <MicOff size={17} />}
            {t("participantsPanel.muteAll")}
          </button>
          <button
            type="button"
            className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-brand-subtle text-button text-brand transition-opacity hover:opacity-85 max-lg:h-12"
            onClick={onInvite}
          >
            {isCompact ? <Icon name="person" size={18} /> : <UserRoundPlus size={17} />}
            {t("participantsPanel.invite")}
          </button>
        </div>
      ) : null}
    </div>
  );
}
