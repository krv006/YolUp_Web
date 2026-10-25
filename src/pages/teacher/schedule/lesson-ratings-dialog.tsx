import { useTranslation } from "react-i18next";
import { useLessonRatings } from "@/modules/lesson";
import { AppDialog, dialogButton } from "@/shared/ui/app-dialog";
import { Avatar } from "@/shared/ui/legacy";
import { Icon } from "@/shared/ui/icon";
import type { Lesson } from "@/shared/types";

export interface LessonRatingsDialogProps {
  lesson: Lesson | null;
  onOpenChange: (open: boolean) => void;
}

function clock(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export function LessonRatingsDialog({ lesson, onOpenChange }: LessonRatingsDialogProps) {
  const { t } = useTranslation("lesson");
  const ratings = useLessonRatings(lesson?.id ?? null, Boolean(lesson));
  const rows = ratings.data ?? [];
  const average =
    lesson?.avgRating ??
    (rows.length ? rows.reduce((sum, row) => sum + row.stars, 0) / rows.length : null);

  return (
    <AppDialog
      open={Boolean(lesson)}
      onOpenChange={onOpenChange}
      variant="confirm"
      title={t("ratingsDialog.title")}
      description={t("ratingsDialog.description", { title: lesson?.courseTitle ?? "" })}
      footer={
        <button type="button" className={dialogButton.primary} onClick={() => onOpenChange(false)}>
          {t("schedule.close")}
        </button>
      }
    >
      <div className="flex items-center gap-4 rounded-md bg-subtle px-5 py-4">
        <strong className="font-heading text-display text-ink">
          {average === null ? "—" : average.toFixed(1).replace(".", ",")}
        </strong>
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="flex items-center gap-0.5 text-saffron-strong">
            {Array.from({ length: 5 }, (_, index) => (
              <Icon
                key={index}
                name="star"
                size={16}
                className={average !== null && index < Math.round(average) ? "" : "text-line-strong"}
              />
            ))}
          </span>
          <small className="truncate text-body-xs text-ink-tertiary">
            {t("ratingsDialog.count", { count: rows.length })}
          </small>
        </span>
      </div>

      <div className="flex flex-col gap-4">
        {rows.map((row) => (
          <span key={row.id} className="flex gap-3">
            <Avatar name={row.studentName} size="sm" />
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="flex items-center gap-2">
                <strong className="min-w-0 flex-1 truncate text-title-sm text-ink">
                  {row.studentName}
                </strong>
                <span className="flex shrink-0 items-center gap-0.5 text-saffron-strong">
                  {Array.from({ length: 5 }, (_, index) => (
                    <Icon
                      key={index}
                      name="star"
                      size={13}
                      className={index < row.stars ? "" : "text-line-strong"}
                    />
                  ))}
                </span>
              </span>
              {row.description ? (
                <small className="text-body-sm text-ink-secondary">{row.description}</small>
              ) : null}
              <small className="text-body-xs text-ink-tertiary">{clock(row.createdAt)}</small>
            </span>
          </span>
        ))}

        {!ratings.isLoading && !rows.length ? (
          <p className="py-6 text-center text-body-sm text-ink-tertiary">
            {t("ratingsDialog.empty")}
          </p>
        ) : null}
      </div>
    </AppDialog>
  );
}
