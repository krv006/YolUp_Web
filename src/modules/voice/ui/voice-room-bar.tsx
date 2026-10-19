import { useRef, useState } from "react";
import { Icon } from "@/shared/ui/icon";
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
      <div className="flex shrink-0 items-center gap-3 border-b border-line bg-action-subtle/50 px-4 py-3 lg:px-6">
        <span
          className={`grid size-9 shrink-0 place-items-center rounded-full ${
            active?.status === "live" ? "bg-action text-on-action" : "bg-surface text-action"
          }`}
          aria-hidden="true"
        >
          <Icon name="volume" size={18} />
        </span>
        {active ? (
          <>
            <span className="flex min-w-0 flex-1 flex-col">
              <strong className="truncate text-label-strong text-ink">
                {active.title || t("room.defaultTitle")}
              </strong>
              <small className="truncate text-caption text-ink-secondary">
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
              className="flex h-10 shrink-0 items-center gap-2 rounded-full bg-action px-4 text-label-strong text-on-action transition-colors hover:bg-action-hover disabled:opacity-60"
              disabled={join.isPending || requestJoin.isPending}
              onClick={() => enterRoom(active)}
            >
              <Icon name="groups" size={18} /> {t("bar.join")}
            </button>
            {active.accessMode === "invite_only" ? (
              <button
                type="button"
                className="flex h-10 shrink-0 items-center rounded-full border border-line bg-surface px-4 text-label-strong text-ink disabled:opacity-60"
                disabled={requestJoin.isPending}
                onClick={() => requestJoin.mutate(active.id)}
              >
                {t("bar.requestJoin")}
              </button>
            ) : null}
          </>
        ) : (
          <>
            <span className="flex min-w-0 flex-1 flex-col">
              <strong className="truncate text-label-strong text-ink">{t("bar.emptyTitle")}</strong>
              <small className="truncate text-caption text-ink-secondary">
                {t("bar.emptyHint")}
              </small>
            </span>
            <button
              type="button"
              className="flex h-10 shrink-0 items-center gap-2 rounded-full bg-action px-4 text-label-strong text-on-action transition-colors hover:bg-action-hover"
              onClick={() => setCreateOpen(true)}
            >
              <Icon name="volume" size={18} /> {t("bar.create")}
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
