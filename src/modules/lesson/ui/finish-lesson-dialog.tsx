import { useState } from "react";
import { LogOut } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useIsCompact } from "@/shared/hooks/use-media-query";
import type { Lesson } from "@/shared/types";
import { AppDialog } from "@/shared/ui/app-dialog";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
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
  const isCompact = useIsCompact();
  const [postRecording, setPostRecording] = useState(true);

  const postToggle = (
    <label className="flex w-full items-start gap-3 rounded-md bg-subtle px-4 py-3 text-left">
      <input
        type="checkbox"
        className="mt-0.5 size-4.5 shrink-0 accent-brand"
        checked={postRecording}
        onChange={(event) => setPostRecording(event.target.checked)}
      />
      <span className="flex min-w-0 flex-col">
        <span className="text-body-sm font-medium text-ink">{t("finishDialog.postRecording")}</span>
        <small className="text-caption text-ink-secondary">
          {postRecording ? t("finishDialog.postRecordingHint") : t("finishDialog.keepRecordingHint")}
        </small>
      </span>
    </label>
  );

  function submit() {
    if (!lesson) return;
    finish.mutate(
      { id: lesson.id, postRecording },
      {
        onSuccess: () => {
          onOpenChange(false);
          onFinished?.();
        },
      }
    );
  }

  if (isCompact)
    return (
      <ConfirmDialog
        open={Boolean(lesson)}
        onOpenChange={onOpenChange}
        tone="brand"
        icon="logout"
        title={t("finishDialog.title")}
        description={t("finishDialog.mobileDescription")}
        confirmLabel={t("finishDialog.confirm")}
        cancelLabel={onLeaveOnly ? t("finishDialog.leaveOnly") : t("finishDialog.cancel")}
        pending={finish.isPending}
        onConfirm={submit}
        onCancel={onLeaveOnly}
      >
        {postToggle}
      </ConfirmDialog>
    );

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
    >
      {postToggle}
    </AppDialog>
  );
}
