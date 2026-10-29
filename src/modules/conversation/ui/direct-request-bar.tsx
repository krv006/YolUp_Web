import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import type { Conversation } from "@/shared/types";
import { dialogButton } from "@/shared/ui/app-dialog";
import { Icon } from "@/shared/ui/icon";
import type { DirectAction } from "../api/conversation.dto";
import { DIRECT_STATUS } from "../constants/direct-status";
import { useRequestDirect, useRespondDirect } from "../model/use-conversations";

export interface DirectRequestBarProps {
  conversation: Conversation;
  role: "teacher" | "student";
}

export function DirectRequestBar({ conversation, role }: DirectRequestBarProps) {
  const { t } = useTranslation("chat");
  const respond = useRespondDirect();
  const request = useRequestDirect();
  const blocked = conversation.directStatus === DIRECT_STATUS.BLOCKED;
  const teacher = role === "teacher";

  function answer(action: DirectAction) {
    respond.mutate(
      { roomId: conversation.id, action },
      {
        onSuccess: () =>
          toast.success(action === "accept" ? t("info.conversationAccepted") : t("info.conversationBlocked")),
        onError: (error: Error) => toast.error(error.message),
      }
    );
  }

  function resend() {
    if (!conversation.participantId) return;
    request.mutate(conversation.participantId, {
      onSuccess: () => toast.success(t("panel.directRequestSent")),
      onError: (error: Error) => toast.error(error.message),
    });
  }

  const title = teacher
    ? blocked
      ? t("directGate.teacherBlockedTitle")
      : t("directGate.teacherPendingTitle", { name: conversation.title })
    : blocked
      ? t("directGate.studentBlockedTitle")
      : t("directGate.studentPendingTitle");
  const hint = teacher
    ? blocked
      ? t("directGate.teacherBlockedHint")
      : t("directGate.teacherPendingHint")
    : blocked
      ? t("directGate.studentBlockedHint")
      : t("directGate.studentPendingHint");

  return (
    <div className="shrink-0 bg-surface px-4 pt-2.5 pb-6 lg:border-t lg:border-line lg:px-6 lg:py-4">
      <div className="flex flex-col gap-3 rounded-xl bg-subtle p-4 lg:flex-row lg:items-center">
        <span className="flex min-w-0 flex-1 items-center gap-3">
          <span
            className={`grid size-10 shrink-0 place-items-center rounded-full ${
              blocked ? "bg-error-bg text-error-text" : "bg-surface text-brand"
            }`}
          >
            <Icon name={blocked ? "lock" : teacher ? "person-add" : "hourglass-empty"} size={20} />
          </span>
          <span className="flex min-w-0 flex-col gap-0.5">
            <strong className="text-title-sm text-ink">{title}</strong>
            <small className="text-body-sm text-ink-secondary">{hint}</small>
          </span>
        </span>

        {teacher ? (
          <span className="grid grid-cols-2 gap-2 lg:flex lg:shrink-0">
            {blocked ? null : (
              <button
                type="button"
                className={`${dialogButton.danger} whitespace-nowrap lg:flex-none`}
                disabled={respond.isPending}
                onClick={() => answer("block")}
              >
                {t("directGate.block")}
              </button>
            )}
            <button
              type="button"
              className={`${dialogButton.primary} whitespace-nowrap lg:flex-none ${blocked ? "col-span-2" : ""}`}
              disabled={respond.isPending}
              onClick={() => answer("accept")}
            >
              {blocked ? t("directGate.unblock") : t("directGate.accept")}
            </button>
          </span>
        ) : blocked && conversation.participantId ? (
          <button
            type="button"
            className={`${dialogButton.primary} whitespace-nowrap lg:flex-none lg:shrink-0`}
            disabled={request.isPending}
            onClick={resend}
          >
            {t("directGate.resend")}
          </button>
        ) : null}
      </div>
    </div>
  );
}
