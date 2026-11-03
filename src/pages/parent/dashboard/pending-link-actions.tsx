import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { parentFamily, retryMinutes, useCancelLink, useRemindLink, type ParentLink } from "@/modules/parent";
import { formatLocalized } from "@/shared/lib";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { Icon } from "@/shared/ui/icon";

export function PendingLinkActions({ link, layout = "block" }: { link: ParentLink; layout?: "block" | "inline" }) {
  const { t } = useTranslation("parent");
  const [now] = useState(() => Date.now());
  const [cancelling, setCancelling] = useState(false);
  const remind = useRemindLink();
  const cancel = useCancelLink();
  const name = link.student.name.split(" ")[0] || link.student.name;
  const reminded = remind.isSuccess || parentFamily.remindedRecently(link.remindedAt, now);

  function sendReminder() {
    remind.mutate(link.id, {
      onSuccess: () => toast.success(t("pendingActions.remindDone", { name })),
      onError: (error) => {
        const minutes = retryMinutes(error);
        if (minutes === null) {
          toast.error(t("pendingActions.failed"));
          return;
        }
        const time =
          minutes >= 60 ? t("pendingActions.retryHours", { count: Math.ceil(minutes / 60) }) : t("pendingActions.retryMinutes", { count: minutes });
        toast.info(t("pendingActions.remindLimit", { time }));
      },
    });
  }

  const remindButton = (
    <button
      type="button"
      disabled={reminded || remind.isPending}
      className={
        layout === "block"
          ? "flex h-11 min-w-0 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-brand-subtle px-3 text-button text-brand transition-opacity hover:opacity-85 disabled:opacity-60"
          : "flex h-9 items-center gap-1.5 rounded-full bg-brand-subtle px-3 text-caption-strong text-brand transition-opacity hover:opacity-85 disabled:opacity-60"
      }
      onClick={(event) => {
        event.stopPropagation();
        sendReminder();
      }}
    >
      <Icon name={reminded ? "check" : "notifications-active"} size={layout === "block" ? 20 : 16} />
      {t(reminded ? "pendingActions.reminded" : "pendingActions.remind")}
    </button>
  );

  const cancelButton = (
    <button
      type="button"
      disabled={cancel.isPending}
      className={
        layout === "block"
          ? "flex h-11 min-w-0 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-full border border-line-strong bg-surface px-3 text-button text-error-text transition-colors hover:bg-danger-bg disabled:opacity-60"
          : "flex h-9 items-center gap-1.5 rounded-full px-3 text-caption-strong text-error-text transition-colors hover:bg-danger-bg disabled:opacity-60"
      }
      onClick={(event) => {
        event.stopPropagation();
        setCancelling(true);
      }}
    >
      <Icon name="close" size={layout === "block" ? 20 : 16} />
      {t("pendingActions.cancel")}
    </button>
  );

  return (
    <>
      {layout === "block" ? (
        <div className="flex w-full flex-col gap-3">
          {link.expiresAt ? (
            <small className="flex items-center gap-2 text-body-xs text-ink-secondary">
              <Icon name="hourglass-empty" size={16} className="shrink-0 text-icon-tertiary" />
              {t("pendingActions.expires", { date: formatLocalized(link.expiresAt, "d MMMM") })}
            </small>
          ) : null}
          <div className="flex gap-2">
            {remindButton}
            {cancelButton}
          </div>
        </div>
      ) : (
        <span className="flex flex-wrap items-center justify-center gap-1">
          {remindButton}
          {cancelButton}
        </span>
      )}
      <ConfirmDialog
        alert
        open={cancelling}
        onOpenChange={setCancelling}
        icon="link-off"
        title={t("pendingActions.cancelTitle")}
        description={t("pendingActions.cancelText", { name })}
        confirmLabel={t("pendingActions.cancelConfirm")}
        cancelLabel={t("pendingActions.cancelKeep")}
        pending={cancel.isPending}
        onConfirm={() =>
          cancel.mutate(link.id, {
            onSuccess: () => {
              setCancelling(false);
              toast.success(t("pendingActions.cancelDone"));
            },
            onError: () => toast.error(t("pendingActions.failed")),
          })
        }
      />
    </>
  );
}
