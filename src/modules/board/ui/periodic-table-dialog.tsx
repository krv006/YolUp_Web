import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { AppDialog, dialogButton } from "@/shared/ui/app-dialog";
import type { PeriodicElement, StrokeDto, StrokeInput } from "../api/board.dto";
import { nextFlowPoint } from "../lib/board-flow";
import {
  bohrDiagramSize,
  buildBohrStrokes,
  buildElementCardStrokes,
  elementCardHeight,
} from "../lib/periodic-board";
import { useAddStrokes, usePeriodicTable } from "../model/board.queries";

export interface PeriodicTableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Dars doskasi uchun: chiziqlar serverga shu dars orqali yoziladi. Uy vazifasi doskasida `onPlace` beriladi. */
  lessonId?: string;
  /** Berilsa — chiziqlar serverga yozilmaydi, shu funksiyaga uzatiladi (uy vazifasi doskasi). */
  onPlace?: (strokes: StrokeInput[]) => void;
  sheet: number;
  canDraw: boolean;
  color: string;
  boardWidth: number;
  boardHeight: number;
  strokes: StrokeDto[];
}

const LANTHANIDE_RANGE = [57, 71] as const;
const ACTINIDE_RANGE = [89, 103] as const;

function isInRange(z: number, range: readonly [number, number]): boolean {
  return z >= range[0] && z <= range[1];
}

function cellPosition(element: PeriodicElement): { column: number; row: number } | null {
  if (isInRange(element.z, LANTHANIDE_RANGE)) {
    return { column: element.z - LANTHANIDE_RANGE[0] + 3, row: 9 };
  }
  if (isInRange(element.z, ACTINIDE_RANGE)) {
    return { column: element.z - ACTINIDE_RANGE[0] + 3, row: 10 };
  }
  if (!element.group || !element.period) return null;
  return { column: element.group, row: element.period };
}

export function PeriodicTableDialog({
  open,
  onOpenChange,
  lessonId,
  onPlace,
  sheet,
  canDraw,
  color,
  boardWidth,
  boardHeight,
  strokes,
}: PeriodicTableDialogProps) {
  const { t } = useTranslation("board");
  const table = usePeriodicTable(open);
  const addStrokes = useAddStrokes(lessonId ?? "");
  const [selectedZ, setSelectedZ] = useState<number | null>(null);
  const [query, setQuery] = useState("");

  const elements = useMemo(() => table.data ?? [], [table.data]);
  const selected = useMemo(
    () => elements.find((element) => element.z === selectedZ) ?? null,
    [elements, selectedZ]
  );

  const matches = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return null;
    return new Set(
      elements
        .filter(
          (element) =>
            element.symbol.toLowerCase() === term ||
            element.symbol.toLowerCase().startsWith(term) ||
            element.name.toLowerCase().includes(term) ||
            String(element.z) === term
        )
        .map((element) => element.z)
    );
  }, [elements, query]);

  const placement = {
    color,
    boardWidth,
    boardHeight,
    electronLabel: t("periodic.electronSuffix"),
  };

  function place(build: (origin: [number, number]) => StrokeInput[], blockHeight: number) {
    const origin = nextFlowPoint(strokes, { boardWidth, boardHeight, blockHeight });
    const next = build(origin);
    if (!next.length) return;
    if (onPlace) {
      onPlace(next);
      onOpenChange(false);
      return;
    }
    addStrokes.mutate({ sheet, strokes: next }, { onSuccess: () => onOpenChange(false) });
  }

  const placeCard = () =>
    selected &&
    place(
      (origin) => buildElementCardStrokes(selected, placement, origin),
      elementCardHeight(selected)
    );

  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      variant="confirm"
      width="lg:w-120"
      title={t("periodic.title")}
      description={t("periodic.description")}
      footer={
        <>
          <button
            type="button"
            className={dialogButton.secondary}
            disabled={!selected || !canDraw || !selected.shells.length || addStrokes.isPending}
            onClick={() =>
              selected &&
              place(
                (origin) => buildBohrStrokes(selected, placement, origin),
                bohrDiagramSize(selected, placement)
              )
            }
          >
            {t("periodic.placeBohr")}
          </button>
          <button
            type="button"
            className={dialogButton.primary}
            disabled={!selected || !canDraw || addStrokes.isPending}
            onClick={placeCard}
          >
            {t("periodic.placeCard")}
          </button>
        </>
      }
    >
      {table.isLoading ? (
        <p className="py-6 text-center text-body-sm text-ink-tertiary">{t("periodic.loading")}</p>
      ) : null}
      {table.isError ? (
        <p className="rounded-xl bg-error-bg px-4 py-3 text-body-sm text-error-text">
          {t("periodic.loadError")}
        </p>
      ) : null}

      {elements.length ? (
        <>
          <label className="flex h-12 items-center gap-2.5 rounded-md border border-transparent bg-subtle px-4 focus-within:border-focus focus-within:bg-surface">
            <Search size={18} className="shrink-0 text-ink-tertiary" />
            <input
              className="h-full min-w-0 flex-1 bg-transparent text-body text-ink outline-none placeholder:text-ink-tertiary"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("periodic.searchPlaceholder")}
              aria-label={t("periodic.searchPlaceholder")}
            />
          </label>

          <div
            className="periodic-grid overflow-x-auto"
            role="grid"
            aria-label={t("periodic.title")}
          >
            {elements.map((element) => {
              const position = cellPosition(element);
              if (!position) return null;
              const dimmed = matches ? !matches.has(element.z) : false;
              return (
                <button
                  key={element.z}
                  type="button"
                  role="gridcell"
                  className={`periodic-cell periodic-cell--${element.category} ${
                    element.z === selectedZ ? "is-active" : ""
                  } ${dimmed ? "is-dimmed" : ""}`}
                  style={{ gridColumn: position.column, gridRow: position.row }}
                  onClick={() => setSelectedZ(element.z)}
                  aria-pressed={element.z === selectedZ}
                >
                  <small>{element.z}</small>
                  <strong>{element.symbol}</strong>
                  <span>{element.name}</span>
                </button>
              );
            })}
          </div>

          <p className="text-caption text-ink-tertiary">
            {t("periodic.tableNote", { count: elements.length })}
          </p>

          {selected ? (
            <div className="flex items-center gap-4 rounded-md bg-subtle p-4">
              <span
                className={`periodic-detail-symbol periodic-cell--${selected.category} flex size-18 shrink-0 flex-col items-center justify-center rounded-md`}
              >
                <small className="text-micro opacity-70">{selected.z}</small>
                <strong className="font-heading text-h2">{selected.symbol}</strong>
              </span>

              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <strong className="truncate text-title text-ink">
                  {selected.name}
                  {selected.appearance ? ` · ${selected.appearance}` : ""}
                </strong>
                <small className="truncate text-body-xs text-ink-secondary">
                  {[
                    selected.period ? t("periodic.periodShort", { value: selected.period }) : "",
                    selected.group ? t("periodic.groupShort", { value: selected.group }) : "",
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </small>
                <small className="text-body-xs text-ink-secondary">
                  {[
                    selected.mass ? t("periodic.mass", { value: selected.mass }) : "",
                    selected.shells.length
                      ? `${t("periodic.shells")} ${selected.shells.join(" · ")}`
                      : "",
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </small>
              </span>
            </div>
          ) : (
            <p className="text-body-sm text-ink-tertiary">{t("periodic.pickHint")}</p>
          )}
        </>
      ) : null}
    </AppDialog>
  );
}
