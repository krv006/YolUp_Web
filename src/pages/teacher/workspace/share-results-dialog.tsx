import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useShareQuizResults } from "@/modules/quiz";
import { useIsCompact } from "@/shared/hooks/use-media-query";
import { AppDialog, dialogButton } from "@/shared/ui/app-dialog";
import { Switch } from "@/shared/ui/switch";

export interface ShareResultsDialogProps {
  quizId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShareResultsDialog({ quizId, open, onOpenChange }: ShareResultsDialogProps) {
  const { t } = useTranslation("quiz");
  const share = useShareQuizResults();
  const isCompact = useIsCompact();
  const [parents, setParents] = useState(false);

  function confirm() {
    share.mutate(
      { quizId, parents },
      {
        onSuccess: (result) => {
          toast.success(
            parents
              ? t("results.shareDoneParents", { count: result.parents_notified ?? 0 })
              : t("results.shareDone")
          );
          onOpenChange(false);
        },
        onError: (error) => toast.error(error.message),
      }
    );
  }

  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      variant={isCompact ? "adaptive" : "confirm"}
      width="lg:w-120"
      title={t("results.shareTitle")}
      description={t("results.shareHint")}
      footer={
        <>
          <button type="button" className={dialogButton.secondary} onClick={() => onOpenChange(false)}>
            {t("results.shareCancel")}
          </button>
          <button type="button" className={dialogButton.primary} disabled={share.isPending} onClick={confirm}>
            {t("results.shareConfirm")}
          </button>
        </>
      }
    >
      <label className="flex items-center gap-3 rounded-xl border border-line px-4 py-3">
        <span className="flex min-w-0 flex-1 flex-col">
          <strong className="text-label-strong text-ink">{t("results.shareParents")}</strong>
          <small className="text-caption text-ink-tertiary">{t("results.shareParentsHint")}</small>
        </span>
        <Switch checked={parents} onCheckedChange={setParents} aria-label={t("results.shareParents")} />
      </label>
    </AppDialog>
  );
}
