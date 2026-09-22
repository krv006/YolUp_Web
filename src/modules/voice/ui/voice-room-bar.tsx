import { useRef, useState } from "react";
import { Mic, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatDayTime } from "@/shared/lib";
import type { VoiceRoom, VoiceToken } from "@/shared/types";
import {
  useActiveVoiceRoom,
  useCloseVoiceRoom,
  useCreateVoiceRoom,
  useJoinVoiceRoom,
  useLeaveVoiceRoom,
  useRequestVoiceJoin,
} from "../model/voice.queries";
import { VoiceRoomCreateDialog } from "./voice-room-create-dialog";
import { VoiceRoomDialog } from "./voice-room-dialog";

export interface VoiceRoomBarProps {
  courseId: string | null;
}

export function VoiceRoomBar({ courseId }: VoiceRoomBarProps) {
  const { t } = useTranslation("voice");
  const { active } = useActiveVoiceRoom(courseId);
  const create = useCreateVoiceRoom();
  const join = useJoinVoiceRoom();
  const leave = useLeaveVoiceRoom();
  const close = useCloseVoiceRoom();
  const requestJoin = useRequestVoiceJoin();
  const [createOpen, setCreateOpen] = useState(false);
  const [joined, setJoined] = useState<{ room: VoiceRoom; token: VoiceToken } | null>(null);
  const leavingRef = useRef(false);

  if (!courseId) return null;

  function enterRoom(room: VoiceRoom) {
    leavingRef.current = false;
    join.mutate(room.id, { onSuccess: (token) => setJoined({ room, token }) });
  }

  function leaveRoom() {
    const current = joined;
    if (!current || leavingRef.current) return;
    leavingRef.current = true;
    setJoined(null);
    leave.mutate(current.room.id);
  }

  function closeRoom() {
    const current = joined;
    if (!current || leavingRef.current) return;
    leavingRef.current = true;
    setJoined(null);
    leave.mutate(current.room.id, { onSettled: () => close.mutate(current.room.id) });
  }

  const scheduled = active?.status === "scheduled";

  return (
    <>
      <div className="voice-room-bar">
        <span className={`voice-room-bar-icon ${active?.status === "live" ? "is-live" : ""}`} aria-hidden="true">
          <Mic size={15} />
        </span>
        {active ? (
          <>
            <span className="voice-room-bar-text">
              <strong>{active.title || t("room.defaultTitle")}</strong>
              <small>
                {scheduled && active.scheduledAt
                  ? t("bar.scheduledAt", { time: formatDayTime(active.scheduledAt) })
                  : t("bar.live")}
                {" · "}
                {t("bar.participants", { count: active.participantCount })}
                {active.accessMode === "invite_only" ? ` · ${t("access.inviteOnly")}` : ""}
              </small>
            </span>
            <button
              type="button"
              disabled={join.isPending || requestJoin.isPending}
              onClick={() => enterRoom(active)}
            >
              <Users size={15} /> {t("bar.join")}
            </button>
            {active.accessMode === "invite_only" ? (
              <button
                type="button"
                className="voice-room-bar-ghost"
                disabled={requestJoin.isPending}
                onClick={() => requestJoin.mutate(active.id)}
              >
                {t("bar.requestJoin")}
              </button>
            ) : null}
          </>
        ) : (
          <>
            <span className="voice-room-bar-text">
              <strong>{t("bar.emptyTitle")}</strong>
              <small>{t("bar.emptyHint")}</small>
            </span>
            <button type="button" onClick={() => setCreateOpen(true)}>
              <Mic size={15} /> {t("bar.create")}
            </button>
          </>
        )}
      </div>

      <VoiceRoomCreateDialog
        courseId={courseId}
        open={createOpen}
        pending={create.isPending}
        onOpenChange={setCreateOpen}
        onCreate={(values) =>
          create.mutate(values, {
            onSuccess: (room) => {
              setCreateOpen(false);
              if (room.status === "live") enterRoom(room);
            },
          })
        }
      />

      {joined ? (
        <VoiceRoomDialog
          open
          room={joined.room}
          token={joined.token}
          closing={close.isPending}
          onLeave={leaveRoom}
          onClose={closeRoom}
        />
      ) : null}
    </>
  );
}
