import "@livekit/components-styles";
import { useState, type ReactNode } from "react";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useConnectionState,
  useLocalParticipant,
  useParticipants,
} from "@livekit/components-react";
import { ConnectionState } from "livekit-client";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useIsCompact } from "@/shared/hooks/use-media-query";
import type { VoiceRoom, VoiceToken } from "@/shared/types";
import { Icon } from "@/shared/ui/icon";
import { Avatar } from "@/shared/ui/legacy";
import {
  useAnswerVoiceHand,
  useAnswerVoiceJoinRequest,
  useToggleVoiceHand,
  useVoiceHands,
  useVoiceJoinRequests,
} from "../model/voice.queries";

export interface VoiceRoomPanelProps {
  room: VoiceRoom;
  token: VoiceToken;
  courseTitle?: string;
  onLeave: () => void;
  onClose: () => void;
  closing?: boolean;
}

export function VoiceRoomPanel({ room, token, courseTitle, onLeave, onClose, closing }: VoiceRoomPanelProps) {
  const { t } = useTranslation("voice");
  const isCompact = useIsCompact();

  return (
    <LiveKitRoom
      token={token.token}
      serverUrl={token.serverUrl}
      connect
      audio
      video={false}
      data-theme="dark"
      className={`dark z-50 flex flex-col bg-canvas font-body text-ink ${isCompact ? "fixed inset-0" : "absolute inset-0"}`}
      onDisconnected={onLeave}
      onError={(error) => {
        toast.error(error.message || t("room.connectFailed"));
        onLeave();
      }}
    >
      <RoomAudioRenderer />
      <MobileVoiceRoomBody
        room={room}
        courseTitle={courseTitle}
        isModerator={token.isModerator}
        onLeave={onLeave}
        onClose={onClose}
        closing={closing}
      />
    </LiveKitRoom>
  );
}

export interface VoiceMember {
  id: string;
  name: string;
  isLocal: boolean;
  micOn: boolean;
  speaking: boolean;
  owner: boolean;
}

export interface MobileVoiceRoomViewProps {
  title: string;
  subtitle: string;
  members: VoiceMember[];
  connecting: boolean;
  requests?: ReactNode;
  micOn: boolean;
  isModerator: boolean;
  closing?: boolean;
  handRaised?: boolean;
  handPending?: boolean;
  onToggleHand?: () => void;
  onToggleMic: () => void;
  onLeave: () => void;
  onClose: () => void;
}

