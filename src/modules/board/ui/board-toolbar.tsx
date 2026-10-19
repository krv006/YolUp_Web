import {
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
import type { ComponentType } from "react";
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
  { id: "erase", labelKey: "tools.erase", icon: Eraser },
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
  onToolChange: (tool: BoardTool) => void;
  onColorChange: (color: string) => void;
  onWidthChange: (width: number) => void;
}

export function BoardToolbar({
  tool,
  color,
  width,
  canDraw,
  onToolChange,
  onColorChange,
  onWidthChange,
}: BoardToolbarProps) {
  const { t } = useTranslation("board");

  return (
    <div
      className="flex flex-col gap-2 rounded-2xl bg-surface p-2 shadow-xl"
      role="toolbar"
      aria-label={t("tools.toolbarAria")}
    >
      <div className="flex items-center gap-1">
        {TOOLS.map(({ id, labelKey, icon: Icon }) => {
          const label = t(labelKey);
          const active = tool === id;
          return (
            <button
              key={id}
              type="button"
              className={`grid size-9 shrink-0 place-items-center rounded-xl transition-colors disabled:opacity-40 ${
                active
                  ? id === "erase"
                    ? "bg-error-bg text-error-text"
                    : "bg-action text-on-action"
                  : "text-ink-secondary hover:bg-subtle hover:text-ink"
              }`}
              disabled={!canDraw}
              title={label}
              aria-label={label}
              aria-pressed={active}
              onClick={() => onToolChange(id)}
            >
              <Icon size={17} />
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          {BOARD_COLORS.map((value) => (
            <button
              key={value}
              type="button"
              className={`size-6 shrink-0 rounded-full transition-shadow disabled:opacity-40 ${
                color === value ? "ring-2 ring-action ring-offset-2 ring-offset-surface" : ""
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

        <span className="h-6 w-px shrink-0 bg-line" aria-hidden="true" />

        <div className="flex items-center gap-1">
          {BOARD_WIDTHS.map((value) => (
            <button
              key={value}
              type="button"
              className={`grid h-9 w-10 shrink-0 place-items-center rounded-xl transition-colors disabled:opacity-40 ${
                width === value ? "bg-action-subtle" : "hover:bg-subtle"
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
    </div>
  );
}
