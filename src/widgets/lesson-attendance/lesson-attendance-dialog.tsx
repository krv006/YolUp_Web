import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  averageFocus,
  buildLessonRoster,
  LATE_AFTER_MINUTES,
  useAttendance,
  type RosterEntry,
  type RosterStatus,
} from "@/modules/attendance";
import { useCourseStudents } from "@/modules/course";
import { formatDayTime, formatDuration, formatMessageTime } from "@/shared/lib";
import type { Lesson } from "@/shared/types";
import { AppDialog } from "@/shared/ui/app-dialog";
import { Icon } from "@/shared/ui/icon";
import { Avatar } from "@/shared/ui/legacy";
import { RowSkeleton } from "@/shared/ui/row-skeleton";

export interface LessonAttendanceDialogProps {
  lesson: Lesson | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ROW = "flex w-full items-start gap-3 px-3.5 py-3 text-left";

const STATUS_TONE: Record<RosterStatus, string> = {
  inLesson: "bg-brand-subtle text-brand",
  present: "bg-success-bg text-success-fg",
  late: "bg-warning-bg text-warning-fg",
  absent: "bg-danger-bg text-error-text",
};

export function LessonAttendanceDialog({ lesson, open, onOpenChange }: LessonAttendanceDialogProps) {
  const { t } = useTranslation("lesson");
  const enabled = open && Boolean(lesson);
  const attendance = useAttendance({ lesson: lesson?.id ?? "", page_size: 100 }, enabled);
  const students = useCourseStudents(lesson?.courseId ?? null, { page_size: 100 }, enabled);
  const [expanded, setExpanded] = useState<string | null>(null);

  const roster = useMemo(
    () =>
      lesson
        ? buildLessonRoster(
            attendance.data ?? [],
            (students.data?.items ?? [])
              .filter((item) => item.status === "approved")
              .map((item) => item.student),
            lesson.startsAt,
            lesson.status === "live"
          )
        : [],
    [attendance.data, students.data, lesson]
  );

  const joined = roster.filter((entry) => entry.status !== "absent").length;
  const late = roster.filter((entry) => entry.lateMinutes >= LATE_AFTER_MINUTES && entry.row).length;
  const absent = roster.length - joined;
  const focus = averageFocus(attendance.data ?? []);
  const loading = attendance.isLoading || students.isLoading;

  const tiles = [
    { label: t("attendanceDetail.statJoined"), value: `${joined}/${roster.length}` },
    { label: t("attendanceDetail.statLate"), value: String(late) },
    { label: t("attendanceDetail.statAbsent"), value: String(absent) },
    { label: t("attendanceDetail.statFocus"), value: focus === null ? "—" : `${focus}%` },
  ];

  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      variant="panel"
      title={t("attendanceDetail.title")}
      description={lesson ? `${lesson.courseTitle} · ${formatDayTime(lesson.startsAt)}` : undefined}
    >
      <div className="flex flex-col gap-4 pb-4">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {tiles.map((tile) => (
            <span key={tile.label} className="flex min-w-0 flex-col gap-0.5 rounded-xl bg-subtle px-3 py-2.5">
              <strong className="font-numeric text-title text-ink">{loading ? "…" : tile.value}</strong>
              <small className="truncate text-caption text-ink-secondary">{tile.label}</small>
            </span>
          ))}
        </div>
        <p className="text-caption text-ink-tertiary">
          {t("attendanceDetail.lateHint", { count: LATE_AFTER_MINUTES })}
        </p>

        {loading ? (
          <ul className="flex flex-col" aria-hidden="true">
            {Array.from({ length: 4 }, (_, index) => (
              <li key={index} className="flex h-16 items-center border-b border-line last:border-b-0">
                <RowSkeleton />
              </li>
            ))}
          </ul>
        ) : roster.length ? (
          <ul className="flex flex-col overflow-hidden rounded-xl border border-line">
            {roster.map((entry) => (
              <RosterRow
                key={entry.student.id}
                entry={entry}
                expanded={expanded === entry.student.id}
                onToggle={() => setExpanded((current) => (current === entry.student.id ? null : entry.student.id))}
              />
            ))}
          </ul>
        ) : (
          <p className="rounded-xl bg-subtle px-4 py-6 text-center text-body-sm text-ink-secondary">
            {t("attendanceDetail.empty")}
          </p>
        )}
      </div>
    </AppDialog>
  );
}

