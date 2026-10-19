import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Drawer, DrawerContent, DrawerTitle } from "@/shared/ui/drawer";
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
  onSelect: (index: number) => void;
  onAdd: () => void;
}

export function BoardPagesSheet({
  open,
  onOpenChange,
  sheets,
  active,
  boardWidth,
  boardHeight,
  canAdd,
  onSelect,
  onAdd,
}: BoardPagesSheetProps) {
  const { t } = useTranslation("board");

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="px-4 pb-6">
        <DrawerTitle className="px-1 pt-2 font-heading text-h3 text-ink">
          {t("pages.title")}
        </DrawerTitle>
        <p className="px-1 pb-4 text-body-sm text-ink-secondary">{t("pages.hint")}</p>

        <div className="grid grid-cols-3 gap-3 pb-4">
          {sheets.map((item) => (
            <button
              key={item.index}
              type="button"
              className="flex flex-col items-center gap-1.5"
              onClick={() => onSelect(item.index)}
            >
              <span
                className={`block w-full overflow-hidden rounded-xl border-2 bg-white ${
                  item.index === active ? "border-action" : "border-line"
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
              <small className="text-caption text-ink-secondary">#{item.index + 1}</small>
            </button>
          ))}

          {canAdd ? (
            <button
              type="button"
              className="flex flex-col items-center gap-1.5"
              onClick={onAdd}
            >
              <span
                className="grid w-full place-items-center rounded-xl border border-dashed border-line text-ink-tertiary"
                style={{ aspectRatio: `${boardWidth} / ${boardHeight}` }}
              >
                <Plus size={22} />
              </span>
              <small className="text-caption text-ink-secondary">{t("pages.new")}</small>
            </button>
          ) : null}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
