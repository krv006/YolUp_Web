import type { ReactNode } from "react";
import { Atom, ChevronLeft, ChevronRight, Plus, Redo2, Undo2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Icon } from "@/shared/ui/icon";
import { MOBILE_BOARD_COLORS, MOBILE_BOARD_WIDTHS } from "../constants/board.constants";
import type { BoardTool } from "./board-toolbar";

const TOOLS: Array<{ id: BoardTool; labelKey: string; icon: string; size: number }> = [
  { id: "marker", labelKey: "tools.marker", icon: "board-marker", size: 21 },
  { id: "pen", labelKey: "tools.pen", icon: "board-pen", size: 24 },
  { id: "line", labelKey: "tools.line", icon: "board-line", size: 24 },
  { id: "arrow", labelKey: "tools.arrow", icon: "board-arrow", size: 22 },
  { id: "rect", labelKey: "tools.rect", icon: "board-rect", size: 24 },
  { id: "ellipse", labelKey: "tools.ellipse", icon: "board-ellipse", size: 24 },
  { id: "text", labelKey: "tools.text", icon: "board-text", size: 21 },
  { id: "math", labelKey: "tools.math", icon: "board-sigma", size: 21 },
  { id: "erase", labelKey: "tools.erase", icon: "board-eraser", size: 20 },
];

const PLAIN_TOOLS: BoardTool[] = ["text", "math", "erase"];

export interface MobileBoardHeaderProps {
  title: ReactNode;
  subtitle: ReactNode;
  live?: boolean;
  backLabel: string;
  onBack: () => void;
  pill?: ReactNode;
  action?: ReactNode;
}

export function MobileBoardHeader({ title, subtitle, live, backLabel, onBack, pill, action }: MobileBoardHeaderProps) {
  return (
    <header className="flex h-11 shrink-0 items-center gap-3">
      <button
        type="button"
        className="grid size-10 shrink-0 place-items-center rounded-full bg-surface text-ink"
        aria-label={backLabel}
        onClick={onBack}
      >
        <ChevronLeft size={20} />
      </button>
      <span className="flex min-w-0 flex-1 flex-col">
        <strong className="truncate text-title text-ink">{title}</strong>
        <small className="flex min-w-0 items-center gap-1.5 text-caption font-normal text-ink-secondary">
          {live ? <i className="size-1.5 shrink-0 rounded-full bg-danger not-italic" aria-hidden="true" /> : null}
          <span className="truncate">{subtitle}</span>
        </small>
      </span>
      {pill}
      {action}
    </header>
  );
}

export function MobileBoardPill({
  icon,
  tone,
  children,
  onClick,
}: {
  icon: ReactNode;
  tone: "success" | "neutral" | "warning";
  children: ReactNode;
  onClick?: () => void;
}) {
  const toneClass =
    tone === "success"
      ? "bg-success-bg text-success-fg"
      : tone === "warning"
        ? "bg-warning-bg text-warning-fg"
        : "bg-subtle text-ink-secondary";
  const className = `flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-caption-strong ${toneClass}`;
  return onClick ? (
    <button type="button" className={className} onClick={onClick}>
      {icon}
      {children}
    </button>
  ) : (
    <span className={className}>
      {icon}
      {children}
    </span>
  );
}

export interface MobileBoardToolbarProps {
  tool: BoardTool;
  color: string;
  width: number;
  onToolChange: (tool: BoardTool) => void;
  onColorChange: (color: string) => void;
  onWidthChange: (width: number) => void;
  onPeriodic?: () => void;
}

