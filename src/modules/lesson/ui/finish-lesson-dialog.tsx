import { LogOut } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Lesson } from "@/shared/types";
import { AppDialog, dialogButton } from "@/shared/ui/app-dialog";
import { useFinishLesson } from "../model/lesson.queries";

export interface FinishLessonDialogProps {
  lesson: Lesson | null;
  onOpenChange: (open: boolean) => void;
  onFinished?: () => void;
  /** Berilsa — "Faqat chiqish" tugmasi ko'rinadi va dars davom etadi. */
  onLeaveOnly?: () => void;
}

export function FinishLessonDialog({
  lesson,
  onOpenChange,
  onFinished,
  onLeaveOnly,
}: FinishLessonDialogProps) {
  const { t } = useTranslation("lesson");
  const finish = useFinishLesson();

  function submit() {
    if (!lesson) return;
    finish.mutate(
      { id: lesson.id },
      {
        onSuccess: () => {
          onOpenChange(false);
          onFinished?.();
        },
      }
    );
  }

  return (
    <AppDialog
      open={Boolean(lesson)}
      onOpenChange={onOpenChange}
      variant="confirm"
      icon={
        <span className="grid size-11 place-items-center rounded-2xl bg-error-bg text-error-text">
          <LogOut size={20} />
        </span>
      }
      title={t("finishDialog.title")}
      description={t("finishDialog.description", { title: lesson?.title ?? "" })}
      footer={
        <>
          <button
            type="button"
            className={dialogButton.secondary}
            onClick={() => {
              onOpenChange(false);
              onLeaveOnly?.();
            }}
          >
            {onLeaveOnly ? t("finishDialog.leaveOnly") : t("finishDialog.cancel")}
          </button>
          <button
            type="button"
            className={dialogButton.danger}
            disabled={finish.isPending}
            onClick={submit}
          >
            {t("finishDialog.confirm")}
          </button>
        </>
      }
    />
  );
}
