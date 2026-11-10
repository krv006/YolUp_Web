import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { AppDialog, dialogButton } from "@/shared/ui/app-dialog";
import type { SpamReason } from "../api/conversation.dto";
import { useReportConversation } from "../model/use-conversations";

const REASONS: SpamReason[] = ["insult", "harassment", "advertising", "other"];
const MAX_COMMENT = 500;

export interface ReportConversationDialogProps {
  roomId: string;
  name: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReported?: () => void;
}

export function ReportConversationDialog({ roomId, name, open, onOpenChange, onReported }: ReportConversationDialogProps) {
  const { t } = useTranslation("chat");
  const report = useReportConversation();
  const [reason, setReason] = useState<SpamReason>("insult");
  const [comment, setComment] = useState("");

  function close() {
    setReason("insult");
    setComment("");
    onOpenChange(false);
  }

  function submit() {
    report.mutate(
      { roomId, reason, comment },
      {
        onSuccess: () => {
          toast.success(t("report.sent"));
          close();
          onReported?.();
        },
        onError: (error: Error) => toast.error(error.message),
      }
    );
  }

  return (
    <AppDialog
      open={open}
      onOpenChange={(next) => (next ? onOpenChange(true) : close())}
      variant="adaptive"
      width="lg:max-w-110"
      title={t("report.title")}
      description={t("report.description", { name })}
      footer={
        <>
          <button type="button" className={dialogButton.secondary} onClick={close}>
            {t("report.cancel")}
          </button>
          <button type="button" className={dialogButton.danger} disabled={report.isPending} onClick={submit}>
            {t("report.submit")}
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <fieldset className="flex flex-col overflow-hidden rounded-xl border border-line">
          <legend className="sr-only">{t("report.reasonLabel")}</legend>
          {REASONS.map((item) => (
            <label
              key={item}
              className="flex min-h-12 cursor-pointer items-center gap-3 border-b border-line px-4 py-2.5 last:border-b-0 has-[:checked]:bg-brand-subtle"
            >
              <input
                type="radio"
                name="report-reason"
                className="size-4.5 shrink-0 accent-brand"
                checked={reason === item}
                onChange={() => setReason(item)}
              />
              <span className="text-body text-ink">{t(`report.reasons.${item}`)}</span>
            </label>
          ))}
        </fieldset>
        <label className="flex flex-col gap-2">
          <span className="text-body-xs text-ink-secondary">{t("report.commentLabel")}</span>
          <textarea
            rows={3}
            maxLength={MAX_COMMENT}
            className="w-full resize-none rounded-md border border-transparent bg-subtle px-4 py-3 text-body text-ink outline-none placeholder:text-ink-tertiary focus:border-focus focus:bg-surface"
            placeholder={t("report.commentPlaceholder")}
            value={comment}
            onChange={(event) => setComment(event.target.value)}
          />
        </label>
        <p className="rounded-md bg-danger-bg px-4 py-3 text-body-sm text-danger">{t("report.warning")}</p>
      </div>
    </AppDialog>
  );
}
