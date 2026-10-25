import { LogOut } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Lesson } from "@/shared/types";
import { AppDialog } from "@/shared/ui/app-dialog";
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
      width="lg:w-120"
      icon={
        <span className="grid size-12 place-items-center rounded-md bg-danger-bg text-danger">
          <LogOut size={22} />
        </span>
      }
      title={t("finishDialog.title")}
      description={t("finishDialog.description", { title: lesson?.title ?? "" })}
      footer={
        <>
          <span className="min-w-0 flex-1" />
          <button
            type="button"
            className="flex h-11 shrink-0 items-center justify-center rounded-full border border-line bg-surface px-5 text-button text-ink transition-colors hover:bg-subtle"
            onClick={() => {
              onOpenChange(false);
              onLeaveOnly?.();
            }}
          >
            {onLeaveOnly ? t("finishDialog.leaveOnly") : t("finishDialog.cancel")}
          </button>
          <button
            type="button"
            className="flex h-11 shrink-0 items-center justify-center rounded-full bg-danger-bg px-5 text-button text-danger transition-opacity hover:opacity-85 disabled:opacity-50"
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
