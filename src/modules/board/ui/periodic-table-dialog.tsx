import { useMemo, useState } from "react";
import { Atom, PenLine, Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button, Dialog, DialogContent, LoadingFallback } from "@/shared/ui/legacy";
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open ? (
        <DialogContent
          className="periodic-dialog"
          title={t("periodic.title")}
          description={t("periodic.description")}
        >
          {table.isLoading ? <LoadingFallback label={t("periodic.loading")} /> : null}
          {table.isError ? <div className="form-alert">{t("periodic.loadError")}</div> : null}

          {elements.length ? (
            <div className="periodic-body">
              <div className="periodic-search">
                <Search size={15} />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={t("periodic.searchPlaceholder")}
                  aria-label={t("periodic.searchPlaceholder")}
                />
              </div>

              <div className="periodic-grid" role="grid" aria-label={t("periodic.title")}>
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

              {selected ? (
                <div className="periodic-detail">
                  <div className="periodic-detail-head">
                    <span className={`periodic-detail-symbol periodic-cell--${selected.category}`}>
                      {selected.symbol}
                    </span>
                    <div>
                      <strong>{selected.name}</strong>
                      <small>
                        {t("periodic.atomicNumber", { count: selected.z })}
                        {selected.mass ? ` · ${t("periodic.mass", { value: selected.mass })}` : ""}
                      </small>
                    </div>
                  </div>

                  <dl className="periodic-facts">
                    {selected.valence ? (
                      <div>
                        <dt>{t("periodic.valence")}</dt>
                        <dd>{selected.valence}</dd>
                      </div>
                    ) : null}
                    {selected.period ? (
                      <div>
                        <dt>{t("periodic.period")}</dt>
                        <dd>{selected.period}</dd>
                      </div>
                    ) : null}
                    {selected.group ? (
                      <div>
                        <dt>{t("periodic.group")}</dt>
                        <dd>{selected.group}</dd>
                      </div>
                    ) : null}
                    {selected.shells.length ? (
                      <div>
                        <dt>{t("periodic.shells")}</dt>
                        <dd>{selected.shells.join(" · ")}</dd>
                      </div>
                    ) : null}
                  </dl>

                  {selected.appearance ? (
                    <p className="periodic-appearance">{selected.appearance}</p>
                  ) : null}

                  {canDraw ? (
                    <div className="periodic-place-actions">
                      <Button
                        size="sm"
                        variant="secondary"
                        loading={addStrokes.isPending}
                        onClick={() =>
                          place(
                            (origin) => buildElementCardStrokes(selected, placement, origin),
                            elementCardHeight(selected)
                          )
                        }
                      >
                        <PenLine size={15} /> {t("periodic.placeCard")}
                      </Button>
                      {selected.shells.length ? (
                        <Button
                          size="sm"
                          loading={addStrokes.isPending}
                          onClick={() =>
                            place(
                              (origin) => buildBohrStrokes(selected, placement, origin),
                              bohrDiagramSize(selected, placement)
                            )
                          }
                        >
                          <Atom size={15} /> {t("periodic.placeBohr")}
                        </Button>
                      ) : null}
                    </div>
                  ) : null}

                  {selected.shells.length ? (
                    <BohrModel
                      key={selected.z}
                      shells={selected.shells}
                      symbol={selected.symbol}
                      label={selected.name}
                    />
                  ) : (
                    <p className="portal-muted">{t("periodic.noShells")}</p>
                  )}
                </div>
              ) : (
                <p className="portal-muted periodic-hint">{t("periodic.pickHint")}</p>
              )}
            </div>
          ) : null}
        </DialogContent>
      ) : null}
    </Dialog>
  );
}
