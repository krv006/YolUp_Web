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
    <div className="board-tools" role="toolbar" aria-label={t("tools.toolbarAria")}>
      <div className="board-tool-group">
        {TOOLS.map(({ id, labelKey, icon: Icon }) => {
          const label = t(labelKey);
          return (
            <button
              key={id}
              type="button"
              className={`${tool === id ? "is-active" : ""} ${id === "erase" ? "is-erase-tool" : ""}`}
              disabled={!canDraw}
              title={label}
              aria-label={label}
              aria-pressed={tool === id}
              onClick={() => onToolChange(id)}
            >
              <Icon size={16} />
            </button>
          );
        })}
      </div>

      <div className="board-tool-group board-colors">
        {BOARD_COLORS.map((value) => (
          <button
            key={value}
            type="button"
            className={color === value ? "is-active" : ""}
            style={{ background: value }}
            disabled={!canDraw}
            title={t("tools.colorLabel", { value })}
            aria-label={t("tools.colorLabel", { value })}
            aria-pressed={color === value}
            onClick={() => onColorChange(value)}
          />
        ))}
      </div>

      <div className="board-tool-group board-widths">
        {BOARD_WIDTHS.map((value) => (
          <button
            key={value}
            type="button"
            className={width === value ? "is-active" : ""}
            disabled={!canDraw}
            title={t("tools.widthLabel", { value })}
            aria-label={t("tools.widthLabel", { value })}
            aria-pressed={width === value}
            onClick={() => onWidthChange(value)}
          >
            <span style={{ height: Math.min(value, 10) }} />
          </button>
        ))}
      </div>
    </div>
  );
}
