import {
  Atom,
  Circle,
  Eraser,
  Highlighter,
  Minus,
  MoveRight,
  PenLine,
  Sigma,
  Square,
  Type,
} from "lucide-react";
import { useState, type ComponentType } from "react";
import { useTranslation } from "react-i18next";
import { BOARD_COLORS, BOARD_WIDTHS } from "../constants/board.constants";
import type { DrawKind } from "../lib/board.geometry";

export type BoardTool = DrawKind | "text" | "math" | "erase";

interface ToolDefinition {
  id: BoardTool;
  labelKey: string;
  icon: ComponentType<{ size?: number }>;
}

const TOOLS: ToolDefinition[] = [
  { id: "pen", labelKey: "tools.pen", icon: PenLine },
  { id: "marker", labelKey: "tools.marker", icon: Highlighter },
  { id: "line", labelKey: "tools.line", icon: Minus },
  { id: "arrow", labelKey: "tools.arrow", icon: MoveRight },
  { id: "rect", labelKey: "tools.rect", icon: Square },
  { id: "ellipse", labelKey: "tools.ellipse", icon: Circle },
  { id: "text", labelKey: "tools.text", icon: Type },
  { id: "math", labelKey: "tools.math", icon: Sigma },
];

export interface BoardToolbarProps {
  tool: BoardTool;
  color: string;
  width: number;
  canDraw: boolean;
  chemistryEnabled?: boolean;
  onToolChange: (tool: BoardTool) => void;
  onColorChange: (color: string) => void;
  onWidthChange: (width: number) => void;
  onPeriodic?: () => void;
}

const BUTTON =
  "grid size-9 shrink-0 place-items-center rounded-md transition-colors disabled:opacity-40";

export function BoardToolbar({
  tool,
  color,
  width,
  canDraw,
  chemistryEnabled = false,
  onToolChange,
  onColorChange,
  onWidthChange,
  onPeriodic,
}: BoardToolbarProps) {
  const { t } = useTranslation("board");
  const [styleOpen, setStyleOpen] = useState(false);

  return (
    <div
      className="relative flex flex-col gap-2 rounded-xl bg-surface p-2 shadow-xl"
      role="toolbar"
      aria-label={t("tools.toolbarAria")}
    >
      {TOOLS.map(({ id, labelKey, icon: ToolIcon }) => {
        const label = t(labelKey);
        const active = tool === id;
        return (
          <button
            key={id}
            type="button"
            className={`${BUTTON} ${
              active ? "bg-brand text-on-action" : "text-ink-secondary hover:bg-subtle hover:text-ink"
            }`}
            disabled={!canDraw}
            title={label}
            aria-label={label}
            aria-pressed={active}
            onClick={() => onToolChange(id)}
          >
            <ToolIcon size={17} />
          </button>
        );
      })}

      {chemistryEnabled && onPeriodic ? (
        <button
          type="button"
          className={`${BUTTON} text-ink-secondary hover:bg-subtle hover:text-ink`}
          title={t("periodic.button")}
          aria-label={t("periodic.button")}
          onClick={onPeriodic}
        >
          <Atom size={17} />
        </button>
      ) : null}

      <button
        type="button"
        className={`${BUTTON} ${
          tool === "erase"
            ? "bg-danger-bg text-danger"
            : "text-ink-secondary hover:bg-subtle hover:text-ink"
        }`}
        disabled={!canDraw}
        title={t("tools.erase")}
        aria-label={t("tools.erase")}
        aria-pressed={tool === "erase"}
        onClick={() => onToolChange("erase")}
      >
        <Eraser size={17} />
      </button>

      <span className="mx-auto h-px w-6 bg-line" aria-hidden="true" />

      <button
        type="button"
        className={`${BUTTON} ${styleOpen ? "bg-subtle" : "hover:bg-subtle"}`}
        disabled={!canDraw}
        title={t("tools.styleAria")}
        aria-label={t("tools.styleAria")}
        aria-expanded={styleOpen}
        onClick={() => setStyleOpen((value) => !value)}
      >
        <span className="size-5 rounded-full" style={{ background: color }} />
      </button>

      {styleOpen ? (
        <div className="absolute bottom-0 left-[calc(100%+8px)] flex flex-col gap-3 rounded-xl bg-surface p-3 shadow-xl">
          <div className="flex items-center gap-1.5">
            {BOARD_COLORS.map((value) => (
              <button
                key={value}
                type="button"
                className={`size-6 shrink-0 rounded-full transition-shadow disabled:opacity-40 ${
                  color === value ? "ring-2 ring-brand ring-offset-2 ring-offset-surface" : ""
                }`}
                style={{ background: value }}
                disabled={!canDraw}
                title={t("tools.colorLabel", { value })}
                aria-label={t("tools.colorLabel", { value })}
                aria-pressed={color === value}
                onClick={() => onColorChange(value)}
              />
            ))}
          </div>

          <div className="flex items-center gap-1">
            {BOARD_WIDTHS.map((value) => (
              <button
                key={value}
                type="button"
                className={`grid h-9 w-10 shrink-0 place-items-center rounded-md transition-colors disabled:opacity-40 ${
                  width === value ? "bg-brand-subtle" : "hover:bg-subtle"
                }`}
                disabled={!canDraw}
                title={t("tools.widthLabel", { value })}
                aria-label={t("tools.widthLabel", { value })}
                aria-pressed={width === value}
                onClick={() => onWidthChange(value)}
              >
                <span
                  className="block w-5 rounded-full bg-ink"
                  style={{ height: Math.min(value, 10) }}
                />
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
