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
import type { VoiceRoom, VoiceToken } from "@/shared/types";
import { Icon } from "@/shared/ui/icon";
import { Avatar } from "@/shared/ui/legacy";
import { useAnswerVoiceJoinRequest, useVoiceJoinRequests } from "../model/voice.queries";

export interface VoiceRoomPanelProps {
  room: VoiceRoom;
  token: VoiceToken;
  onLeave: () => void;
  onClose: () => void;
  closing?: boolean;
}

export function VoiceRoomPanel({ room, token, onLeave, onClose, closing }: VoiceRoomPanelProps) {
  const { t } = useTranslation("voice");

  return (
    <LiveKitRoom
      token={token.token}
      serverUrl={token.serverUrl}
      connect
      audio
      video={false}
      className="absolute inset-0 z-20 flex flex-col bg-canvas"
      onDisconnected={onLeave}
      onError={(error) => {
        toast.error(error.message || t("room.connectFailed"));
        onLeave();
      }}
    >
      <RoomAudioRenderer />
      <VoiceRoomBody
        room={room}
        isModerator={token.isModerator}
        onLeave={onLeave}
        onClose={onClose}
        closing={closing}
      />
    </LiveKitRoom>
  );
}

function VoiceRoomBody({
  room,
  isModerator,
  onLeave,
  onClose,
  closing,
}: {
  room: VoiceRoom;
  isModerator: boolean;
  onLeave: () => void;
  onClose: () => void;
  closing?: boolean;
}) {
  const { t } = useTranslation("voice");
  const participants = useParticipants();
  const connection = useConnectionState();
  const connecting = connection !== ConnectionState.Connected;

  return (
    <>
      <header className="flex h-21 shrink-0 items-center gap-3 px-6">
        <button
          type="button"
          className="grid size-11 shrink-0 place-items-center rounded-full bg-surface text-icon transition-colors hover:bg-subtle"
          aria-label={t("room.leave")}
          onClick={onLeave}
        >
          <Icon name="chevron-down" size={20} />
        </button>

        <div className="flex min-w-0 flex-1 flex-col items-center">
          <strong className="max-w-full truncate font-heading text-title-lg text-ink">
            {room.title || t("room.defaultTitle")}
          </strong>
          <small className="max-w-full truncate text-body-xs text-ink-tertiary">
            {t("room.participants", { count: participants.length })}
          </small>
        </div>

        <span
          className="grid size-11 shrink-0 place-items-center rounded-full bg-surface text-icon"
          aria-hidden="true"
        >
          <Icon name="person" size={20} />
        </span>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-6 pb-5">
        {connecting ? (
          <p className="pt-10 text-center text-body-sm text-ink-tertiary">{t("room.connecting")}</p>
        ) : (
          <div className="flex flex-wrap justify-center gap-x-10 gap-y-7 pt-2">
            {participants.map((participant) => {
              const name = participant.name || participant.identity;
              const micOn = participant.isMicrophoneEnabled;
              const speaking = participant.isSpeaking;
              const owner =
                participant.identity === (room.hostIdentity ?? `user-${room.createdById}`);

              return (
                <span key={participant.sid} className="flex w-25 flex-col items-center gap-2">
                  <Avatar
                    name={name}
                    size="xl"
                    className={speaking || owner ? "ring-2 ring-success" : ""}
                  />
                  <strong
                    className={`max-w-full truncate text-title-sm ${
                      micOn ? "text-ink" : "text-ink-tertiary"
                    }`}
                  >
                    {name}
                  </strong>
                  <small
                    className={`max-w-full truncate text-body-xs ${
                      speaking || owner ? "text-success" : "text-ink-tertiary"
                    }`}
                  >
                    {owner
                      ? t("room.owner")
                      : speaking
                        ? t("room.speaking")
                        : micOn
                          ? t("room.micOn")
                          : t("room.micOff")}
                  </small>
                </span>
              );
            })}
          </div>
        )}

        {isModerator ? <VoiceJoinRequests roomId={room.id} /> : null}
      </div>

      <div className="flex shrink-0 items-center gap-2.5 px-6 pb-6">
        <MicControl />

        <button
          type="button"
          className="flex h-13 min-w-0 flex-1 items-center justify-center rounded-full border border-line bg-surface px-5 text-button text-ink transition-colors hover:bg-subtle"
          onClick={onLeave}
        >
          {t("room.leave")}
        </button>

        {isModerator ? (
          <button
            type="button"
            className="flex h-13 min-w-0 flex-1 items-center justify-center rounded-full bg-danger-bg px-5 text-button text-danger transition-opacity hover:opacity-85 disabled:opacity-50"
            disabled={closing}
            onClick={onClose}
          >
            {t("room.closeRoom")}
          </button>
        ) : null}
      </div>
    </>
  );
}

function MicControl() {
  const { t } = useTranslation("voice");
  const { localParticipant, isMicrophoneEnabled } = useLocalParticipant();

  return (
    <button
      type="button"
      className={`grid size-13 shrink-0 place-items-center rounded-full transition-colors ${
        isMicrophoneEnabled
          ? "bg-surface-inverse text-ink-inverse"
          : "bg-danger-bg text-danger"
      }`}
      aria-pressed={isMicrophoneEnabled}
      aria-label={t("room.micLabel")}
      title={t("room.micLabel")}
      onClick={() => void localParticipant?.setMicrophoneEnabled(!isMicrophoneEnabled)}
    >
      <Icon name="mic" size={20} />
    </button>
  );
}

function VoiceJoinRequests({ roomId }: { roomId: string }) {
  const { t } = useTranslation("voice");
  const requests = useVoiceJoinRequests(roomId);
  const answer = useAnswerVoiceJoinRequest(roomId);
  const pending = (requests.data ?? []).filter((request) => request.status === "pending");

  if (!pending.length) return null;

  return (
    <div className="flex flex-col gap-2.5">
      {pending.map((request) => (
        <article
          key={request.id}
          className="flex items-center gap-3 rounded-lg bg-surface-inverse px-4 py-3.5"
        >
          <Avatar name={request.userName} size="sm" />
          <span className="flex min-w-0 flex-1 flex-col">
            <strong className="truncate text-title-sm text-ink-inverse">{request.userName}</strong>
            <small className="truncate text-body-xs text-ink-inverse-secondary">
              {t("room.requestNote")}
            </small>
          </span>
          <button
            type="button"
            className="grid size-9 shrink-0 place-items-center rounded-full text-ink-inverse transition-opacity hover:opacity-70 disabled:opacity-50"
            aria-label={t("room.deny")}
            disabled={answer.isPending}
            onClick={() => answer.mutate({ requestId: request.id, approve: false })}
          >
            <Icon name="close" size={18} />
          </button>
          <button
            type="button"
            className="flex h-9 shrink-0 items-center rounded-full bg-brand px-4 text-button text-on-action transition-colors hover:bg-brand-strong disabled:opacity-50"
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
