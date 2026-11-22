import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { queueSecondsLeft } from "@/modules/live";
import { LiveRoomState } from "@/widgets/live-room";

interface JoinQueueStateProps {
  delayMs: number;
  lessonTitle?: string;
  subtitle?: string;
  backLabel: string;
  onLeave: () => void;
}

export function JoinQueueState({ delayMs, lessonTitle, subtitle, backLabel, onLeave }: JoinQueueStateProps) {
  const { t } = useTranslation("live");
  const [readyAt] = useState(() => Date.now() + delayMs);
  const [now, setNow] = useState(() => Date.now());
  const seconds = queueSecondsLeft(readyAt, now);

  useEffect(() => {
    const timer = globalThis.setInterval(() => setNow(Date.now()), 1000);
    return () => globalThis.clearInterval(timer);
  }, []);

  return (
    <LiveRoomState
      tone="waiting"
      lessonTitle={lessonTitle}
      subtitle={subtitle}
      title={t("state.queueTitle")}
      description={
        <span role="status" aria-live="polite">
          {seconds > 0 ? t("state.queueDescription", { count: seconds }) : t("state.queueConnecting")}
        </span>
      }
      secondaryLabel={backLabel}
      onSecondary={onLeave}
      onBack={onLeave}
    />
  );
}
