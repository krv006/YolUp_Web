import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import type { Lesson } from "@/shared/types";
import { AppDialog, dialogButton } from "@/shared/ui/app-dialog";
import { Icon } from "@/shared/ui/icon";
import { useCancelLesson } from "../model/lesson.queries";

export function CancelLessonDialog({
  lesson,
  onOpenChange,
  onCancelled,
}: {
  lesson: Lesson | null;
  onOpenChange: (open: boolean) => void;
  onCancelled?: () => void;
}) {
  const { t } = useTranslation("lesson");
  const cancelLesson = useCancelLesson();
  const [scope, setScope] = useState<"one" | "series">("one");

  return (
    <AppDialog
      open={Boolean(lesson)}
      onOpenChange={(open) => {
        if (!open) setScope("one");
        onOpenChange(open);
      }}
      variant="confirm"
      icon={
        <span className="grid size-11 place-items-center rounded-full bg-error-bg text-error-text">
          <Icon name="trash" size={20} />
        </span>
      }
      title={t("schedule.cancelTitle")}
      description={t("schedule.cancelDescription")}
      footer={
        <>
          <button type="button" className={dialogButton.secondary} onClick={() => onOpenChange(false)}>
            {t("schedule.keep")}
          </button>
          <button
            type="button"
            className={dialogButton.danger}
            disabled={!lesson || cancelLesson.isPending}
            onClick={() => {
              if (!lesson) return;
              cancelLesson.mutate(
                { id: lesson.id, scope: lesson.recurrenceId ? scope : "one" },
                {
                  onSuccess: (count) => {
                    toast.success(t("schedule.cancelled", { count }));
                    setScope("one");
                    onOpenChange(false);
                    onCancelled?.();
                  },
                  onError: (error: Error) => toast.error(error.message),
                }
              );
            }}
          >
            {t("schedule.cancelConfirm")}
          </button>
        </>
      }
    >
      {lesson?.recurrenceId ? (
        <div className="flex flex-col gap-2" role="radiogroup">
          {(["one", "series"] as const).map((item) => (
            <button
              key={item}
              type="button"
              role="radio"
              aria-checked={scope === item}
              className={`flex items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-colors ${
                scope === item ? "border-action bg-action-subtle" : "border-line bg-surface"
              }`}
              onClick={() => setScope(item)}
            >
              <span
                className={`grid size-5 shrink-0 place-items-center rounded-full border-2 ${
                  scope === item ? "border-action" : "border-line"
                }`}
              >
                {scope === item ? <span className="size-2.5 rounded-full bg-action" /> : null}
              </span>
              <span className="text-label-strong text-ink">{t(`schedule.cancelScope.${item}`)}</span>
            </button>
          ))}
        </div>
      ) : null}
    </AppDialog>
  );
}
