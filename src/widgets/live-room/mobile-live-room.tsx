import type { ReactNode } from "react";
import {
  isTrackReference,
  useLocalParticipantPermissions,
  useTrackToggle,
  VideoTrack,
  type TrackReferenceOrPlaceholder,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import { Hand, MicOff, VideoOff } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { BoardPanel, BoardPreview } from "@/modules/board";
import {
  CAMERA_SOURCE,
  canPublishSource,
  MICROPHONE_SOURCE,
  SCREEN_SHARE_SOURCE,
} from "@/modules/live";
import type { Lesson } from "@/shared/types";
import { Icon } from "@/shared/ui/icon";
import { Avatar } from "@/shared/ui/legacy";
import { formatElapsed, useElapsedSeconds } from "./use-elapsed-seconds";
import { useScreenShareRequest } from "./use-screen-share-request";

const MAX_TILES = 6;

export interface MobileTile {
  id: string;
  name: string;
  isLocal: boolean;
  speaking: boolean;
  micOn: boolean;
  media: ReactNode | null;
}

export interface MobileLiveLayoutProps {
  startedAt: Date;
  recording: boolean;
  participants: number;
  requests: number;
  stage: ReactNode;
  tiles: MobileTile[];
  overflow: number;
  toolbar: ReactNode;
  onBack: () => void;
  onPeople: () => void;
}

function firstName(value: string): string {
  return value.trim().split(/\s+/)[0] ?? value;
}

function Elapsed({ startedAt }: { startedAt: Date }) {
  return (
    <strong className="text-title font-semibold tabular-nums">
      {formatElapsed(useElapsedSeconds(startedAt))}
    </strong>
  );
}

export function MobileLiveLayout({
  startedAt,
  recording,
  participants,
  requests,
  stage,
  tiles,
  overflow,
  toolbar,
  onBack,
  onPeople,
}: MobileLiveLayoutProps) {
  const { t } = useTranslation("live");

  return (
    <div className="flex h-dvh min-h-0 flex-col overflow-hidden bg-canvas pt-5 font-body text-ink">
      <header className="flex h-11 shrink-0 items-center gap-3 px-4">
        <button
          type="button"
          className="grid size-11 shrink-0 place-items-center rounded-full bg-surface-inverse text-ink-inverse"
          aria-label={t("room.leaveAria")}
          onClick={onBack}
        >
          <Icon name="chevron-left" size={22} />
        </button>
        <span className="flex min-w-0 flex-1 items-center justify-center gap-2.5">
          {recording ? (
            <span className="flex h-6 shrink-0 items-center gap-1 rounded-full bg-danger/70 px-2 text-caption-strong text-on-action">
              <i className="size-1.5 shrink-0 rounded-full bg-on-action not-italic" aria-hidden="true" />
              {t("room.rec")}
            </span>
          ) : null}
          <Elapsed startedAt={startedAt} />
        </span>
        <button
          type="button"
          className="relative flex h-9 w-13 shrink-0 items-center justify-center gap-1.5 rounded-full bg-subtle text-title-sm font-semibold"
          aria-label={t("room.participants")}
          onClick={onPeople}
        >
          <Icon name="person" size={16} />
          {participants}
          {requests ? (
            <i className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full bg-danger ring-2 ring-canvas not-italic" />
          ) : null}
        </button>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pt-4 pb-4">
        <div data-theme="light" className="h-75.5 shrink-0 overflow-hidden rounded-2xl bg-surface text-ink">
          {stage}
        </div>

        <div className="grid grid-cols-3 gap-x-2 gap-y-1.5">
          {tiles.map((tile) => (
            <article
              key={tile.id}
              className="relative isolate aspect-[114/86] overflow-hidden rounded-xl bg-subtle"
            >
              {tile.media ?? (
                <span className="absolute inset-0 grid place-items-center pb-3">
                  <Avatar name={tile.name} size="sm" className="[&_.avatar]:size-10" />
                </span>
              )}
              {tile.speaking ? (
                <span className="pointer-events-none absolute inset-0 rounded-xl border-[3px] border-success" />
              ) : null}
              <span className="absolute bottom-1.5 left-1.5 flex h-5.5 max-w-[calc(100%-12px)] items-center gap-1 rounded-full bg-canvas/70 pr-2 pl-1.5 text-caption-strong backdrop-blur-sm">
                <Icon
                  name="mic"
                  size={12}
                  className={`shrink-0 ${tile.micOn ? "text-ink" : "text-error-text"}`}
                />
                <span className="truncate">{tile.isLocal ? t("room.youLabel") : firstName(tile.name)}</span>
              </span>
            </article>
          ))}
          {overflow ? (
            <span className="grid aspect-[114/86] place-items-center rounded-xl bg-subtle text-title font-semibold">
              +{overflow}
            </span>
          ) : null}
        </div>
      </div>

      <nav className="flex shrink-0 justify-between rounded-t-2xl bg-subtle/40 px-3 pt-0.5 pb-6.5 min-[380px]:px-4">
        {toolbar}
      </nav>
    </div>
  );
}

export interface ToolbarButtonProps {
  icon: ReactNode;
  label: string;
  tone?: "default" | "off" | "danger" | "active";
  disabled?: boolean;
  pressed?: boolean;
  badge?: number;
  onClick?: () => void;
}

const TOOLBAR_TONES = {
  default: "bg-subtle text-ink",
  off: "bg-danger-bg text-error-text",
  danger: "bg-danger/85 text-on-action",
  active: "bg-brand text-on-action",
} as const;

export function ToolbarButton({
  icon,
  label,
  tone = "default",
  disabled = false,
  pressed,
  badge,
  onClick,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      className="flex w-12 flex-col items-center gap-1 disabled:opacity-50 min-[380px]:w-13"
      aria-pressed={pressed}
      disabled={disabled}
      onClick={onClick}
    >
      <span className={`relative grid size-12 place-items-center rounded-full min-[380px]:size-13 ${TOOLBAR_TONES[tone]}`}>
        {icon}
        {badge ? (
          <span className="absolute -top-0.5 -right-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-danger px-1 text-micro font-semibold text-on-action">
            {badge}
          </span>
        ) : null}
      </span>
      <small className="-mx-2 text-[11px] leading-4 whitespace-nowrap text-ink">{label}</small>
    </button>
  );
}

interface RequestSignal {
  requestMic?: () => void;
  requestCamera?: () => void;
  cancelMic?: () => void;
  cancelCamera?: () => void;
  requesting: boolean;
  cancelling?: boolean;
  waiting: boolean;
}

function MicButton({ isTeacher, request }: { isTeacher: boolean; request: RequestSignal }) {
  const { t } = useTranslation("live");
  const permissions = useLocalParticipantPermissions();
  const { enabled, pending, toggle } = useTrackToggle({ source: Track.Source.Microphone });
  const label = t("mic.label");
  const allowed = canPublishSource(permissions, MICROPHONE_SOURCE);

  if (allowed || isTeacher)
    return (
      <ToolbarButton
        icon={enabled ? <Icon name="mic" size={22} /> : <MicOff size={22} />}
        label={label}
        tone={enabled ? "default" : "off"}
        pressed={enabled}
        disabled={pending}
        onClick={() => (allowed ? void toggle() : toast.error(t("mic.disabledTitle")))}
      />
    );

  return (
    <ToolbarButton
      icon={<Hand size={22} />}
      label={request.waiting ? t("room.cancelRequest") : label}
      tone={request.waiting ? "active" : "default"}
      disabled={request.requesting || Boolean(request.cancelling)}
      onClick={request.waiting ? request.cancelMic : request.requestMic}
    />
  );
}

function CameraButton({ isTeacher, request }: { isTeacher: boolean; request: RequestSignal }) {
  const { t } = useTranslation("live");
  const permissions = useLocalParticipantPermissions();
  const { enabled, pending, toggle } = useTrackToggle({ source: Track.Source.Camera });
  const label = t("camera.label");
  const allowed = canPublishSource(permissions, CAMERA_SOURCE);

  if (allowed || isTeacher)
    return (
      <ToolbarButton
        icon={enabled ? <Icon name="videocam-fill" size={22} /> : <VideoOff size={22} />}
        label={label}
        tone={enabled ? "default" : "off"}
        pressed={enabled}
        disabled={pending}
        onClick={() => (allowed ? void toggle() : toast.error(t("camera.disabledTitle")))}
      />
    );

  return (
    <ToolbarButton
      icon={<Hand size={22} />}
      label={request.waiting ? t("room.cancelRequest") : label}
      tone={request.waiting ? "active" : "default"}
      disabled={request.requesting || Boolean(request.cancelling)}
      onClick={request.waiting ? request.cancelCamera : request.requestCamera}
    />
  );
}

function ShareButton() {
  const { t } = useTranslation("live");
  const permissions = useLocalParticipantPermissions();
  const share = useScreenShareRequest();
  const { enabled, pending, toggle } = useTrackToggle({
    source: Track.Source.ScreenShare,
    captureOptions: { audio: true },
    onDeviceError: () => toast.error(t("share.failedToast")),
  });
  const label = t("room.mobileShare");

  if (canPublishSource(permissions, SCREEN_SHARE_SOURCE))
    return (
      <ToolbarButton
        icon={<Icon name="send" size={22} />}
        label={label}
        tone={enabled ? "active" : "default"}
        pressed={enabled}
        disabled={pending}
        onClick={() => {
          if (typeof navigator.mediaDevices?.getDisplayMedia !== "function") {
            toast.error(t("preJoin.screenShareUnsupported"));
            return;
          }
          void toggle();
        }}
      />
    );

  return (
    <ToolbarButton
      icon={<Icon name="send" size={22} />}
      label={label}
      disabled={share.requesting}
      onClick={() => void share.request()}
    />
  );
}

export interface MobileLiveRoomProps {
  lesson: Lesson;
  isTeacher: boolean;
  currentUserId: string;
  startedAt: Date;
  recording: boolean;
  participants: number;
  requests: number;
  cameraTracks: TrackReferenceOrPlaceholder[];
  activeShare: TrackReferenceOrPlaceholder | null;
  boardOpen: boolean;
  mic: RequestSignal;
  camera: RequestSignal;
  onBack: () => void;
  onBoard: (open: boolean) => void;
  onPeople: () => void;
  onEnd: () => void;
}

export function MobileLiveRoom({
  lesson,
  isTeacher,
  currentUserId,
  startedAt,
  recording,
  participants,
  requests,
  cameraTracks,
  activeShare,
  boardOpen,
  mic,
  camera,
  onBack,
  onBoard,
  onPeople,
  onEnd,
}: MobileLiveRoomProps) {
  const { t } = useTranslation("live");
  const ordered = [
    ...cameraTracks.filter((track) => track.participant.isLocal),
    ...cameraTracks.filter((track) => !track.participant.isLocal),
  ];
  const visible = ordered.length > MAX_TILES ? ordered.slice(0, MAX_TILES - 1) : ordered;

  const tiles: MobileTile[] = visible.map((track) => {
    const publication = isTrackReference(track) ? track.publication : undefined;
    const cameraOn = Boolean(publication && !publication.isMuted && isTrackReference(track));
    return {
      id: `${track.participant.identity}-${track.source}`,
      name: track.participant.name || track.participant.identity,
      isLocal: track.participant.isLocal,
      speaking: track.participant.isSpeaking,
      micOn: track.participant.isMicrophoneEnabled,
      media:
        cameraOn && isTrackReference(track) ? (
          <VideoTrack trackRef={track} className="absolute inset-0 size-full object-cover" />
        ) : null,
    };
  });

  const stage =
    activeShare && isTrackReference(activeShare) ? (
      <VideoTrack trackRef={activeShare} className="size-full bg-subtle object-contain" />
    ) : (
      <BoardPreview lessonId={lesson.id} currentUserId={currentUserId} />
    );

  return (
    <>
      <MobileLiveLayout
        startedAt={startedAt}
        recording={recording}
        participants={participants}
        requests={requests}
        stage={stage}
        tiles={tiles}
        overflow={ordered.length - visible.length}
        onBack={onBack}
        onPeople={onPeople}
        toolbar={
          <>
            <MicButton isTeacher={isTeacher} request={mic} />
            <CameraButton isTeacher={isTeacher} request={camera} />
            <ShareButton />
            <ToolbarButton
              icon={<Icon name="edit" size={22} />}
              label={t("room.board")}
              tone={boardOpen ? "active" : "default"}
              pressed={boardOpen}
              onClick={() => onBoard(!boardOpen)}
            />
            <ToolbarButton
              icon={<Icon name="person" size={22} />}
              label={t("room.mobilePeople")}
              badge={isTeacher ? requests : undefined}
              onClick={onPeople}
            />
            <ToolbarButton
              icon={<Icon name="logout" size={22} />}
              label={isTeacher ? t("room.finish") : t("room.leave")}
              tone="danger"
              onClick={onEnd}
            />
          </>
        }
      />

      {boardOpen ? (
        <div data-theme="light" className="fixed inset-0 z-40 flex flex-col bg-subtle px-3 pt-5 pb-[26px] font-body text-ink">
          <BoardPanel
            lessonId={lesson.id}
            courseId={lesson.courseId}
            currentUserId={currentUserId}
            mobile={{
              subtitle: `${lesson.courseTitle} · ${t("room.liveLesson")}`,
              live: true,
              backLabel: t("room.backToVideo"),
              onBack: () => onBoard(false),
            }}
          />
        </div>
      ) : null}
    </>
  );
}
