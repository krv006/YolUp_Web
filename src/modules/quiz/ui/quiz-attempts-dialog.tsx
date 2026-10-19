import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useCourseStudents } from "@/modules/course";
import { Avatar } from "@/shared/ui/legacy";
import { AppDialog, dialogButton } from "@/shared/ui/app-dialog";
import { useQuizAttempts } from "../model/quiz.queries";

export interface QuizAttemptsDialogProps {
  quizId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  courseId?: string | null;
}

function scoreTone(score: number, maxScore: number): string {
  if (!maxScore) return "bg-subtle text-ink-secondary";
  const percent = (score / maxScore) * 100;
  if (percent >= 70) return "bg-success-bg text-success-text";
  if (percent >= 50) return "bg-action-subtle text-action";
  return "bg-saffron-subtle text-saffron-strong";
}

export function QuizAttemptsDialog({
  quizId,
  open,
  onOpenChange,
  title,
  courseId = null,
}: QuizAttemptsDialogProps) {
  const { t } = useTranslation("quiz");
  const { t: tl } = useTranslation("lesson");
  const attempts = useQuizAttempts(quizId, open);
  const students = useCourseStudents(open ? courseId : null, { page_size: 100 });
  const months = tl("list.months", { returnObjects: true }) as string[];

  function formatMoment(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const time = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
    return `${date.getDate()}-${(months[date.getMonth()] ?? "").toLowerCase()}, ${time}`;
  }

  const rows = useMemo(() => {
    const list = [...(attempts.data ?? [])].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    const seen = new Map<string, number>();
    const withOrder = list.map((attempt) => {
      const order = (seen.get(attempt.studentId) ?? 0) + 1;
      seen.set(attempt.studentId, order);
      return { ...attempt, order };
    });
    return withOrder.reverse();
  }, [attempts.data]);

  const missing = useMemo(() => {
    const attempted = new Set(rows.map((row) => row.studentId));
    return (students.data?.items ?? [])
      .map((item) => item.student)
      .filter((student) => !attempted.has(student.id));
  }, [rows, students.data]);

  function download() {
    const header = [t("attemptsDialog.csvName"), t("attemptsDialog.csvDate"), t("attemptsDialog.csvScore")];
    const lines = rows.map((row) => [
      row.studentName,
      formatMoment(row.createdAt),
      `${row.score}/${row.maxScore}`,
    ]);
    const csv = [header, ...lines]
      .map((cells) => cells.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${title ?? "quiz"}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title ?? t("attemptsDialog.defaultTitle")}
      description={t("attemptsDialog.description")}
      footer={
        <>
          <button type="button" className={dialogButton.secondary} onClick={() => onOpenChange(false)}>
            {t("attemptsDialog.close")}
          </button>
          <button
            type="button"
            className={dialogButton.primary}
            disabled={!rows.length}
            onClick={download}
          >
            {t("attemptsDialog.download")}
          </button>
        </>
      }
    >
      {attempts.isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="h-14 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : rows.length || missing.length ? (
        <ul className="flex flex-col divide-y divide-line">
          {rows.map((row) => (
            <li key={row.id} className="flex items-center gap-3 py-3">
              <Avatar name={row.studentName} size="sm" />
              <span className="flex min-w-0 flex-1 flex-col">
                <strong className="truncate text-label-strong text-ink">{row.studentName}</strong>
                <small className="truncate text-caption text-ink-tertiary">
                  {formatMoment(row.createdAt)}
                  {row.order > 1 ? ` · ${t("attemptsDialog.attemptNo", { count: row.order })}` : ""}
                </small>
              </span>
              <span
                className={`flex h-8 shrink-0 items-center rounded-full px-3 font-numeric text-label-strong ${scoreTone(row.score, row.maxScore)}`}
              >
                {row.score}/{row.maxScore}
              </span>
            </li>
          ))}

          {missing.map((student) => (
            <li key={student.id} className="flex items-center gap-3 py-3">
              <Avatar name={student.name} tone={student.avatarTone} size="sm" />
              <span className="flex min-w-0 flex-1 flex-col">
                <strong className="truncate text-label-strong text-ink">{student.name}</strong>
                <small className="truncate text-caption text-ink-tertiary">
                  {t("attemptsDialog.notAttempted")}
                </small>
              </span>
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-subtle text-ink-tertiary">
                —
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="py-6 text-center text-body-sm text-ink-secondary">
          {t("attemptsDialog.empty")}
        </p>
      )}
    </AppDialog>
  );
}