export function MobileVoiceRoomView({
  title,
  subtitle,
  members,
  connecting,
  requests,
  micOn,
  isModerator,
  closing,
  handRaised = false,
  handPending = false,
  onToggleHand,
  onToggleMic,
  onLeave,
  onClose,
}: MobileVoiceRoomViewProps) {
  const { t } = useTranslation("voice");

  return (
    <>
      <header className="mt-5 flex h-11 shrink-0 items-center gap-3 px-4 lg:px-7">
        <button
          type="button"
          className="grid size-11 shrink-0 place-items-center rounded-full bg-surface-inverse text-ink-inverse"
          aria-label={t("room.leave")}
          onClick={onLeave}
        >
          <Icon name="chevron-down" size={22} />
        </button>
        <div className="flex min-w-0 flex-1 flex-col items-center">
          <strong className="max-w-full truncate text-title font-semibold">{title}</strong>
          <small className="max-w-full truncate text-caption text-ink-secondary">{subtitle}</small>
        </div>
        <span
          className="grid size-11 shrink-0 place-items-center rounded-full bg-surface-inverse text-ink-inverse"
          aria-hidden="true"
        >
          <Icon name="person" size={22} />
        </span>
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pt-10 pb-5 lg:flex-none lg:px-7">
        {connecting ? (
          <p className="text-center text-body-sm text-ink-secondary">{t("room.connecting")}</p>
        ) : (
          <div className="flex flex-wrap justify-center gap-y-5">
            {members.map((member) => {
              const highlighted = member.speaking || member.owner;
              return (
                <span key={member.id} className="flex w-1/3 flex-col items-center">
                  <span
                    className={`grid size-20 place-items-center rounded-full ${highlighted ? "bg-success" : ""}`}
                  >
                    <Avatar
                      name={member.name}
                      size="xl"
                      className={highlighted ? "[&_.avatar]:size-[74px]" : "[&_.avatar]:size-20"}
                    />
                  </span>
                  <strong className="mt-2 max-w-full truncate px-1 text-title-sm font-semibold">
                    {member.isLocal ? t("room.you") : (member.name.trim().split(/\s+/)[0] ?? member.name)}
                  </strong>
                  <small
                    className={`mt-2 max-w-full truncate px-1 text-caption ${
                      highlighted ? "text-success" : "text-ink-secondary"
                    }`}
                  >
                    {member.owner
                      ? t("room.owner")
                      : member.speaking
                        ? t("room.speaking")
                        : member.micOn
                          ? t("room.micOn")
                          : t("room.micOff")}
                  </small>
                </span>
              );
            })}
          </div>
        )}

        {requests}

        {isModerator || connecting ? null : (
          <div className="mt-10 flex h-[60px] shrink-0 items-center gap-3 rounded-xl bg-subtle/40 px-3.5">
            <Avatar name={members.find((member) => member.isLocal)?.name ?? ""} size="sm" />
            <span className="flex min-w-0 flex-1 flex-col">
              <strong className="truncate text-title-sm font-semibold">{t("room.raiseTitle")}</strong>
              <small className="truncate text-caption text-ink-secondary">{t("room.raiseHint")}</small>
            </span>
            <button
              type="button"
              aria-pressed={handRaised}
              className={`flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-button disabled:opacity-60 ${
                handRaised ? "bg-surface-inverse text-ink-inverse" : "bg-brand text-on-action"
              }`}
              disabled={handPending || !onToggleHand}
              onClick={onToggleHand}
            >
              <span aria-hidden="true">✋</span>
              {handRaised ? t("room.lowerHand") : t("room.raiseHand")}
            </button>
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2.5 px-4 pb-8.5 lg:px-7">
        <button
          type="button"
          className={`grid size-13 shrink-0 place-items-center rounded-full transition-colors ${
            micOn ? "bg-subtle text-ink" : "bg-danger-bg text-error-text"
          }`}
          aria-pressed={micOn}
          aria-label={t("room.micLabel")}
          onClick={onToggleMic}
        >
          <Icon name="mic" size={22} />
        </button>
        <button
          type="button"
          className="flex h-13 min-w-0 flex-1 items-center justify-center rounded-full bg-surface-inverse text-title font-semibold text-ink-inverse"
          onClick={onLeave}
        >
          {t("room.leave")}
        </button>
        {isModerator ? (
          <span data-theme="light" className="flex min-w-0 flex-1">
            <button
              type="button"
              className="flex h-13 w-full items-center justify-center rounded-full bg-danger-bg text-title font-semibold text-error-text disabled:opacity-50"
              disabled={closing}
              onClick={onClose}
            >
              {t("room.mobileClose")}
            </button>
          </span>
        ) : null}
      </div>
    </>
  );
}

function MobileVoiceRoomBody({
  room,
  courseTitle,
  isModerator,
  onLeave,
  onClose,
  closing,
}: {
  room: VoiceRoom;
  courseTitle?: string;
  isModerator: boolean;
  onLeave: () => void;
  onClose: () => void;
  closing?: boolean;
}) {
  const { t } = useTranslation("voice");
  const participants = useParticipants();
  const connection = useConnectionState();
  const { localParticipant, isMicrophoneEnabled } = useLocalParticipant();
  const hostIdentity = room.hostIdentity ?? `user-${room.createdById}`;
  const hand = useToggleVoiceHand(room.id);
  const [handRaised, setHandRaised] = useState(false);

  function toggleHand() {
    const next = !handRaised;
    hand.mutate(next, {
      onSuccess: () => {
        setHandRaised(next);
        if (next) toast.success(t("room.handSent"));
      },
    });
  }

  return (
    <MobileVoiceRoomView
      title={room.title || t("room.defaultTitle")}
      subtitle={[courseTitle, t("room.participants", { count: participants.length })]
        .filter(Boolean)
        .join(" · ")}
      members={participants.map((participant) => ({
        id: participant.sid,
        name: participant.name || participant.identity,
        isLocal: participant.isLocal,
        micOn: participant.isMicrophoneEnabled,
        speaking: participant.isSpeaking,
        owner: participant.identity === hostIdentity,
      }))}
      connecting={connection !== ConnectionState.Connected}
      requests={
        isModerator ? (
          <>
            <MobileVoiceHands roomId={room.id} />
            <MobileVoiceJoinRequests roomId={room.id} />
          </>
        ) : null
      }
      micOn={isMicrophoneEnabled}
      isModerator={isModerator}
      closing={closing}
      handRaised={handRaised}
      handPending={hand.isPending}
      onToggleHand={toggleHand}
      onToggleMic={() => void localParticipant?.setMicrophoneEnabled(!isMicrophoneEnabled)}
      onLeave={onLeave}
      onClose={onClose}
    />
  );
}

export function MobileVoiceHands({ roomId }: { roomId: string }) {
  const { t } = useTranslation("voice");
  const hands = useVoiceHands(roomId);
  const answer = useAnswerVoiceHand(roomId);
  const items = hands.data ?? [];

  if (!items.length) return null;

  return (
    <div className="mt-10.5 flex flex-col gap-2.5">
      <strong className="px-1 text-title-sm font-semibold">{t("room.handsTitle", { count: items.length })}</strong>
      {items.map((item) => (
        <article key={item.userId} className="flex h-16.5 items-center gap-3 rounded-xl bg-subtle/40 px-4">
          <Avatar name={item.name} size="sm" />
          <span className="flex min-w-0 flex-1 flex-col">
            <strong className="truncate text-title-sm font-semibold">
              <span aria-hidden="true">✋ </span>
              {item.name}
            </strong>
            <small className={`truncate text-caption ${item.status === "allowed" ? "text-success" : "text-ink-secondary"}`}>
              {item.status === "allowed" ? t("room.handAllowed") : t("room.handWaiting")}
            </small>
          </span>
          <button
            type="button"
            className="grid size-9 shrink-0 place-items-center rounded-full text-ink-secondary disabled:opacity-50"
            aria-label={t("room.handDismiss")}
            disabled={answer.isPending}
            onClick={() => answer.mutate({ userId: item.userId, allow: false })}
          >
            <Icon name="close" size={18} />
          </button>
          {item.status === "raised" ? (
            <button
              type="button"
              className="flex h-11 shrink-0 items-center rounded-full bg-brand px-3.5 text-button text-on-action disabled:opacity-50"
              disabled={answer.isPending}
              onClick={() => answer.mutate({ userId: item.userId, allow: true })}
            >
              {t("room.handAllow")}
            </button>
          ) : null}
        </article>
      ))}
    </div>
  );
}

export function MobileVoiceJoinRequests({ roomId }: { roomId: string }) {
  const { t } = useTranslation("voice");
  const requests = useVoiceJoinRequests(roomId);
  const answer = useAnswerVoiceJoinRequest(roomId);
  const pending = (requests.data ?? []).filter((request) => request.status === "pending");

  if (!pending.length) return null;

  return (
    <div className="mt-10.5 flex flex-col gap-2.5">
      {pending.map((request) => (
        <article
          key={request.id}
          className="flex h-16.5 items-center gap-3 rounded-xl bg-subtle/40 px-4"
        >
          <Avatar name={request.userName} size="sm" />
          <span className="flex min-w-0 flex-1 flex-col">
            <strong className="truncate text-title-sm font-semibold">
              {t("room.wantsToJoin", { name: request.userName.trim().split(/\s+/)[0] ?? request.userName })}
            </strong>
            <small className="truncate text-caption text-ink-secondary">{t("room.requestNote")}</small>
          </span>
          <button
            type="button"
            className="grid size-9 shrink-0 place-items-center rounded-full text-ink-secondary disabled:opacity-50"
            aria-label={t("room.deny")}
            disabled={answer.isPending}
            onClick={() => answer.mutate({ requestId: request.id, approve: false })}
          >
            <Icon name="close" size={18} />
          </button>
          <button
            type="button"
            className="flex h-11 shrink-0 items-center rounded-full bg-brand px-3.5 text-button text-on-action disabled:opacity-50"
            disabled={answer.isPending}
            onClick={() => answer.mutate({ requestId: request.id, approve: true })}
          >
            {t("room.approve")}
          </button>
        </article>
      ))}
    </div>
  );
}