export function MobileBoardToolbar({
  tool,
  color,
  width,
  onToolChange,
  onColorChange,
  onWidthChange,
  onPeriodic,
}: MobileBoardToolbarProps) {
  const { t } = useTranslation("board");
  const plain = PLAIN_TOOLS.includes(tool);
  const button = onPeriodic ? "size-8" : "size-9";
  return (
    <div
      className={`flex shrink-0 flex-col gap-2.5 rounded-2xl bg-surface px-2.5 shadow-sm ${plain ? "py-2.5" : "pt-[7px] pb-[9px]"}`}
      role="toolbar"
      aria-label={t("tools.toolbarAria")}
    >
      <div className={`h-8 items-center ${plain ? "hidden" : "flex"}`}>
        {MOBILE_BOARD_COLORS.map((value) => {
          const active = color.toLowerCase() === value;
          return (
            <button
              key={value}
              type="button"
              className="grid size-8 shrink-0 place-items-center"
              aria-label={t("tools.colorLabel", { value })}
              aria-pressed={active}
              onClick={() => onColorChange(value)}
            >
              {active ? (
                <span className="grid size-[26px] place-items-center rounded-full border-2" style={{ borderColor: value }}>
                  <span className="block size-4 rounded-full" style={{ background: value }} />
                </span>
              ) : (
                <span className="block size-[22px] rounded-full" style={{ background: value }} />
              )}
            </button>
          );
        })}
        <i className="mr-2 ml-[7px] h-5 w-px shrink-0 bg-line not-italic" aria-hidden="true" />
        {MOBILE_BOARD_WIDTHS.map((value) => {
          const active = width === value;
          return (
            <button
              key={value}
              type="button"
              className={`grid size-7 shrink-0 place-items-center rounded-sm ${active ? "bg-brand" : ""} [&+&]:ml-2.5`}
              aria-label={t("tools.widthLabel", { value })}
              aria-pressed={active}
              onClick={() => onWidthChange(value)}
            >
              <span className="block rounded-full bg-ink" style={{ width: value + 2, height: value + 2 }} />
            </button>
          );
        })}
      </div>
      <div className="flex h-9 items-center justify-between">
        {TOOLS.map(({ id, labelKey, icon, size }) => {
          const active = tool === id;
          return (
            <button
              key={id}
              type="button"
              className={`grid ${button} shrink-0 place-items-center rounded-md transition-colors ${
                active ? (id === "erase" ? "bg-danger-bg text-danger" : "bg-brand text-on-action") : "text-ink"
              }`}
              aria-label={t(labelKey)}
              aria-pressed={active}
              onClick={() => onToolChange(id)}
            >
              <Icon name={icon} size={size} />
            </button>
          );
        })}
        {onPeriodic ? (
          <button
            type="button"
            className={`grid ${button} shrink-0 place-items-center rounded-md text-ink`}
            aria-label={t("periodic.button")}
            onClick={onPeriodic}
          >
            <Atom size={20} />
          </button>
        ) : null}
      </div>
    </div>
  );
}

export interface MobileBoardFooterProps {
  page: number;
  total: number;
  canUndo: boolean;
  canRedo: boolean;
  showHistory: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onPrev: () => void;
  onNext: () => void;
  onPages: () => void;
  onAdd?: () => void;
}

export function MobileBoardPageNav({
  page,
  total,
  onPrev,
  onNext,
  onPages,
  className = "h-16",
}: Pick<MobileBoardFooterProps, "page" | "total" | "onPrev" | "onNext" | "onPages"> & { className?: string }) {
  const { t } = useTranslation("board");
  return (
    <span className={`flex shrink-0 items-center rounded-full bg-surface px-3 ${className}`}>
      <button
        type="button"
        className="grid size-10 place-items-center rounded-full text-ink disabled:text-ink-tertiary"
        aria-label={t("sheet.prev")}
        disabled={page <= 1}
        onClick={onPrev}
      >
        <ChevronLeft size={18} />
      </button>
      <button type="button" className="min-w-14 text-center text-title-sm text-ink" onClick={onPages}>
        {page} / {total}
      </button>
      <button
        type="button"
        className="grid size-10 place-items-center rounded-full text-ink disabled:text-ink-tertiary"
        aria-label={t("sheet.next")}
        disabled={page >= total}
        onClick={onNext}
      >
        <ChevronRight size={18} />
      </button>
    </span>
  );
}

export function MobileBoardFooter(props: MobileBoardFooterProps) {
  const { t } = useTranslation("board");
  return (
    <div className="flex shrink-0 items-center justify-between gap-2">
      {props.showHistory ? (
        <span className="flex h-10 shrink-0 items-center gap-1 rounded-full bg-surface px-2">
          <button
            type="button"
            className="grid size-9 place-items-center rounded-full text-ink disabled:text-ink-tertiary"
            aria-label={t("mobile.undo")}
            disabled={!props.canUndo}
            onClick={props.onUndo}
          >
            <Undo2 size={20} />
          </button>
          <button
            type="button"
            className="grid size-9 place-items-center rounded-full text-ink disabled:text-ink-tertiary"
            aria-label={t("mobile.redo")}
            disabled={!props.canRedo}
            onClick={props.onRedo}
          >
            <Redo2 size={20} />
          </button>
        </span>
      ) : (
        <span className="w-[78px] shrink-0" aria-hidden="true" />
      )}
      <MobileBoardPageNav {...props} />
      {props.onAdd ? (
        <button
          type="button"
          className="flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-brand px-4 text-title-sm text-on-action"
          onClick={props.onAdd}
        >
          <Plus size={18} />
          {t("sheet.addSheet")}
        </button>
      ) : (
        <span className="w-[98px] shrink-0" aria-hidden="true" />
      )}
    </div>
  );
}
