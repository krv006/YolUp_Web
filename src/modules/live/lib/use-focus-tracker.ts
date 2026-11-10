import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { liveApi } from "../api/live.api";
import type { FocusKind, FocusResult } from "../api/live.dto";

const DEDUPE_MS = 2000;

function warnStudent(result: FocusResult, alreadyWarned: boolean): boolean {
  if (!result.tracked || !result.exitCount) return alreadyWarned;

  if (result.parentNotified) {
    if (alreadyWarned) return true;
    toast.error("Siz darsdan bir necha marta chiqdingiz — kuzatuvchingizga xabar berildi.", {
      duration: 6000,
    });
    return true;
  }

  const left = Math.max(0, result.threshold - result.exitCount);
  toast.warning(
    left
      ? `Dars oynasidan chiqdingiz (${result.exitCount}/${result.threshold}). Yana ${left} marta chiqsangiz kuzatuvchingizga xabar boradi.`
      : `Dars oynasidan chiqdingiz (${result.exitCount}-marta).`,
    { duration: 5000 }
  );
  return alreadyWarned;
}

export function useFocusTracker(lessonId: string | undefined, enabled: boolean) {
  const lastEvent = useRef<{ kind: FocusKind | null; at: number }>({ kind: null, at: 0 });
  const parentWarned = useRef(false);

  useEffect(() => {
    if (!enabled || !lessonId) return undefined;
    parentWarned.current = false;

    const send = async (kind: FocusKind) => {
      const now = Date.now();
      if (lastEvent.current.kind === kind && now - lastEvent.current.at < DEDUPE_MS) return;
      lastEvent.current = { kind, at: now };

      try {
        const result = await liveApi.sendFocus(lessonId, kind);
        if (kind === "exit") parentWarned.current = warnStudent(result, parentWarned.current);
      } catch (error) {
        void error;
      }
    };

    const visibility = () => send(document.hidden ? "exit" : "return");
    const blur = () => send("exit");
    const focus = () => send("return");

    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("blur", blur);
    window.addEventListener("focus", focus);

    return () => {
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("blur", blur);
      window.removeEventListener("focus", focus);
    };
  }, [enabled, lessonId]);
}
