import { useEffect, useState } from "react";
import { Timer } from "lucide-react";
import { formatClock, secondsUntil } from "../lib/server-time";

export interface ExamTimerProps {
  deadline: string | null;
  label: string;
  onExpire?: () => void;
}

export function ExamTimer({ deadline, label, onExpire }: ExamTimerProps) {
  const [left, setLeft] = useState(() => secondsUntil(deadline));

  useEffect(() => {
    const timer = globalThis.setInterval(() => {
      const next = secondsUntil(deadline);
      setLeft(next);
      if (next <= 0) {
        globalThis.clearInterval(timer);
        onExpire?.();
      }
    }, 1000);
    return () => globalThis.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deadline]);

  return (
    <div className={`exam-timer ${left <= 60 ? "is-urgent" : ""}`} role="timer">
      <Timer size={16} />
      <span>{label}</span>
      <strong>{formatClock(left)}</strong>
    </div>
  );
}
