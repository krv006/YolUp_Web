import { useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useAttendance } from "@/modules/attendance";
import { useCourse } from "@/modules/course";
import { boardApi } from "@/modules/board";
import { useDeleteRecording, useShareRecording } from "@/modules/lesson";
import { ROUTES } from "@/shared/config";
import type { Lesson, LessonRecording } from "@/shared/types";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { Icon } from "@/shared/ui/icon";
import { Dropdown, DropdownContent, DropdownItem, DropdownTrigger } from "@/shared/ui/legacy";
import { RecordingVideo } from "./recording-video";

export interface RecordingMobileProps {
  lesson: Lesson;
  recording: LessonRecording | null | undefined;
  canManage: boolean;
  children?: ReactNode;
}

export function RecordingMobile({ lesson, recording, canManage, children }: RecordingMobileProps) {
  const { t } = useTranslation("lesson");
  const navigate = useNavigate();
  const months = t("list.months", { returnObjects: true }) as string[];
  const course = useCourse(canManage ? lesson.courseId : null);
  const attendance = useAttendance({ lesson: lesson.id }, canManage);
  const removeRecording = useDeleteRecording();
  const share = useShareRecording(lesson.id);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const ready = Boolean(recording?.ready && recording.streamUrl);
  const rows = useMemo(() => attendance.data ?? [], [attendance.data]);
  const studentCount = course.data?.studentCount ?? rows.length;
  const joined = recording?.participantsCount ?? rows.filter((row) => row.minutes > 0).length;
  const boardPages = recording?.boardPreviews.length || recording?.boardPages || 0;

  const day = new Date(`${lesson.date}T00:00`);
  const dateLabel = Number.isNaN(day.getTime())
    ? lesson.date
    : `${day.getDate()}-${(months[day.getMonth()] ?? "").toLowerCase()}`;
  const hours = Math.floor(lesson.durationMinutes / 60);
  const durationLabel = hours
    ? t("recording.durationHours", { hours, count: lesson.durationMinutes % 60 })
    : t("recording.durationValue", { count: lesson.durationMinutes });

  const pendingTitle =
    recording?.status === "recording"
      ? t("recording.recordingTitle")
      : recording?.status === "failed"
        ? t("recording.failedTitle")
        : recording
          ? t("recording.mergingTitle")
          : t("recording.noneTitle");
  const pendingNote =
    recording?.error ??
    (recording?.status === "recording"
      ? t("recording.recording")
      : recording?.status === "failed"
        ? t("recording.failed")
        : recording
          ? t("recording.mobileMerging")
          : t("recording.none"));

  async function downloadPdf() {
    try {
      const blob = await boardApi.downloadPdf(lesson.id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${lesson.title || "doska"}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("recording.pdfFailed"));
    }
  }

  return (
    <main className="flex min-h-dvh flex-col bg-canvas bg-auth-gradient px-4 pt-5 pb-8 font-body text-ink [&>*]:shrink-0">
      <header className="flex h-11 items-center gap-3">
        <button
          type="button"
          className="grid size-11 shrink-0 place-items-center rounded-full bg-subtle text-ink"
          aria-label={t("recording.back")}
          onClick={() => navigate(-1)}
        >
          <Icon name="chevron-left" size={22} />
        </button>
        <h1 className="min-w-0 flex-1 truncate text-center text-title-lg font-semibold">
          {t("recording.eyebrow")}
        </h1>
        {canManage && ready ? (
          <Dropdown>
            <DropdownTrigger asChild>
              <button
                type="button"
                className="grid size-11 shrink-0 place-items-center rounded-full bg-subtle text-ink"
                aria-label={t("recording.menu")}
              >
                <Icon name="more" size={22} />
              </button>
            </DropdownTrigger>
            <DropdownContent align="end">
              <DropdownItem
                disabled={share.isPending}
                onSelect={() =>
                  share.mutate(undefined, {
                    onSuccess: () => toast.success(t("recording.sharedToChat")),
                    onError: (error: Error) => toast.error(error.message),
                  })
                }
              >
                {t("recording.sendToChat")}
              </DropdownItem>
              {recording?.pdfUrl ? (
                <DropdownItem onSelect={() => void downloadPdf()}>{t("recording.downloadPdf")}</DropdownItem>
              ) : null}
            </DropdownContent>
          </Dropdown>
        ) : (
          <span className="size-11 shrink-0" aria-hidden="true" />
        )}
      </header>

      <div className="mt-4">
        {ready && recording?.streamUrl ? (
          <RecordingVideo src={recording.streamUrl} poster={recording.thumbnailUrl} variant="mobile" />
        ) : (
          <div className="flex aspect-[358/211] w-full flex-col items-center justify-center gap-3 rounded-2xl bg-surface px-6 text-center text-ink-secondary">
            <Icon
              name={recording?.status === "failed" ? "error" : recording ? "hourglass-empty" : "videocam"}
              size={32}
            />
            <strong className="text-title font-semibold">{pendingTitle}</strong>
          </div>
        )}
      </div>

      <h2 className="mt-3.5 text-title-lg font-bold">{lesson.title || t("list.missingTopic")}</h2>
      <p className="mt-0.5 text-body-sm text-ink-secondary">
        {lesson.courseTitle} · {dateLabel}, {lesson.time} · {durationLabel}
      </p>

      {ready ? (
        <>
          <div className="mt-3.5 flex flex-wrap items-center gap-2">
            {recording?.participantsCount != null ? (
              <span className="flex h-6.5 items-center gap-2 rounded-full bg-brand-subtle px-2 text-caption-strong text-brand">
                <Icon name="quiz" size={14} />
                {t("recording.mobileParticipants", { count: recording.participantsCount })}
              </span>
            ) : null}
            {recording?.attendanceRate != null ? (
              <span className="flex h-6.5 items-center gap-2 rounded-full bg-success-bg px-2 text-caption-strong text-success-fg">
                <Icon name="check-circle" size={14} />
                {t("recording.mobileAttendance", { value: Math.round(recording.attendanceRate) })}
              </span>
            ) : null}
          </div>

          <div className="mt-3.5 flex flex-col overflow-hidden rounded-2xl bg-surface">
            <button
              type="button"
              className="flex items-center gap-3 border-b border-line px-4 py-3.5 text-left"
              onClick={() => navigate(canManage ? ROUTES.teacher.board(lesson.id) : ROUTES.board(lesson.id))}
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent-violet-bg text-accent-violet-fg">
                <Icon name="edit" size={20} />
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <strong className="truncate text-title font-semibold">{t("recording.boardPagesTitle")}</strong>
                <small className="truncate text-body-sm text-ink-secondary">
                  {boardPages
                    ? t("recording.mobileBoardPages", { count: boardPages })
                    : t("recording.noBoardPages")}
                </small>
              </span>
              <Icon name="chevron-right" size={20} className="shrink-0 text-ink-secondary" />
            </button>

            {canManage ? (
              <button
                type="button"
                className="flex items-center gap-3 border-b border-line px-4 py-3.5 text-left"
                onClick={() => navigate(ROUTES.teacher.attendance)}
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-success-bg text-success-fg">
                  <Icon name="check-circle" size={20} />
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <strong className="truncate text-title font-semibold">{t("recording.mobileAttendanceTitle")}</strong>
                  <small className="truncate text-body-sm text-ink-secondary">
                    {t("recording.mobileJoined", { joined, total: studentCount })}
                  </small>
                </span>
                <Icon name="chevron-right" size={20} className="shrink-0 text-ink-secondary" />
              </button>
            ) : null}

            {canManage ? (
              <button
                type="button"
                className="flex items-center gap-3 px-4 py-3.5 text-left"
                onClick={() => setConfirmOpen(true)}
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-danger-bg text-error-text">
                  <Icon name="logout" size={20} />
                </span>
                <strong className="min-w-0 flex-1 truncate text-title font-semibold text-error-text">
                  {t("recording.mobileDelete")}
                </strong>
              </button>
            ) : null}
          </div>

          <p className="mt-5 text-caption text-ink-secondary">{t("recording.mobilePlatformOnly")}</p>
        </>
      ) : (
        <>
          <p className="mt-4 flex items-center gap-2.5 rounded-xl bg-brand-subtle px-4 py-3 text-body-sm leading-4.5 text-brand">
            <Icon name="bolt" size={20} className="shrink-0" />
            {pendingNote}
          </p>
          {recording && recording.status !== "failed" ? (
            <p className="mt-4 text-caption text-ink-secondary">{t("recording.mobileReadyNote")}</p>
          ) : null}
        </>
      )}

      {children}

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        icon="trash"
        title={t("recording.deleteDialogTitle")}
        description={t("recording.deleteDialogDescription")}
        confirmLabel={t("recording.delete")}
        cancelLabel={t("recording.cancel")}
        pending={removeRecording.isPending}
        onConfirm={() =>
          removeRecording.mutateAsync(lesson.id).then(() => {
            setConfirmOpen(false);
            navigate(-1);
          })
        }
      />
    </main>
  );
}
