import { useTranslation } from "react-i18next";
import { useLessonRatings } from "@/modules/lesson";
import { useIsCompact } from "@/shared/hooks/use-media-query";
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
  const isCompact = useIsCompact();
  const average =
    lesson?.avgRating ??
    (rows.length ? rows.reduce((sum, row) => sum + row.stars, 0) / rows.length : null);

  if (isCompact)
    return (
      <AppDialog
        open={Boolean(lesson)}
        onOpenChange={onOpenChange}
        variant="adaptive"
        title={t("ratingsDialog.title")}
        description={t("ratingsDialog.description", { title: lesson?.courseTitle ?? "" })}
        footerClassName="px-4 pt-9 pb-6"
        footer={
          <button
            type="button"
            className={`${dialogButton.primary} h-13 w-full text-title font-semibold`}
            onClick={() => onOpenChange(false)}
          >
            {t("schedule.close")}
          </button>
        }
      >
        <div className="flex flex-col gap-4.5">
          <div className="flex h-20 items-center gap-4 rounded-lg bg-subtle px-4">
            <strong className="font-heading text-[36px]/[44px] font-medium text-ink">
              {average === null ? "—" : average.toFixed(1).replace(".", ",")}
            </strong>
            <span className="flex min-w-0 flex-1 flex-col gap-1">
              <Stars value={average === null ? 0 : Math.round(average)} size={20} />
              <small className="truncate text-caption text-ink-secondary">
                {t("ratingsDialog.count", { count: lesson?.ratingCount || rows.length })}
              </small>
            </span>
          </div>

          <div className="flex flex-col gap-8">
            {rows.map((row) => (
              <div key={row.id} className="flex flex-col">
                <span className="flex items-center gap-2.5">
                  <Avatar name={row.studentName} size="sm" className="shrink-0 [&_.avatar]:size-8" />
                  <strong className="min-w-0 flex-1 truncate text-body-sm font-semibold text-ink">
                    {row.studentName}
                  </strong>
                  <Stars value={row.stars} size={14} />
                </span>
                {row.description ? (
                  <p className="mt-1.5 text-body-sm text-ink">{row.description}</p>
                ) : null}
                <small className="mt-1.5 text-caption text-ink-secondary">{clock(row.createdAt)}</small>
              </div>
            ))}

            {!ratings.isLoading && !rows.length ? (
              <p className="py-6 text-center text-body-sm text-ink-secondary">{t("ratingsDialog.empty")}</p>
            ) : null}
          </div>
        </div>
      </AppDialog>
    );

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

function Stars({ value, size }: { value: number; size: number }) {
  return (
    <span className="flex shrink-0 items-center gap-0.5 text-saffron-strong">
      {Array.from({ length: 5 }, (_, index) => (
        <Icon key={index} name="star" size={size} className={index < value ? "" : "text-line-strong"} />
      ))}
    </span>
  );
}
