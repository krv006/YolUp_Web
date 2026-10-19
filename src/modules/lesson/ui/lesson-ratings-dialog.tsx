import { useTranslation } from "react-i18next";
import { formatDateTime } from "@/shared/lib";
import type { Lesson } from "@/shared/types";
import { Avatar } from "@/shared/ui/legacy";
import { AppDialog, dialogButton } from "@/shared/ui/app-dialog";
import { useLessonRatings } from "../model/lesson.queries";
import { StarRating } from "./star-rating";

export interface LessonRatingsDialogProps {
  lesson: Lesson | null;
  onOpenChange: (open: boolean) => void;
}

export function LessonRatingsDialog({ lesson, onOpenChange }: LessonRatingsDialogProps) {
  const { t } = useTranslation("lesson");
  const ratings = useLessonRatings(lesson?.id ?? null);
  const rows = ratings.data ?? [];

  return (
    <AppDialog
      open={Boolean(lesson)}
      onOpenChange={onOpenChange}
      title={t("ratingsDialog.title")}
      description={
        lesson ? `“${lesson.title}” · ${formatDateTime(lesson.startsAt)}` : undefined
      }
      footer={
        <button type="button" className={dialogButton.primary} onClick={() => onOpenChange(false)}>
          {t("ratingsDialog.close", { defaultValue: "Yopish" })}
        </button>
      }
    >
      {lesson ? (
        <>
          <div className="flex items-center gap-4 rounded-xl bg-subtle px-5 py-4">
            <strong className="font-heading text-display text-ink">
              {lesson.avgRating === null ? "—" : lesson.avgRating.toFixed(1)}
            </strong>
            <span className="flex min-w-0 flex-col gap-1">
              <StarRating value={Math.floor(lesson.avgRating ?? 0)} readOnly size={18} />
              <small className="text-body-sm text-ink-secondary">
                {t("ratingsDialog.countSuffix", { count: lesson.ratingCount })}
              </small>
            </span>
          </div>

          {ratings.isLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 3 }, (_, index) => (
                <div key={index} className="h-14 animate-pulse rounded-xl bg-muted" />
              ))}
            </div>
          ) : ratings.data === null ? (
            <p className="py-6 text-center text-body-sm text-ink-secondary">
              {t("ratingsDialog.disabled")}
            </p>
          ) : ratings.isError ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <p className="text-body-sm text-ink-secondary">{t("ratingsDialog.loadError")}</p>
              <button
                type="button"
                className="flex h-10 items-center rounded-full bg-muted px-4 text-label-strong text-ink"
                onClick={() => ratings.refetch()}
              >
                {t("ratingsDialog.retry")}
              </button>
            </div>
          ) : rows.length ? (
            <ul className="flex flex-col divide-y divide-line overflow-hidden rounded-xl border border-line">
              {rows.map((row) => (
                <li key={row.id} className="flex items-start gap-3 px-4 py-3">
                  <Avatar name={row.studentName} size="sm" />
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <strong className="truncate text-label-strong text-ink">
                      {row.studentName}
                    </strong>
                    <span className="flex flex-wrap items-center gap-2">
                      <StarRating value={row.stars} readOnly size={14} />
                      {row.description ? (
                        <small className="text-body-sm text-ink-secondary">{row.description}</small>
                      ) : null}
                    </span>
                  </div>
                  <time className="shrink-0 text-caption text-ink-tertiary">
                    {formatDateTime(row.createdAt)}
                  </time>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-6 text-center text-body-sm text-ink-secondary">
              {t("ratingsDialog.empty")}
            </p>
          )}
        </>
      ) : null}
    </AppDialog>
  );
}
