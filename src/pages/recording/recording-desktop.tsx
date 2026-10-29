import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useAttendance } from "@/modules/attendance";
import { useCurrentUser, useIsStudent } from "@/modules/auth";
import { useCourse } from "@/modules/course";
import { boardApi } from "@/modules/board";
import { useDeleteRecording, useShareRecording } from "@/modules/lesson";
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
  if (row.focusPercent !== null) return Math.round(row.focusPercent);
  const total = durationMinutes * 60;
  if (!total || !row.minutes) return null;
  const away = row.focus.awaySeconds;
  return Math.max(0, Math.min(100, Math.round((1 - away / total) * 100)));
}

export function RecordingDesktop({ lesson, recording, canManage }: RecordingDesktopProps) {
  const { t } = useTranslation("lesson");
  const navigate = useNavigate();
  const course = useCourse(lesson.courseId);
  const attendance = useAttendance({ lesson: lesson.id });
  const removeRecording = useDeleteRecording();
  const share = useShareRecording(lesson.id);
  const student = useIsStudent();
  const me = useCurrentUser();
  const months = t("list.months", { returnObjects: true }) as string[];
  const boardRoute = student ? ROUTES.board(lesson.id) : ROUTES.teacher.board(lesson.id);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);

  async function downloadPdf() {
    setDownloading(true);
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
    } finally {
      setDownloading(false);
    }
  }

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

  const own = rows.find((row) => row.studentId === me?.id) ?? (student ? (rows[0] ?? null) : null);
  const ownFocus = own ? focusPercent(own, lesson.durationMinutes) : null;
  const starts = new Date(lesson.startsAt);
  const visibleRows = rows.slice(0, 3);
  const previews = recording?.boardPreviews ?? [];
  const boardPages = previews.length || (recording?.boardPages ?? 0);

  return (
    <WorkspaceShell
      eyebrow={
        student
          ? `${t("recording.eyebrow")} · ${lesson.courseTitle} · ${starts.getDate()}-${(months[starts.getMonth()] ?? "").toLowerCase()}`
          : `${t("recording.eyebrow")} · ${lesson.courseTitle} · ${lesson.date}, ${lesson.time} · ${durationLabel}`
      }
      title={lesson.title || t("list.missingTopic")}
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex min-w-0 flex-col gap-5">
          {recording?.ready && recording.streamUrl ? (
            <RecordingVideo src={recording.streamUrl} poster={recording.thumbnailUrl} />
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
          {student ? (
            <div className="grid grid-cols-2 gap-2.5">
              <StatCard
                label={t("recording.joinedYou")}
                value={own?.minutes ? t("recording.minutesShort", { count: own.minutes }) : "—"}
                tone="text-success"
              />
              <StatCard label={t("recording.focus")} value={ownFocus === null ? "—" : `${ownFocus}%`} tone="text-ink" />
            </div>
          ) : (
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
          )}

          <section className="flex flex-col gap-5">
            <header className="flex items-center gap-3">
              <strong className="min-w-0 flex-1 truncate font-heading text-title text-ink">
                {t("recording.boardPagesTitle")}
              </strong>
              <button
                type="button"
                className="shrink-0 text-button text-brand transition-opacity hover:opacity-80 disabled:opacity-40"
                disabled={!recording?.pdfUrl || downloading}
                onClick={downloadPdf}
              >
                {t("recording.pdf")}
              </button>
            </header>

            {previews.length ? (
              <div className="grid grid-cols-3 gap-2.5">
                {previews.slice(0, 3).map((preview) => (
                  <button
                    key={preview.page}
                    type="button"
                    className="h-17.5 overflow-hidden rounded-md bg-surface transition-opacity hover:opacity-85"
                    title={preview.title}
                    onClick={() => navigate(boardRoute)}
                  >
                    <img
                      className="size-full object-cover object-top"
                      src={preview.imageUrl}
                      alt={preview.title}
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
            ) : boardPages ? (
              <div className="grid grid-cols-3 gap-2.5">
                {Array.from({ length: Math.min(boardPages, 3) }, (_, index) => (
                  <button
                    key={index}
                    type="button"
                    className="flex h-17.5 flex-col justify-start gap-1.5 rounded-md bg-surface px-3 pt-3 text-left transition-colors hover:bg-subtle"
                    onClick={() => navigate(boardRoute)}
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

          {student ? (
            <button
              type="button"
              className="flex h-[42px] items-center justify-center rounded-full border border-line-strong bg-surface text-body-sm font-semibold text-ink transition-colors hover:bg-subtle disabled:opacity-40"
              disabled={!recording?.pdfUrl || downloading}
              onClick={downloadPdf}
            >
              {t("recording.download")}
            </button>
          ) : null}

          {student ? null : (
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
          )}

          {canManage ? (
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                className="flex h-11 items-center justify-center rounded-full bg-surface px-4 text-button text-ink transition-colors hover:bg-subtle disabled:opacity-40"
                disabled={!recording?.ready || share.isPending}
                onClick={() =>
                  share.mutate(undefined, {
                    onSuccess: () => toast.success(t("recording.sharedToChat")),
                    onError: (error: Error) => toast.error(error.message),
                  })
                }
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