interface RosterRowProps {
  entry: RosterEntry;
  expanded: boolean;
  onToggle: () => void;
}

function RosterRow({ entry, expanded, onToggle }: RosterRowProps) {
  const { t } = useTranslation("lesson");
  const { row, status } = entry;
  const exits = row?.focus.exits ?? 0;
  const statusLabel =
    status === "inLesson"
      ? t("attendanceDetail.statusInLesson")
      : status === "late"
        ? t("attendanceDetail.statusLate", { count: entry.lateMinutes })
        : status === "absent"
          ? t("attendanceDetail.statusAbsent")
          : t("attendanceDetail.statusPresent");

  const details = row
    ? [
        row.minutes === null
          ? t("attendanceDetail.since", { time: row.entered })
          : t("attendanceDetail.stay", { from: row.entered, to: row.exited, minutes: row.minutes }),
        row.focusPercent === null ? null : t("attendanceDetail.focus", { value: Math.round(row.focusPercent) }),
        exits
          ? t("attendanceDetail.exits", { count: exits, duration: formatDuration(row.focus.awaySeconds) })
          : t("attendanceDetail.noExits"),
        row.attentionTotal
          ? t("attendanceDetail.attention", { answered: row.attentionAnswered, total: row.attentionTotal })
          : null,
      ].filter(Boolean)
    : [];

  const content = (
    <>
      <Avatar
        name={entry.student.name}
        src={entry.student.avatarUrl ?? undefined}
        tone={entry.student.avatarTone}
        size="sm"
        className="shrink-0 [&_.avatar]:size-10"
      />
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="flex min-w-0 items-center gap-2">
          <strong className="min-w-0 flex-1 truncate text-title-sm text-ink">{entry.student.name}</strong>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-caption-strong ${STATUS_TONE[status]}`}>
            {statusLabel}
          </span>
        </span>
        {details.length ? (
          <small className="text-body-xs text-ink-secondary">{details.join(" · ")}</small>
        ) : null}
        {row?.focus.alert ? (
          <small className="flex items-center gap-1 text-caption-strong text-error-text">
            <Icon name="warning" size={14} /> {t("attendanceDetail.alert")}
          </small>
        ) : null}
      </span>
      {exits ? (
        <Icon
          name={expanded ? "expand-less" : "expand-more"}
          size={20}
          className="mt-2.5 shrink-0 text-icon-secondary"
        />
      ) : null}
    </>
  );

  return (
    <li className="border-b border-line last:border-b-0">
      {exits ? (
        <button
          type="button"
          className={`${ROW} transition-colors hover:bg-subtle`}
          aria-expanded={expanded}
          onClick={onToggle}
        >
          {content}
        </button>
      ) : (
        <div className={ROW}>{content}</div>
      )}

      {expanded && row ? (
        <div className="flex flex-col gap-2 bg-subtle px-3.5 py-3">
          <span className="flex flex-wrap gap-x-4 gap-y-1 text-body-xs text-ink-secondary">
            <span>{t("attendanceDetail.awayTotal", { duration: formatDuration(row.focus.awaySeconds) })}</span>
            <span>{t("attendanceDetail.longest", { duration: formatDuration(row.focus.longestSeconds) })}</span>
          </span>
          {row.focus.timeline.length ? (
            <ol className="flex flex-col gap-1.5">
              {row.focus.timeline.map((exit, index) => (
                <li
                  key={`${exit.leftAt}-${index}`}
                  className="flex items-center gap-3 rounded-lg bg-surface px-3 py-2 text-body-xs text-ink"
                >
                  <span className="grid size-5 shrink-0 place-items-center rounded-full bg-warning-bg text-caption-strong text-warning-fg">
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1 font-numeric">
                    {formatMessageTime(exit.leftAt)} →{" "}
                    {exit.returnedAt ? formatMessageTime(exit.returnedAt) : t("attendanceDetail.notReturned")}
                  </span>
                  <strong className="shrink-0 font-numeric">
                    {exit.seconds === null ? "—" : formatDuration(exit.seconds)}
                  </strong>
                </li>
              ))}
            </ol>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}
