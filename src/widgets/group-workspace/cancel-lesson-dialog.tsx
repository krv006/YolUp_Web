import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ModalCard, modalButton } from "@/shared/ui/modal-card";
import type { Lesson } from "@/shared/types";

export type CancelLessonScope = "single" | "following";

export interface CancelLessonDialogProps {
  lesson: Lesson | null;
  pending?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (lesson: Lesson, scope: CancelLessonScope) => void;
}

export function CancelLessonDialog({
  lesson,
  pending,
  onOpenChange,
  onConfirm,
}: CancelLessonDialogProps) {
  const { t } = useTranslation(["group", "lesson"]);
  const [scope, setScope] = useState<CancelLessonScope>("single");
  const months = t("lesson:list.months", { returnObjects: true }) as string[];

  const starts = lesson ? new Date(lesson.startsAt) : null;
  const when =
    starts && !Number.isNaN(starts.getTime())
      ? `${starts.getDate()}-${(months[starts.getMonth()] ?? "").toLowerCase()}, ${String(
          starts.getHours()
        ).padStart(2, "0")}:${String(starts.getMinutes()).padStart(2, "0")}`
      : "";

  const options: Array<{ id: CancelLessonScope; label: string }> = [
    { id: "single", label: t("group:cancelLesson.onlyThis", { when }) },
    { id: "following", label: t("group:cancelLesson.thisAndNext") },
  ];

  return (
    <ModalCard
      open={Boolean(lesson)}
      onOpenChange={(next) => {
        if (!next) setScope("single");
        onOpenChange(next);
      }}
      title={t("group:cancelLesson.title")}
      description={t("group:cancelLesson.description")}
      footer={
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            className={modalButton.secondary}
            onClick={() => onOpenChange(false)}
          >
            {t("group:cancelLesson.close")}
          </button>
          <button
            type="button"
            className={modalButton.danger}
            disabled={pending}
            onClick={() => lesson && onConfirm(lesson, scope)}
          >
            {t("group:cancelLesson.confirm")}
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        {options.map((option) => {
          const active = scope === option.id;
          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={active}
              className={`flex h-12.5 items-center gap-3.5 rounded-md px-4.5 text-left text-body transition-colors ${
                active ? "border border-brand bg-brand-subtle text-ink" : "bg-subtle text-ink"
              }`}
              onClick={() => setScope(option.id)}
            >
              <span
                className={`grid size-5 shrink-0 place-items-center rounded-full ${
                  active ? "bg-brand" : "border-2 border-line-strong bg-surface"
                }`}
              >
                {active ? <i className="size-2.5 rounded-full bg-surface not-italic" /> : null}
              </span>
              <span className="min-w-0 flex-1 truncate">{option.label}</span>
            </button>
          );
        })}
      </div>
    </ModalCard>
  );
}
