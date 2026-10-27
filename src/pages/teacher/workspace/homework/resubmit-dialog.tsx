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
      variant="adaptive"
      title={t("resubmitDialog.title")}
      description={t("resubmitDialog.description", { student })}
      footer={
        <div className="grid w-full grid-cols-2 gap-3">
          <button
            type="button"
            className={`${dialogButton.secondary} max-lg:h-13 max-lg:text-title max-lg:font-semibold`}
            onClick={() => onOpenChange(false)}
          >
            {t("resubmitDialog.cancel")}
          </button>
          <button
            type="button"
            className={`${dialogButton.primary} max-lg:h-13 max-lg:text-title max-lg:font-semibold`}
            disabled={pending || !comment.trim()}
            onClick={() => onConfirm(comment.trim())}
          >
            {t("resubmitDialog.submit")}
          </button>
        </div>
      }
    >
      <label className="flex flex-col gap-2 max-lg:-mt-0.5">
        <span className="text-body-xs text-ink-secondary max-lg:text-body-sm max-lg:leading-4.5 max-lg:text-ink">{t("resubmitDialog.comment")}</span>
        <textarea
          autoFocus
          className="min-h-27 w-full resize-none rounded-md border border-transparent bg-subtle px-4 py-3 text-body text-ink outline-none placeholder:text-ink-tertiary focus:border-focus focus:bg-surface max-lg:h-28 max-lg:rounded-lg max-lg:border-[1.5px] max-lg:placeholder:text-ink-secondary max-lg:focus:bg-subtle"
          value={comment}
          placeholder={t("resubmitDialog.placeholder")}
          onChange={(event) => setComment(event.target.value)}
        />
      </label>
    </AppDialog>
  );
}
