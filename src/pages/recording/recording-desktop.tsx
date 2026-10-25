import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAttendance } from "@/modules/attendance";
import { useConversations } from "@/modules/conversation";
import { useCourse } from "@/modules/course";
import { useDeleteRecording } from "@/modules/lesson";
import { ROUTES } from "@/shared/config";
import type { AttendanceRow, Lesson, LessonRecording } from "@/shared/types";
import { AppDialog, dialogButton } from "@/shared/ui/app-dialog";
import { Icon } from "@/shared/ui/icon";
import { Avatar } from "@/shared/ui/legacy";
import { WorkspaceShell } from "@/widgets/workspace-shell";
import { RecordingVideo } from "./recording-video";

export interface RecordingDesktopProps {
  lesson: Lesson;
  recording: LessonRecording | null | undefined;
  canManage: boolean;
}

function chapterClock(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(total / 60);
  return `${String(minutes).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function focusPercent(row: AttendanceRow, durationMinutes: number): number | null {
  const total = durationMinutes * 60;
  if (!total || !row.minutes) return null;
  const away = row.focus.awaySeconds;
  return Math.max(0, Math.min(100, Math.round((1 - away / total) * 100)));
}

export function RecordingDesktop({ lesson, recording, canManage }: RecordingDesktopProps) {
  const { t } = useTranslation("lesson");
  const navigate = useNavigate();
  const course = useCourse(lesson.courseId);
  const conversations = useConversations("teacher");
  const attendance = useAttendance({ lesson: lesson.id });
  const removeRecording = useDeleteRecording();

  const [confirmOpen, setConfirmOpen] = useState(false);

  const rows = useMemo(() => attendance.data ?? [], [attendance.data]);
  const studentCount = course.data?.studentCount ?? rows.length;
  const joined = recording?.participantsCount ?? rows.length;

  const focus = useMemo(() => {
    const values = rows
      .map((row) => focusPercent(row, lesson.durationMinutes))
      .filter((value): value is number => value !== null);
    if (!values.length) return recording?.attendanceRate ?? null;
    return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
  }, [rows, lesson.durationMinutes, recording?.attendanceRate]);

  const hours = Math.floor(lesson.durationMinutes / 60);
  const durationLabel = hours
    ? t("recording.durationHours", { hours, count: lesson.durationMinutes % 60 })
    : t("recording.durationValue", { count: lesson.durationMinutes });

  const pending = Boolean(recording) && recording?.status !== "failed" && !recording?.ready;

  const room = (conversations.data ?? []).find((item) => item.courseId === lesson.courseId);
  const visibleRows = rows.slice(0, 3);
  const boardPages = recording?.boardPages ?? 0;

  return (
    <WorkspaceShell
      eyebrow={`${t("recording.eyebrow")} · ${lesson.courseTitle} · ${lesson.date}, ${lesson.time} · ${durationLabel}`}
      title={lesson.title || t("list.missingTopic")}
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex min-w-0 flex-col gap-5">
          {recording?.ready && recording.streamUrl ? (
            <RecordingVideo src={recording.streamUrl} />
          ) : (
            <div className="flex aspect-video w-full flex-col items-center justify-center gap-3.5 rounded-lg bg-subtle px-6 text-center">
              <span className="grid size-18 place-items-center rounded-xl bg-surface text-brand">
                <Icon name={pending ? "hourglass-empty" : "videocam"} size={30} />
              </span>

              <strong className="font-heading text-h2 text-ink">
                {recording?.status === "recording"
                  ? t("recording.recordingTitle")
                  : recording?.status === "merging"
                    ? t("recording.mergingTitle")
                    : recording?.status === "failed"
                      ? t("recording.failedTitle")
                      : recording
                        ? t("recording.preparingTitle")
                        : t("recording.noneTitle")}
              </strong>

              <p className="max-w-125 text-body-sm text-ink-secondary">
                {recording?.error ??
                  (recording?.status === "recording"
                    ? t("recording.recording")
                    : recording?.status === "merging"
                      ? t("recording.merging")
                      : recording
                        ? t("recording.preparing")
                        : t("recording.none"))}
              </p>

              {pending ? (
                <span className="mt-1 h-1.5 w-80 overflow-hidden rounded-full bg-surface">
                  <i className="block h-full w-3/5 rounded-full bg-brand not-italic" />
                </span>
              ) : null}
            </div>
          )}

          {recording?.chapters.length ? (
            <section className="flex flex-col gap-5">
              <strong className="font-heading text-title text-ink">
                {t("recording.chapters")}
              </strong>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {recording.chapters.map((chapter) => (
                  <span
                    key={`${chapter.seconds}-${chapter.title}`}
                    className="flex flex-col gap-1.5 rounded-lg bg-surface px-4 py-3.5"
                  >
                    <strong className="truncate text-title-sm text-brand">
                      {chapterClock(chapter.seconds)}
                    </strong>
                    <small className="truncate text-body-sm text-ink">{chapter.title}</small>
                  </span>
                ))}
              </div>
            </section>
          ) : null}
        </div>

        <div className="flex min-w-0 flex-col gap-5">
          <div className="grid grid-cols-2 gap-2.5">
            <StatCard
              label={t("recording.joined")}
              value={`${joined}/${studentCount}`}
              tone="text-success"
            />
            <StatCard
              label={t("recording.focus")}
              value={focus === null ? "—" : `${focus}%`}
              tone="text-ink"
            />
          </div>

          <section className="flex flex-col gap-5">
            <header className="flex items-center gap-3">
              <strong className="min-w-0 flex-1 truncate font-heading text-title text-ink">
                {t("recording.boardPagesTitle")}
              </strong>
              <button
                type="button"
                className="shrink-0 text-button text-brand transition-opacity hover:opacity-80 disabled:opacity-40"
                disabled={!boardPages}
                onClick={() => navigate(ROUTES.teacher.board(lesson.id))}
              >
                {t("recording.pdf")}
              </button>
            </header>

            {boardPages ? (
              <div className="grid grid-cols-3 gap-2.5">
                {Array.from({ length: Math.min(boardPages, 3) }, (_, index) => (
                  <button
                    key={index}
                    type="button"
                    className="flex h-17.5 flex-col justify-start gap-1.5 rounded-md bg-surface px-3 pt-3 text-left transition-colors hover:bg-subtle"
                    onClick={() => navigate(ROUTES.teacher.board(lesson.id))}
                  >
                    <i className="h-1 w-3/5 rounded-full bg-line-strong not-italic" />
                    <i className="h-1 w-4/5 rounded-full bg-line not-italic" />
                    <i className="h-1 w-2/5 rounded-full bg-line not-italic" />
                  </button>
                ))}
              </div>
            ) : (
              <p className="rounded-md bg-surface px-4 py-5 text-center text-body-xs text-ink-tertiary">
                {t("recording.noBoardPages")}
              </p>
            )}
          </section>

          <section className="flex flex-col gap-5">
            <header className="flex items-center gap-3">
              <strong className="min-w-0 flex-1 truncate font-heading text-title text-ink">
                {t("recording.attendanceTitle")}
              </strong>
              <button
                type="button"
                className="shrink-0 text-button text-brand transition-opacity hover:opacity-80"
                onClick={() => navigate(ROUTES.teacher.attendance)}
              >
                {t("recording.details")}
              </button>
            </header>

            <div className="flex flex-col gap-4 rounded-lg bg-surface p-4">
              {visibleRows.map((row) => {
                const percent = focusPercent(row, lesson.durationMinutes);
                const absent = !row.minutes;
                const distracted = row.focus.exits > 0;
                return (
                  <span key={row.id} className="flex items-center gap-3">
                    <Avatar name={row.child} size="xs" tone={row.student?.avatarTone} />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <strong className="truncate text-title-sm leading-5 text-ink">
                        {row.child}
                      </strong>
                      <small
                        className={`truncate text-body-xs leading-4.5 ${
                          absent
                            ? "text-danger"
                            : distracted
                              ? "text-warning-fg"
                              : "text-success"
                        }`}
                      >
                        {absent
                          ? t("recording.absent")
                          : distracted
                            ? t("recording.rowDistracted", {
                                minutes: row.minutes,
                                count: row.focus.exits,
                              })
                            : t("recording.rowFocus", {
                                minutes: row.minutes,
                                percent: percent ?? 100,
                              })}
                      </small>
                    </span>
                  </span>
                );
              })}

              {!visibleRows.length ? (
                <p className="py-4 text-center text-body-xs text-ink-tertiary">
                  {t("recording.noAttendance")}
                </p>
              ) : null}
            </div>
          </section>

          {canManage ? (
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                className="flex h-11 items-center justify-center rounded-full bg-surface px-4 text-button text-ink transition-colors hover:bg-subtle disabled:opacity-40"
                disabled={!room}
                onClick={() => room && navigate(ROUTES.teacher.chat(room.id))}
              >
                {t("recording.sendToChat")}
              </button>
              <button
                type="button"
                className="flex h-11 items-center justify-center rounded-full bg-danger-bg px-4 text-button text-danger transition-opacity hover:opacity-85 disabled:opacity-40"
                disabled={!recording}
                onClick={() => setConfirmOpen(true)}
              >
                {t("recording.delete")}
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <AppDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        variant="confirm"
        width="lg:w-120"
        icon={
          <span className="grid size-11 place-items-center rounded-md bg-danger-bg text-danger">
            <Icon name="delete" size={22} />
          </span>
        }
        title={t("recording.deleteDialogTitle")}
        description={t("recording.deleteDialogDescription")}
        footer={
          <>
            <button
              type="button"
              className={dialogButton.secondary}
              onClick={() => setConfirmOpen(false)}
            >
              {t("recording.cancel")}
            </button>
            <button
              type="button"
              className={dialogButton.danger}
              disabled={removeRecording.isPending}
              onClick={() =>
                removeRecording.mutateAsync(lesson.id).then(() => setConfirmOpen(false))
              }
            >
              {t("recording.delete")}
            </button>
          </>
        }
      />
    </WorkspaceShell>
  );
}

function StatCard({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-lg bg-surface px-5 py-4.5">
      <small className="truncate text-body-sm text-ink-secondary">{label}</small>
      <strong className={`font-heading text-display ${tone}`}>{value}</strong>
    </div>
  );
}
