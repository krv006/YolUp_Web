import { useEffect } from "react";
import { homeworkApi } from "../api/homework.api";

function isFilePicker(target: EventTarget | null): boolean {
  return target instanceof HTMLInputElement && target.type === "file";
}

export function useHomeworkFocusTracker(assignmentId: string | null | undefined, enabled: boolean) {
  useEffect(() => {
    if (!enabled || !assignmentId) return undefined;
    let away = false;
    let picking = false;

    const send = (kind: "exit" | "return") => {
      if ((kind === "exit") === away) return;
      away = kind === "exit";
      homeworkApi.sendFocus(assignmentId, kind).catch(() => undefined);
    };

    const visibility = () => {
      if (document.hidden) send("exit");
      else if (!picking) send("return");
    };
    const blur = () => {
      if (!picking) send("exit");
    };
    const focus = () => {
      picking = false;
      send("return");
    };
    const pickStart = (event: Event) => {
      if (isFilePicker(event.target)) picking = true;
    };
    const pickEnd = (event: Event) => {
      if (isFilePicker(event.target)) picking = false;
    };

    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("blur", blur);
    window.addEventListener("focus", focus);
    document.addEventListener("click", pickStart, true);
    document.addEventListener("change", pickEnd, true);
    document.addEventListener("cancel", pickEnd, true);

    return () => {
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("blur", blur);
      window.removeEventListener("focus", focus);
      document.removeEventListener("click", pickStart, true);
      document.removeEventListener("change", pickEnd, true);
      document.removeEventListener("cancel", pickEnd, true);
      if (away) homeworkApi.sendFocus(assignmentId, "return").catch(() => undefined);
    };
  }, [assignmentId, enabled]);
}
