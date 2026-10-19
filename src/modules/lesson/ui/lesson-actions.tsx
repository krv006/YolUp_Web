import { Play, Star } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Icon } from "@/shared/ui/icon";
import type { Lesson } from "@/shared/types";
import {
  hasLessonTopic,
  isLessonClosed,
  isLessonEditable,
  isLessonJoinable,
} from "../lib/lesson-status";

export interface LessonActionsProps {
  lesson: Lesson;
  onJoin: (lesson: Lesson) => void;
  onFinish?: (lesson: Lesson) => void;
  onEdit?: (lesson: Lesson) => void;
  onDelete?: (lesson: Lesson) => void;
  onRatings?: (lesson: Lesson) => void;
  onRecording?: (lesson: Lesson) => void;
  onRate?: (lesson: Lesson) => void;
  compact?: boolean;
}

const PRIMARY =
  "flex h-11 items-center justify-center gap-2 rounded-xl bg-action px-4 text-label-strong text-on-action transition-colors hover:bg-action-hover disabled:opacity-50";
const OUTLINE =
  "flex h-11 items-center justify-center gap-2 rounded-xl border border-line bg-surface px-4 text-label-strong text-ink transition-colors hover:bg-subtle";
const ICON_BUTTON =
  "grid size-11 shrink-0 place-items-center rounded-xl bg-subtle transition-colors hover:bg-muted";
const ICON_NEUTRAL = "text-ink-secondary";
const ICON_DANGER = "text-error-text";

export function LessonActions({
  lesson,
  onJoin,
  onFinish,
  onEdit,
  onDelete,
  onRatings,
  onRecording,
  onRate,
  compact = false,
}: LessonActionsProps) {
  const { t } = useTranslation("lesson");
  const finished = lesson.status === "finished";
  const missingTopic = !hasLessonTopic(lesson);
  const joinDisabled = missingTopic || !isLessonJoinable(lesson);
  const canEdit = Boolean(onEdit) && isLessonEditable(lesson);
  const planned = lesson.status === "scheduled" && canEdit;

  const ratingChip =
    finished && (onRatings || lesson.ratingCount > 0) ? (
      <>
        <Star size={15} className="fill-saffron-strong text-saffron-strong" />
        {lesson.avgRating === null ? "—" : lesson.avgRating.toFixed(1)}
        {compact ? null : (
          <small className="text-ink-tertiary">
            {t("list.dayCount", { count: lesson.ratingCount })}
          </small>
        )}
      </>
    ) : null;

  return (
    <div className={`flex items-center gap-2 ${compact ? "" : "flex-wrap"}`}>
      {ratingChip && onRatings ? (
        <button
          type="button"
          className="flex h-11 items-center gap-1.5 rounded-xl bg-saffron-subtle px-3 font-numeric text-label-strong text-ink"
          onClick={() => onRatings(lesson)}
          aria-label={t("actions.ratingsAria", { count: lesson.ratingCount })}
        >
          {ratingChip}
        </button>
      ) : ratingChip ? (
        <span className="flex h-11 items-center gap-1.5 rounded-xl bg-saffron-subtle px-3 font-numeric text-label-strong text-ink">
          {ratingChip}
        </span>
      ) : null}

      {finished ? (
        onRecording ? (
          <button type="button" className={PRIMARY} onClick={() => onRecording(lesson)}>
            <Play size={15} className="fill-current" />
            {compact ? null : t("actions.view")}
          </button>
        ) : null
      ) : planned ? (
        <>
          <button type="button" className={`${OUTLINE} flex-1`} onClick={() => onEdit?.(lesson)}>
            <Icon name="edit" size={17} />
            {compact ? null : t("actions.edit")}
          </button>
          {onDelete ? (
            <button type="button" className={`${OUTLINE} flex-1`} onClick={() => onDelete(lesson)}>
              <Icon name="add" size={17} className="rotate-45" />
              {compact ? null : t("actions.cancel")}
            </button>
          ) : null}
        </>
      ) : (
        <button
          type="button"
          className={`${PRIMARY} flex-1`}
          disabled={joinDisabled}
          title={
            missingTopic
              ? t("actions.joinNeedsTopic")
              : joinDisabled && !isLessonClosed(lesson)
                ? t("actions.joinDisabledTitle")
                : undefined
          }
          onClick={() => onJoin(lesson)}
        >
          <Icon name="volume" size={17} />
          {compact ? null : t("actions.joinLesson")}
        </button>
      )}

      {lesson.status === "live" && onFinish ? (
        <button type="button" className={OUTLINE} onClick={() => onFinish(lesson)}>
          {t("actions.finish")}
        </button>
      ) : null}

      {finished && onRate ? (
        <button type="button" className={OUTLINE} onClick={() => onRate(lesson)}>
          <Star size={17} />
          {compact ? null : t("actions.rate")}
        </button>
      ) : null}

      {finished && canEdit ? (
        <button
          className={`${ICON_BUTTON} ${ICON_NEUTRAL}`}
          onClick={() => onEdit?.(lesson)}
          aria-label={t("actions.editAria")}
        >
          <Icon name="edit" size={17} />
        </button>
      ) : null}

      {finished && onDelete ? (
        <button
          className={`${ICON_BUTTON} ${ICON_DANGER}`}
          onClick={() => onDelete(lesson)}
          aria-label={t("actions.deleteAria")}
        >
          <Icon name="trash" size={17} />
        </button>
      ) : null}
    </div>
  );
}
