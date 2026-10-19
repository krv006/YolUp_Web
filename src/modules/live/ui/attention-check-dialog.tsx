import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { AppDialog, dialogButton } from "@/shared/ui/app-dialog";
import { useAnswerAttention } from "../model/live.queries";
import type { AttentionCheck } from "../api/live.dto";

const WINDOW_MS = 15_000;

export interface AttentionCheckDialogProps {
  lessonId: string;
  check: AttentionCheck | null | undefined;
}

function formatClock(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

export function AttentionCheckDialog({
  lessonId,
  check,
}: AttentionCheckDialogProps) {
  const { t } = useTranslation("live");
  const answer = useAnswerAttention(lessonId);
  const [seconds, setSeconds] = useState(WINDOW_MS / 1000);

  useEffect(() => {
    if (!check) return undefined;
    const update = () =>
      setSeconds(
        Math.max(
          0,
          Math.ceil(
            (new Date(check.dueAt).getTime() + WINDOW_MS - Date.now()) / 1000,
          ),
        ),
      );
    update();
    const id = setInterval(update, 250);
    return () => clearInterval(id);
  }, [check]);

  const clock = formatClock(seconds);

  return (
    <AppDialog
      open={Boolean(check)}
      onOpenChange={() => undefined}
      variant="confirm"
      icon={
        <strong className="font-heading text-display text-action">
          {clock}
        </strong>
      }
      title={t("attentionCheck.title")}
      description={t("attentionCheck.description", { time: clock })}
      footer={
        <button
          type="button"
          className={`${dialogButton.primary} w-full`}
          disabled={seconds <= 0 || answer.isPending}
          onClick={() => check && answer.mutate(check.id)}
        >
          {t("attentionCheck.respond")}
        </button>
      }
    />
  );
}
