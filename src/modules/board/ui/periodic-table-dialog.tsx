import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useIsCompact } from "@/shared/hooks/use-media-query";
import { AppDialog, dialogButton } from "@/shared/ui/app-dialog";
import { Icon } from "@/shared/ui/icon";
import { mobileButton } from "@/shared/ui/mobile-page";
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
  const isCompact = useIsCompact();
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

  const placeBohr = () =>
    selected &&
    place(
      (origin) => buildBohrStrokes(selected, placement, origin),
      bohrDiagramSize(selected, placement)
    );

  if (isCompact) {
    const mass = selected?.mass.replace(".", ",") ?? "";
    return (
      <AppDialog
        open={open}
        onOpenChange={onOpenChange}
        titleClassName="text-title-lg font-semibold"
        footerClassName="px-4 pt-5 pb-5"
        title={t("periodic.title")}
        description={t("periodic.description")}
        footer={
          <>
            <button
              type="button"
              className={`${mobileButton.secondary} whitespace-nowrap`}
              disabled={!selected || !canDraw || !selected.shells.length || addStrokes.isPending}
              onClick={placeBohr}
            >
              {t("periodic.placeBohr")}
            </button>
            <button
              type="button"
              className={`${mobileButton.primary} whitespace-nowrap`}
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
          <p className="rounded-xl bg-error-bg px-4 py-3 text-body-sm text-error-text">{t("periodic.loadError")}</p>
        ) : null}

        {elements.length ? (
          <>
            <label className="-mt-[3px] flex h-11 shrink-0 items-center gap-2.5 rounded-xl bg-subtle px-5">
              <Icon name="search" size={20} className="shrink-0 text-ink-secondary" />
              <input
                className="h-full min-w-0 flex-1 bg-transparent text-label-lg font-normal text-ink outline-none placeholder:text-ink-secondary"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t("periodic.searchMobile")}
                aria-label={t("periodic.searchMobile")}
              />
            </label>

            <div className="-mt-1 grid shrink-0 grid-cols-18 gap-px" role="grid" aria-label={t("periodic.title")}>
              {elements.map((element) => {
                const position = cellPosition(element);
                if (!position) return null;
                const active = element.z === selectedZ;
                const dimmed = matches ? !matches.has(element.z) : false;
                return (
                  <button
                    key={element.z}
                    type="button"
                    role="gridcell"
                    className={`grid h-[22px] min-w-0 place-items-center rounded-[4px] text-caption-strong transition-opacity ${
                      active ? "bg-brand text-on-action" : `periodic-chip--${element.category} text-ink`
                    } ${dimmed ? "opacity-30" : ""}`}
                    style={{ gridColumn: position.column, gridRow: position.row }}
                    aria-label={element.name}
                    aria-pressed={active}
                    onClick={() => setSelectedZ(element.z)}
                  >
                    {element.symbol}
                  </button>
                );
              })}
            </div>

            <p className="-mt-1 text-body-xs text-ink-secondary">{t("periodic.tableNote", { count: elements.length })}</p>

            {selected ? (
              <div className="-mt-1.5 flex shrink-0 items-center gap-3 rounded-xl bg-canvas px-4 py-[15px]">
                <span
                  className={`periodic-chip--${selected.category} flex size-16 shrink-0 flex-col items-center justify-center rounded-xl text-ink`}
                >
                  <small className="text-caption font-normal text-ink-secondary">{selected.z}</small>
                  <strong className="font-heading text-h1 leading-7 font-bold">{selected.symbol}</strong>
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <strong className="text-title text-ink">
                    {selected.name}
                    {selected.appearance ? ` · ${selected.appearance}` : ""}
                  </strong>
                  <small className="mt-[3px] text-body-sm text-ink-secondary">
                    {[
                      t(`periodic.categories.${selected.category}`, { defaultValue: "" }),
                      [
                        selected.period ? t("periodic.periodShort", { value: selected.period }) : "",
                        selected.group ? t("periodic.groupShort", { value: selected.group }) : "",
                      ]
                        .filter(Boolean)
                        .join(", "),
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </small>
                  <small className="mt-[3px] text-caption font-normal text-ink-secondary">
                    {[
                      mass ? t("periodic.massMobile", { value: mass }) : "",
                      selected.shells.length ? `${t("periodic.shells")} ${selected.shells.join(" · ")}` : "",
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
            onClick={placeBohr}
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
