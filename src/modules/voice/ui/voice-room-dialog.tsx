import {
  LiveKitRoom,
  RoomAudioRenderer,
  useConnectionState,
  useLocalParticipant,
  useParticipants,
} from "@livekit/components-react";
import { ConnectionState } from "livekit-client";
import { Check, Mic, MicOff, PhoneOff, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import type { VoiceRoom, VoiceToken } from "@/shared/types";
import { Avatar, Button, Dialog, DialogContent } from "@/shared/ui/legacy";
import { useAnswerVoiceJoinRequest, useVoiceJoinRequests } from "../model/voice.queries";

export interface VoiceRoomDialogProps {
  room: VoiceRoom;
  token: VoiceToken;
  open: boolean;
  onLeave: () => void;
  onClose: () => void;
  closing?: boolean;
}

export function VoiceRoomDialog({ room, token, open, onLeave, onClose, closing }: VoiceRoomDialogProps) {
  const { t } = useTranslation("voice");

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? undefined : onLeave())}>
      {open ? (
        <DialogContent
          className="voice-room-dialog"
          title={room.title || t("room.defaultTitle")}
          description={t("room.description")}
        >
          <LiveKitRoom
            token={token.token}
            serverUrl={token.serverUrl}
            connect
            audio
            video={false}
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
        </DialogContent>
      ) : null}
    </Dialog>
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
    <div className="voice-room">
      {connecting ? (
        <p className="voice-room-connecting">{t("room.connecting")}</p>
      ) : (
      <div className="voice-room-people">
        <span className="voice-room-count">{t("room.participants", { count: participants.length })}</span>
        <ul>
          {participants.map((participant) => {
            const name = participant.name || participant.identity;
            const micOn = participant.isMicrophoneEnabled;
            return (
              <li key={participant.sid} className={participant.isSpeaking ? "is-speaking" : ""}>
                <Avatar name={name} size="sm" />
                <span className="voice-room-name">{name}</span>
                {micOn ? <Mic size={15} /> : <MicOff size={15} className="voice-room-muted" />}
              </li>
            );
          })}
        </ul>
      </div>
      )}

      {isModerator ? <VoiceJoinRequests roomId={room.id} /> : null}

      <div className="voice-room-controls">
        <MicControl />
        {isModerator ? (
          <Button variant="secondary" loading={closing} onClick={onClose}>
            {t("room.closeRoom")}
          </Button>
        ) : null}
        <Button variant="secondary" className="voice-room-leave" onClick={onLeave}>
          <PhoneOff size={16} /> {t("room.leave")}
        </Button>
      </div>
    </div>
  );
}

function MicControl() {
  const { t } = useTranslation("voice");
  const { localParticipant, isMicrophoneEnabled } = useLocalParticipant();

  return (
    <button
      type="button"
      className={`voice-control ${isMicrophoneEnabled ? "is-on" : ""}`}
      aria-pressed={isMicrophoneEnabled}
      aria-label={t("room.micLabel")}
      title={t("room.micLabel")}
      onClick={() => void localParticipant?.setMicrophoneEnabled(!isMicrophoneEnabled)}
    >
      {isMicrophoneEnabled ? <Mic size={19} /> : <MicOff size={19} />}
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
    <div className="voice-room-requests">
      <span>{t("room.requestsTitle", { count: pending.length })}</span>
      {pending.map((request) => (
        <div key={request.id} className="voice-room-request">
          <Avatar name={request.userName} size="sm" />
          <span className="voice-room-name">{request.userName}</span>
          <button
            type="button"
            className="voice-room-approve"
            aria-label={t("room.approve")}
            disabled={answer.isPending}
            onClick={() => answer.mutate({ requestId: request.id, approve: true })}
          >
            <Check size={15} />
          </button>
          <button
            type="button"
            className="voice-room-deny"
            aria-label={t("room.deny")}
            disabled={answer.isPending}
            onClick={() => answer.mutate({ requestId: request.id, approve: false })}
          >
            <X size={15} />
          </button>
        </div>
      ))}
    </div>
  );
}
