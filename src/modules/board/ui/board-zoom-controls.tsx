import { Grid3x3, Minus, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { BOARD_ZOOM } from "../lib/board-zoom";

export interface BoardZoomControlsProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  guides?: boolean;
  onToggleGuides?: () => void;
}

const BUTTON = "grid size-8 place-items-center rounded-md text-ink-secondary transition-colors hover:bg-subtle hover:text-ink disabled:opacity-40";

export function BoardZoomControls({ zoom, onZoomIn, onZoomOut, onReset, guides = false, onToggleGuides }: BoardZoomControlsProps) {
  const { t } = useTranslation("board");
  const percent = Math.round(zoom * 100);
  return (
    <div className="absolute top-3 right-3 z-20 flex items-center gap-0.5 rounded-xl bg-surface p-1 shadow-lg">
      {onToggleGuides ? (
        <>
          <button
            type="button"
            className={`grid size-8 place-items-center rounded-md transition-colors ${
              guides ? "bg-brand-subtle text-brand" : "text-ink-secondary hover:bg-subtle hover:text-ink"
            }`}
            aria-label={guides ? t("guides.hide") : t("guides.show")}
            title={guides ? t("guides.hide") : t("guides.show")}
            aria-pressed={guides}
            onClick={onToggleGuides}
          >
            <Grid3x3 size={16} />
          </button>
          <span className="mx-0.5 h-5 w-px bg-line" aria-hidden="true" />
        </>
      ) : null}
      <button type="button" className={BUTTON} aria-label={t("zoom.out")} title={t("zoom.out")} disabled={zoom <= BOARD_ZOOM.min} onClick={onZoomOut}>
        <Minus size={16} />
      </button>
      <button
        type="button"
        className="h-8 min-w-13 rounded-md px-1.5 font-numeric text-caption-strong text-ink transition-colors hover:bg-subtle"
        aria-label={t("zoom.reset", { value: percent })}
        title={t("zoom.reset", { value: percent })}
        onClick={onReset}
      >
        {percent}%
      </button>
      <button type="button" className={BUTTON} aria-label={t("zoom.in")} title={t("zoom.in")} disabled={zoom >= BOARD_ZOOM.max} onClick={onZoomIn}>
        <Plus size={16} />
      </button>
    </div>
  );
}
