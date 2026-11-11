import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { ScreenShareOff, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatElapsed, useElapsedSeconds } from "./use-elapsed-seconds";

export interface ShareControlWindowProps {
  pipWindow: Window;
  sharedWhat: string;
  startedAt: Date;
  studentCount: number;
  controls: ReactNode;
  onStop: () => void;
}

export function ShareControlWindow({ pipWindow, sharedWhat, startedAt, studentCount, controls, onStop }: ShareControlWindowProps) {
  const { t } = useTranslation("live");
  const elapsed = formatElapsed(useElapsedSeconds(startedAt));

  return createPortal(
    <div className="live-room-shell flex min-h-screen flex-col justify-center gap-4 bg-surface-inverse px-4 py-3 font-body text-ink-inverse">
      <div className="flex items-center gap-2">
        <span className="size-2.5 shrink-0 animate-pulse rounded-full bg-danger" aria-hidden="true" />
        <strong className="min-w-0 flex-1 truncate text-title-sm" title={sharedWhat}>
          {t("share.sharingWhat", { what: sharedWhat })}
        </strong>
        <span className="shrink-0 font-numeric text-body-sm text-ink-inverse-secondary">{elapsed}</span>
      </div>
      <div className="flex items-center gap-3">
        {controls}
        <button
          type="button"
          className="ml-auto flex h-12 shrink-0 items-center gap-2 rounded-full bg-danger px-4 text-button text-white transition-opacity hover:opacity-90"
          onClick={onStop}
        >
          <ScreenShareOff size={18} />
          {t("share.pipStop")}
        </button>
      </div>
      <span className="flex items-center gap-1.5 text-body-xs text-ink-inverse-secondary">
        <Users size={14} />
        {t("share.pipStudents", { count: studentCount })}
      </span>
    </div>,
    pipWindow.document.body
  );
}
