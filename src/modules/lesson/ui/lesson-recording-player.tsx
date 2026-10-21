import { useState } from "react";
import {
  Loader2,
  PenLine,
  ShieldCheck,
  Trash2,
  TriangleAlert,
  Users,
  VideoOff,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatDateTime } from "@/shared/lib";
import type { LessonRecording } from "@/shared/types";
import { Button, Dialog, DialogContent } from "@/shared/ui/legacy";
import { useDeleteRecording } from "../model/lesson.queries";

export interface LessonRecordingPlayerProps {
  lessonId: string;
  recording: LessonRecording | null | undefined;
  canDelete?: boolean;
}

export function LessonRecordingPlayer({
  lessonId,
  recording,
  canDelete = false,
}: LessonRecordingPlayerProps) {
  const { t } = useTranslation("lesson");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const removeRecording = useDeleteRecording();

  if (!recording) {
    return (
      <div className="recording-state">
        <VideoOff size={28} />
        <p>{t("recording.none")}</p>
      </div>
    );
  }

  if (recording.status === "failed") {
    return (
      <div className="recording-state recording-state--error">
        <TriangleAlert size={28} />
        <p>{recording.error || t("recording.failed")}</p>
      </div>
    );
  }

  if (!recording.ready || !recording.streamUrl) {
    return (
      <div className="recording-state">
        <Loader2 size={28} className="spin" />
        <p>
          {recording.status === "recording"
            ? t("recording.recording")
            : recording.status === "merging"
              ? t("recording.merging")
              : t("recording.preparing")}
        </p>
      </div>
    );
  }

  return (
    <div className="recording-player">
      <video
        controls
        playsInline
        preload="metadata"
        src={recording.streamUrl}
        controlsList="nodownload noplaybackrate"
        disablePictureInPicture
        onContextMenu={(event) => event.preventDefault()}
      />

      {recording.participantsCount !== null ||
      recording.attendanceRate !== null ||
      recording.boardPages !== null ? (
        <div className="flex flex-wrap items-center gap-2 px-1">
          {recording.participantsCount !== null ? (
            <span className="flex h-9 items-center gap-1.5 rounded-full bg-subtle px-3 text-caption-strong text-ink-secondary">
              <Users size={14} />
              {t("recording.participants", { count: recording.participantsCount })}
            </span>
          ) : null}
          {recording.attendanceRate !== null ? (
            <span className="flex h-9 items-center gap-1.5 rounded-full bg-subtle px-3 text-caption-strong text-ink-secondary">
              <ShieldCheck size={14} />
              {t("recording.attendanceRate", { value: recording.attendanceRate })}
            </span>
          ) : null}
          {recording.boardPages !== null ? (
            <span className="flex h-9 items-center gap-1.5 rounded-full bg-subtle px-3 text-caption-strong text-ink-secondary">
              <PenLine size={14} />
              {t("recording.boardPages", { count: recording.boardPages })}
            </span>
          ) : null}
        </div>
      ) : null}

      <div className="recording-meta">
        <div>
          <strong>{recording.title}</strong>
          <small>
            <ShieldCheck size={13} /> {t("recording.platformOnly")}
            {recording.endedAt
              ? ` · ${formatDateTime(recording.endedAt)}`
              : recording.createdAt
                ? ` · ${formatDateTime(recording.createdAt)}`
                : ""}
          </small>
        </div>
        {canDelete ? (
          <Button variant="secondary" onClick={() => setConfirmOpen(true)}>
            <Trash2 size={16} /> {t("recording.delete")}
          </Button>
        ) : null}
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        {confirmOpen ? (
          <DialogContent
            title={t("recording.deleteDialogTitle")}
            description={t("recording.deleteDialogDescription")}
          >
            <div className="dialog-actions">
              <Button variant="secondary" onClick={() => setConfirmOpen(false)}>
                {t("recording.cancel")}
              </Button>
              <Button
                loading={removeRecording.isPending}
                onClick={() =>
                  removeRecording.mutate(lessonId, { onSuccess: () => setConfirmOpen(false) })
                }
              >
                {t("recording.delete")}
              </Button>
            </div>
          </DialogContent>
        ) : null}
      </Dialog>
    </div>
  );
}
