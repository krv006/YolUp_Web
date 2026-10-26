import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { AppDialog } from "@/shared/ui/app-dialog";
import type { BoardSheet } from "../api/board.dto";
import { BoardStroke } from "./board-stroke";

export interface BoardPagesSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sheets: BoardSheet[];
  active: number;
  boardWidth: number;
  boardHeight: number;
  canAdd: boolean;
  /** O'qituvchi sahifa nomini tahrirlashi mumkin. */
  canRename?: boolean;
  onSelect: (index: number) => void;
  onAdd: () => void;
  onRename?: (index: number, title: string) => void;
}

export function BoardPagesSheet({
  open,
  onOpenChange,
  sheets,
  active,
  boardWidth,
  boardHeight,
  canAdd,
  canRename = false,
  onSelect,
  onAdd,
  onRename,
}: BoardPagesSheetProps) {
  const { t } = useTranslation("board");

  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      variant="confirm"
      width="lg:w-120"
      title={t("pages.title")}
      description={t("pages.hint")}
      footer={
        canAdd ? (
          <button
            type="button"
            className="flex h-12 flex-1 items-center justify-center rounded-full bg-brand px-5 text-button text-on-action transition-colors hover:bg-brand-strong"
            onClick={onAdd}
          >
            {t("pages.new")}
          </button>
        ) : null
      }
    >
      <div className="grid grid-cols-2 gap-3">
        {sheets.map((item) => {
          const current = item.index === active;
          return (
            <button
              key={item.index}
              type="button"
              className="flex flex-col gap-2 text-left"
              onClick={() => onSelect(item.index)}
            >
              <span
                className={`block w-full overflow-hidden rounded-md border-2 bg-surface ${
                  current ? "border-brand" : "border-line"
                }`}
              >
                <svg
                  viewBox={`0 0 ${boardWidth} ${boardHeight}`}
                  className="block h-full w-full"
                  style={{ aspectRatio: `${boardWidth} / ${boardHeight}` }}
                  aria-hidden="true"
                >
                  {item.strokes.map((stroke) => (
                    <BoardStroke
                      key={stroke.id}
                      stroke={stroke}
                      selected={false}
                      onSelect={() => undefined}
                    />
                  ))}
                </svg>
              </span>

              <span className="flex items-center gap-2">
                <i
                  className={`grid size-5 shrink-0 place-items-center rounded-full text-micro not-italic ${
                    current ? "bg-brand text-on-action" : "bg-subtle text-ink-secondary"
                  }`}
                >
                  {item.index + 1}
                </i>
                {canRename && onRename ? (
                  <input
                    className="min-w-0 flex-1 truncate bg-transparent text-body-xs text-ink outline-none placeholder:text-ink-tertiary"
                    defaultValue={item.title}
                    placeholder={
                      item.strokes.length
                        ? t("pages.pageLabel", { index: item.index + 1 })
                        : t("pages.emptyPage")
                    }
                    aria-label={t("pages.renameAria", { index: item.index + 1 })}
                    onClick={(event) => event.stopPropagation()}
                    onBlur={(event) => {
                      const next = event.target.value.trim();
                      if (next !== item.title) onRename(item.index, next);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") event.currentTarget.blur();
                    }}
                  />
                ) : (
                  <small className="min-w-0 flex-1 truncate text-body-xs text-ink">
                    {item.title ||
                      (item.strokes.length
                        ? t("pages.pageLabel", { index: item.index + 1 })
                        : t("pages.emptyPage"))}
                  </small>
                )}
              </span>
            </button>
          );
        })}

        {canAdd ? (
          <button
            type="button"
            className="flex flex-col gap-2 text-left"
            onClick={onAdd}
          >
            <span
              className="grid w-full place-items-center rounded-md border border-line bg-surface text-ink-tertiary"
              style={{ aspectRatio: `${boardWidth} / ${boardHeight}` }}
            >
              <Plus size={22} />
            </span>
            <span className="flex items-center gap-2">
              <i className="grid size-5 shrink-0 place-items-center rounded-full bg-subtle text-micro text-ink-secondary not-italic">
                {sheets.length + 1}
              </i>
              <small className="min-w-0 flex-1 truncate text-body-xs text-ink">
                {t("pages.emptyPage")}
              </small>
            </span>
          </button>
        ) : null}
      </div>
    </AppDialog>
  );
}
