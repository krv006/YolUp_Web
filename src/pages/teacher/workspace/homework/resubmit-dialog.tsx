import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AppDialog, dialogButton } from "@/shared/ui/app-dialog";

export interface ResubmitDialogProps {
  open: boolean;
  student: string;
  pending?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (comment: string) => void;
}

export function ResubmitDialog({
  open,
  student,
  pending = false,
  onOpenChange,
  onConfirm,
}: ResubmitDialogProps) {
  const { t } = useTranslation("homework");
  const [comment, setComment] = useState("");

  return (
    <AppDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setComment("");
        onOpenChange(next);
      }}
      variant="confirm"
      title={t("resubmitDialog.title")}
      description={t("resubmitDialog.description", { student })}
      footer={
        <div className="grid w-full grid-cols-2 gap-3">
          <button
            type="button"
            className={dialogButton.secondary}
            onClick={() => onOpenChange(false)}
          >
            {t("resubmitDialog.cancel")}
          </button>
          <button
            type="button"
            className={dialogButton.primary}
            disabled={pending || !comment.trim()}
            onClick={() => onConfirm(comment.trim())}
          >
            {t("resubmitDialog.submit")}
          </button>
        </div>
      }
    >
      <label className="flex flex-col gap-2">
        <span className="text-body-xs text-ink-secondary">{t("resubmitDialog.comment")}</span>
        <textarea
          autoFocus
          className="min-h-27 w-full resize-none rounded-md border border-transparent bg-subtle px-4 py-3 text-body text-ink outline-none placeholder:text-ink-tertiary focus:border-focus focus:bg-surface"
          value={comment}
          placeholder={t("resubmitDialog.placeholder")}
          onChange={(event) => setComment(event.target.value)}
        />
      </label>
    </AppDialog>
  );
}
