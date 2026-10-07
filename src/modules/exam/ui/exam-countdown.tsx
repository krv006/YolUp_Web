import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { formatClock, secondsUntil } from "../lib/server-time";

export interface ExamCountdownProps {
  startsAt: string;
}

export function ExamCountdown({ startsAt }: ExamCountdownProps) {
  const { t } = useTranslation("exam");
  const [left, setLeft] = useState(() => secondsUntil(startsAt));

  useEffect(() => {
    const timer = globalThis.setInterval(() => setLeft(secondsUntil(startsAt)), 1000);
    return () => globalThis.clearInterval(timer);
  }, [startsAt]);

  if (left > 24 * 3600) return null;
  return <span className="exam-countdown">{t("list.startsIn", { time: formatClock(left) })}</span>;
}
