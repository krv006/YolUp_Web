import { useMemo, useState } from "react";
import { Atom, Search } from "lucide-react";
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
import { BohrModel } from "./bohr-model";

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
      width="lg:w-[760px]"
      title={t("periodic.title")}
      description={t("periodic.description")}
      footer={
        <>
          <button
            type="button"
            className={dialogButton.secondary}
            onClick={() => onOpenChange(false)}
          >
            {t("periodic.close")}
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
          <label className="flex h-12 items-center gap-2.5 rounded-xl border border-line bg-surface px-3.5 focus-within:border-focus">
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
            <div className="flex flex-col gap-3 rounded-xl bg-subtle p-3.5">
              <div className="flex items-center gap-3">
                <span
                  className={`periodic-detail-symbol periodic-cell--${selected.category} grid size-14 shrink-0 place-items-center rounded-xl font-heading text-h2`}
                >
                  {selected.symbol}
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <strong className="truncate text-title text-ink">
                    {selected.name} · {selected.z}
                  </strong>
                  <small className="truncate text-caption text-ink-secondary">
                    {[
                      selected.appearance,
                      selected.mass ? t("periodic.mass", { value: selected.mass }) : "",
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </small>
                  <small className="truncate text-caption text-ink-tertiary">
                    {[
                      selected.period ? t("periodic.periodShort", { value: selected.period }) : "",
                      selected.group ? t("periodic.groupShort", { value: selected.group }) : "",
                      selected.valence ? t("periodic.valence") + ": " + selected.valence : "",
                      selected.shells.length ? selected.shells.join(" · ") : "",
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </small>
                </span>

                {canDraw && selected.shells.length ? (
                  <button
                    type="button"
                    className="flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-line bg-surface px-3 text-label-strong text-ink transition-colors hover:bg-muted disabled:opacity-50"
                    disabled={addStrokes.isPending}
                    onClick={() =>
                      place(
                        (origin) => buildBohrStrokes(selected, placement, origin),
                        bohrDiagramSize(selected, placement)
                      )
                    }
                  >
                    <Atom size={15} /> {t("periodic.placeBohr")}
                  </button>
                ) : null}
              </div>

              {selected.shells.length ? (
                <BohrModel
                  key={selected.z}
                  shells={selected.shells}
                  symbol={selected.symbol}
                  label={selected.name}
                />
              ) : (
                <p className="text-body-sm text-ink-tertiary">{t("periodic.noShells")}</p>
              )}
            </div>
          ) : (
            <p className="text-body-sm text-ink-tertiary">{t("periodic.pickHint")}</p>
          )}
        </>
      ) : null}
    </AppDialog>
  );
}
