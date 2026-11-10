import { Minus, Pencil, Plus, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { StrokeDto } from "../api/board.dto";
import { BOARD_COLORS, BOARD_SIZE_LIMITS, BOARD_WIDTHS } from "../constants/board.constants";
import { strokeSize, type StrokeBox } from "../lib/board-edit";

export interface SelectionToolbarProps {
  stroke: StrokeDto;
  box: StrokeBox;
  boardWidth: number;
  onEdit?: () => void;
  onChange: (changes: Record<string, unknown>) => void;
  onDelete: () => void;
  docked?: boolean;
}

const SIZE_STEP = 2;
const BUTTON = "grid size-8 shrink-0 place-items-center rounded-md text-ink-secondary transition-colors hover:bg-subtle hover:text-ink";

export function SelectionToolbar({ stroke, box, boardWidth, onEdit, onChange, onDelete, docked = false }: SelectionToolbarProps) {
  const { t } = useTranslation("board");
  const size = strokeSize(stroke);
  const color = (stroke.color ?? "").toLowerCase();
  const below = box.minY < 90;
  const right = box.minX > boardWidth * 0.55;
  const anchorX = right ? box.maxX : box.minX;
  const anchorY = below ? box.maxY : box.minY;

  return (
    <div
      role="toolbar"
      aria-label={t("edit.toolbar")}
      className={
        docked
          ? "flex w-full items-center gap-1 overflow-x-auto rounded-2xl bg-surface p-1 shadow-sm [scrollbar-width:none]"
          : "absolute z-20 flex max-w-[calc(100%-16px)] flex-wrap items-center gap-1 rounded-xl border border-line bg-surface p-1 shadow-lg"
      }
      style={
        docked
          ? undefined
          : {
              top: 0,
              left: `${(anchorX / boardWidth) * 100}%`,
              marginTop: `${(anchorY / boardWidth) * 100}%`,
              transform: `translate(${right ? "-100%" : "0"}, ${below ? "12px" : "calc(-100% - 12px)"})`,
            }
      }
      onPointerDown={(event) => event.stopPropagation()}
    >
      {onEdit ? (
        <button
          type="button"
          className="flex h-8 shrink-0 items-center gap-1.5 rounded-md px-2.5 text-caption-strong text-ink transition-colors hover:bg-subtle"
          onClick={onEdit}
        >
          <Pencil size={15} />
          {t("edit.edit")}
        </button>
      ) : null}

      <span className="flex items-center gap-0.5 px-1">
        {BOARD_COLORS.map((value) => (
          <button
            key={value}
            type="button"
            className={`grid size-7 place-items-center rounded-full ${color === value ? "ring-2 ring-brand ring-offset-1 ring-offset-surface" : ""}`}
            aria-label={t("tools.colorLabel", { value })}
            aria-pressed={color === value}
            onClick={() => onChange({ color: value })}
          >
            <span className="block size-5 rounded-full" style={{ background: value }} />
          </button>
        ))}
      </span>

      {size !== null ? (
        <span className="flex items-center gap-0.5 border-l border-line pl-1">
          <button
            type="button"
            className={BUTTON}
            aria-label={t("edit.sizeDown")}
            disabled={size <= BOARD_SIZE_LIMITS.min}
            onClick={() => onChange({ size: Math.max(BOARD_SIZE_LIMITS.min, size - SIZE_STEP) })}
          >
            <Minus size={15} />
          </button>
          <span className="min-w-8 text-center font-numeric text-caption-strong text-ink">{size}</span>
          <button
            type="button"
            className={BUTTON}
            aria-label={t("edit.sizeUp")}
            disabled={size >= BOARD_SIZE_LIMITS.max}
            onClick={() => onChange({ size: Math.min(BOARD_SIZE_LIMITS.max, size + SIZE_STEP) })}
          >
            <Plus size={15} />
          </button>
        </span>
      ) : (
        <span className="flex items-center gap-0.5 border-l border-line pl-1">
          {BOARD_WIDTHS.map((value) => (
            <button
              key={value}
              type="button"
              className={`grid h-8 w-8 place-items-center rounded-md ${stroke.width === value ? "bg-brand-subtle" : "hover:bg-subtle"}`}
              aria-label={t("tools.widthLabel", { value })}
              aria-pressed={stroke.width === value}
              onClick={() => onChange({ width: value })}
            >
              <span className="block w-4 rounded-full bg-ink" style={{ height: Math.min(value, 8) }} />
            </button>
          ))}
        </span>
      )}

      <button
        type="button"
        className={`${BUTTON} border-l border-line text-error-text hover:bg-danger-bg hover:text-error-text`}
        aria-label={t("edit.delete")}
        title={t("edit.delete")}
        onClick={onDelete}
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
}
