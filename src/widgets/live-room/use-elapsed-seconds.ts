import { useEffect, useState } from "react";

function secondsSince(startedAt: Date): number {
  return Math.max(0, Math.floor((Date.now() - startedAt.getTime()) / 1000));
}

export function useElapsedSeconds(startedAt: Date): number {
  const [seconds, setSeconds] = useState(() => secondsSince(startedAt));

  useEffect(() => {
    const timer = globalThis.setInterval(() => setSeconds(secondsSince(startedAt)), 1000);
    return () => globalThis.clearInterval(timer);
  }, [startedAt]);

  return seconds;
}

export function formatElapsed(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  return `${String(minutes).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}
