import { useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Check, ChevronLeft, ChevronRight, X } from "lucide-react";
import { Icon } from "@/shared/ui/icon";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useCourseStudents } from "@/modules/course";
import type { BoardSource, FormulaSolutionDto, Point, StrokeShapeDto, TextLineDto } from "../api/board.dto";
import { BOARD_COLORS, BOARD_TEXT_SIZE, BOARD_WIDTHS } from "../constants/board.constants";
import { FLOW_MARGIN, nextTextPoint, strokeSpan } from "../lib/board-flow";
import { buildStroke } from "../lib/board.geometry";
import { hasRichFormatting, linesToPlainText } from "../lib/rich-text";
import {
  useAddSheet,
  useRenameSheet,
  useAddStroke,
  useBoard,
  useEraseStrokes,
  useSetBoardPermissions,
  useSolveFormula,
} from "../model/board.queries";
import { useBoardDrawing } from "../model/use-board-drawing";
import { useBoardRealtime } from "../model/use-board-realtime";
import { BoardStroke } from "./board-stroke";
import { BoardToolbar, type BoardTool } from "./board-toolbar";
import { BoardPagesSheet } from "./board-pages-sheet";
import { BoardPermissionDialog } from "./board-permission-dialog";
import { EraseReasonDialog } from "./erase-reason-dialog";
import { FormulaSolverDialog } from "./formula-solver-dialog";
import { FormulaPalette } from "./formula-palette";
import { MathFieldInput, type MathFieldInputHandle } from "./math-field-input";
import { PeriodicTableDialog } from "./periodic-table-dialog";
import { RichTextInput } from "./rich-text-input";

export interface BoardPanelProps {
  lessonId: string;
  courseId: string | null;
  currentUserId?: string | null;
  /** Doska holati yonida ko'rsatiladigan qo'shimcha izoh (masalan: "Dars tugagan"). */
  statusNote?: string;
  /** Doska ustida, o'ng pastda ko'rinadigan amallar (arxiv sahifasi uchun). */
  footerActions?: ReactNode;
  /** Berilsa - doska dars o'rniga shu manbadan ishlaydi (uy vazifasi doskasi): realtime va ruxsatlarsiz. */
  source?: BoardSource;
  /** Sahifa tashqaridan boshqarilsa (arxiv sahifasi). */
  sheetIndex?: number;
  onSheetChange?: (index: number) => void;
  /** Pastdagi sahifa paneli yashiriladi (sahifalar tashqarida ko'rsatilganda). */
  hideSheetBar?: boolean;
}

export function BoardPanel({
  lessonId,
  courseId,
  currentUserId,
  statusNote,
  footerActions,
  source,
  sheetIndex,
  onSheetChange,
  hideSheetBar = false,
}: BoardPanelProps) {
  const { t } = useTranslation("board");
  const realtime = useBoardRealtime(lessonId, !source, currentUserId);
  const board = useBoard(lessonId, { live: realtime.connected, enabled: !source });
  const addStroke = useAddStroke(lessonId);
  const addSheet = useAddSheet(lessonId);
  const erase = useEraseStrokes(lessonId);
  const permissions = useSetBoardPermissions(lessonId);
  const renameSheet = useRenameSheet(lessonId);
  const solve = useSolveFormula(lessonId);
  const members = useCourseStudents(board.data?.isTeacher ? courseId : null, { page_size: 100 });

  const [localSheet, setLocalSheet] = useState(0);
  const sheet = sheetIndex ?? localSheet;
  const setSheet = onSheetChange ?? setLocalSheet;
  const [tool, setTool] = useState<BoardTool>("pen");
  const [color, setColor] = useState<string>(BOARD_COLORS[0]);
  const [strokeWidth, setStrokeWidth] = useState<number>(BOARD_WIDTHS[1]);
  const [selected, setSelected] = useState<string | null>(null);

  const [reasonOpen, setReasonOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [grantOpen, setGrantOpen] = useState(false);
  const [pagesOpen, setPagesOpen] = useState(false);

  const [placement, setPlacement] = useState<{ tool: "text" | "math"; point: Point } | null>(null);
  const [draftText, setDraftText] = useState("");
  const [draftLines, setDraftLines] = useState<TextLineDto[]>([]);
  const mathFieldRef = useRef<MathFieldInputHandle>(null);

  const [formulaOpen, setFormulaOpen] = useState(false);
  const [periodicOpen, setPeriodicOpen] = useState(false);
  const [formula, setFormula] = useState("");
  const [solution, setSolution] = useState<FormulaSolutionDto | null>(null);

  const state = source ? source.state : board.data;
  const active = state?.sheets.find((item) => item.index === sheet) ?? state?.sheets[0];
  const canDraw = Boolean(state?.canDraw);

  const boardHeight = state?.height ?? 900;
  const canvasHeight = useMemo(() => {
    const bottom = (active?.strokes ?? []).reduce((max, stroke) => {
      const span = strokeSpan(stroke);
      return span ? Math.max(max, span.bottom) : max;
    }, 0);
    return Math.max(boardHeight, Math.ceil(bottom + FLOW_MARGIN));
  }, [active?.strokes, boardHeight]);

  function flowPointFor(lines: number): Point {
    return nextTextPoint(active?.strokes ?? [], {
      boardWidth: state?.width ?? 1200,
      boardHeight: canvasHeight,
      size: BOARD_TEXT_SIZE,
      lines,
    });
  }

  function commitStroke(stroke: StrokeShapeDto) {
    if (source) return source.addStroke(sheet, stroke);
    if (!realtime.sendStroke(sheet, stroke)) addStroke.mutate({ sheet, stroke });
  }

  const { svgRef, draft, handlePointerDown, handlePointerMove, handlePointerUp } = useBoardDrawing({
    width: state?.width ?? 1600,
    height: state?.height ?? 900,
    tool,
    color,
    strokeWidth,
    enabled: canDraw,
    onCommit: commitStroke,
    onPlacePoint: () => {
      if (tool !== "text" && tool !== "math") return;
      setDraftText("");
      setDraftLines([]);
      setPlacement({ tool, point: flowPointFor(1) });
    },
  });

  const draftPlainText = placement?.tool === "text" ? linesToPlainText(draftLines) : draftText;
  const adding = !source && addStroke.isPending;
  const canPlaceBlock = Boolean(draftPlainText.trim()) && !adding;

  function closePlacement() {
    setPlacement(null);
    setDraftText("");
    setDraftLines([]);
  }

  function placeBlock(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    if (!placement || !canPlaceBlock) return;
    let stroke: StrokeShapeDto;
    if (placement.tool === "math") {
      const [x, y] = flowPointFor(1);
      stroke = { type: "math", latex: draftText.trim(), x, y, size: BOARD_TEXT_SIZE, color };
    } else {
      const [x, y] = flowPointFor(Math.max(1, draftLines.length));
      stroke = {
        type: "text",
        text: draftPlainText,
        x,
        y,
        size: BOARD_TEXT_SIZE,
        color,
        ...(hasRichFormatting(draftLines) ? { lines: draftLines } : {}),
      };
    }

    if (source) {
      source.addStroke(sheet, stroke);
      closePlacement();
      return;
    }
    addStroke.mutate(
      { sheet, stroke },
      {
        onSuccess: closePlacement,
        onError: (error) => toast.error(error.message),
      }
    );
  }

  function handleStrokeClick(id: string) {
    if (tool !== "erase" || !canDraw) return;
    if (source) return source.eraseStroke(sheet, id); // shaxsiy doska: o'chirishga sabab so'ralmaydi
    setSelected(id);
    setReason("");
    setReasonOpen(true);
  }

  function closeReasonDialog() {
    setReasonOpen(false);
    setSelected(null);
    setReason("");
  }

  async function removeSelected() {
    if (!selected || !reason.trim()) return;
    try {
      await erase.mutateAsync({ sheet, strokeIds: [selected], reason: reason.trim() });
      closeReasonDialog();
      toast.success(t("eraseDialog.deleted"));
    } catch (error) {
      void error;
    }
  }

  async function solveFormula(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      setSolution(await (source ? source.solve!(formula) : solve.mutateAsync(formula)));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("formulaDialog.solveError"));
    }
  }

  function placeSolution() {
    if (!solution) return;
    const steps = solution.steps?.length ? `\n${solution.steps.join("\n")}` : "";
    const text = `${solution.pretty}\n${solution.result}${steps}`;
    const [x, y] = flowPointFor(text.split("\n").length);
    const stroke: StrokeShapeDto = { type: "text", text, x, y, size: BOARD_TEXT_SIZE, color };
    const done = () => {
      setFormulaOpen(false);
      setFormula("");
      setSolution(null);
    };
    if (source) {
      source.addStroke(sheet, stroke);
      done();
      return;
    }
    addStroke.mutate({ sheet, stroke }, { onSuccess: done });
  }

  function placeResultOnly() {
    if (!solution) return;
    const [x, y] = flowPointFor(1);
    const stroke: StrokeShapeDto = {
      type: "text",
      text: solution.result,
      x,
      y,
      size: BOARD_TEXT_SIZE,
      color,
    };
    const done = () => {
      setFormulaOpen(false);
      setFormula("");
      setSolution(null);
    };
    if (source) {
      source.addStroke(sheet, stroke);
      done();
      return;
    }
    addStroke.mutate({ sheet, stroke }, { onSuccess: done });
  }

  if (!source && board.isLoading)
    return (
      <div className="grid min-h-[320px] flex-1 place-items-center text-body-sm text-ink-tertiary">
        {t("status.loading")}
      </div>
    );
  if ((!source && board.isError) || !state)
    return (
      <div className="flex min-h-[320px] flex-1 flex-col items-center justify-center gap-3 text-center">
        <p className="text-body-sm text-ink-secondary">{board.error?.message}</p>
        <button
          type="button"
          className="flex h-11 items-center rounded-full bg-action px-5 text-label-strong text-on-action transition-colors hover:bg-action-hover"
          onClick={() => board.refetch()}
        >
          {t("status.retry")}
        </button>
      </div>
    );

  const preview =
    draft && tool !== "erase" && tool !== "text" && tool !== "math"
      ? buildStroke({ kind: tool, ...draft, color, width: strokeWidth })
      : null;


  return (
    <div className="board-panel flex min-h-0 flex-1 flex-col">
      <div
        data-theme="light"
        className="relative min-h-0 flex-1 overflow-hidden rounded-xl bg-surface"
      >
        <div className="board-canvas-wrap h-full">
          <svg
            ref={svgRef}
            className={`board-canvas board-canvas--${tool}`}
            viewBox={`0 0 ${state.width} ${canvasHeight}`}
            preserveAspectRatio="xMidYMin meet"
            style={{ aspectRatio: `${state.width} / ${canvasHeight}` }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            {active?.strokes.map((stroke) => (
              <BoardStroke
                key={stroke.id}
                stroke={stroke}
                selected={selected === stroke.id}
                onSelect={handleStrokeClick}
              />
            ))}
            {preview ? (
              <BoardStroke
                stroke={{ ...preview, id: "draft" }}
                selected={false}
                onSelect={() => undefined}
              />
            ) : null}
          </svg>

          {placement ? (
            <form
              ref={(node) => node?.scrollIntoView({ block: "nearest", behavior: "smooth" })}
              className={`board-inline-editor is-wide is-${placement.tool}`}
              style={{
                top: 0,
                left: `${(placement.point[0] / state.width) * 100}%`,
                marginTop: `${(placement.point[1] / state.width) * 100}%`,
              }}
              onPointerDown={(event) => event.stopPropagation()}
              onSubmit={placeBlock}
            >
              <span>{placement.tool === "math" ? t("inline.formula") : t("inline.text")}</span>
              {placement.tool === "math" ? (
                <>
                  <FormulaPalette onInsert={(latex) => mathFieldRef.current?.insert(latex)} />
                  <MathFieldInput ref={mathFieldRef} value={draftText} onChange={setDraftText} />
                </>
              ) : (
                <RichTextInput
                  onChange={setDraftLines}
                  onSubmit={() => placeBlock()}
                  onCancel={closePlacement}
                />
              )}
              <div className="board-inline-actions">
                <button type="button" onClick={closePlacement} aria-label={t("inline.cancelAria")}>
                  <X size={15} />
                </button>
                <button
                  type="submit"
                  className="is-primary"
                  disabled={!canPlaceBlock}
                  aria-label={t("inline.addAria")}
                >
                  <Check size={15} />
                </button>
              </div>
            </form>
          ) : null}
        </div>

        {!source && !realtime.connected ? (
          <div className="absolute inset-x-0 top-5 z-10 flex justify-center px-4">
            <p
              role="status"
              className="flex max-w-140 items-start gap-2.5 rounded-md bg-warning-bg px-4 py-3.5 text-body-sm text-warning-fg"
            >
              <Icon name="warning" size={18} className="mt-0.5 shrink-0" />
              {t("status.slowSyncNote")}
            </p>
          </div>
        ) : null}

        {canDraw ? (
          <div className="absolute top-1/2 left-4.5 z-10 -translate-y-1/2">
            <BoardToolbar
              tool={tool}
              color={color}
              width={strokeWidth}
              canDraw={canDraw}
              chemistryEnabled={state.chemistryEnabled}
              onToolChange={setTool}
              onColorChange={setColor}
              onWidthChange={setStrokeWidth}
              onPeriodic={() => setPeriodicOpen(true)}
            />
          </div>
        ) : null}

        {hideSheetBar ? null : (
        <div className="absolute inset-x-0 bottom-6 z-10 flex justify-center px-4">
          <div className="flex h-9 max-w-full items-center gap-3 overflow-x-auto rounded-full bg-surface px-4 shadow-lg">
            <button
              type="button"
              className="grid size-6 shrink-0 place-items-center rounded-full text-icon-tertiary transition-colors hover:bg-subtle hover:text-ink disabled:opacity-40"
              aria-label={t("sheet.prev")}
              disabled={sheet <= 0}
              onClick={() => setSheet(sheet - 1)}
            >
              <ChevronLeft size={16} />
            </button>

            <button
              type="button"
              className="shrink-0 text-caption-strong whitespace-nowrap text-ink"
              onClick={() => setPagesOpen(true)}
            >
              {t("sheet.pageOf", { page: sheet + 1, total: state.sheets.length })}
            </button>

            <button
              type="button"
              className="grid size-6 shrink-0 place-items-center rounded-full text-icon-tertiary transition-colors hover:bg-subtle hover:text-ink disabled:opacity-40"
              aria-label={t("sheet.next")}
              disabled={sheet >= state.sheets.length - 1}
              onClick={() => setSheet(sheet + 1)}
            >
              <ChevronRight size={16} />
            </button>

            {statusNote ? (
              <>
                <i className="not-italic text-caption text-ink-tertiary" aria-hidden="true">
                  ·
                </i>
                <span className="shrink-0 text-caption-strong whitespace-nowrap text-ink-tertiary">
                  {statusNote}
                </span>
              </>
            ) : null}

            {state.isTeacher || source ? (
              <>
                <i className="not-italic text-caption text-ink-tertiary" aria-hidden="true">
                  ·
                </i>
                <button
                  type="button"
                  className="shrink-0 text-caption-strong whitespace-nowrap text-brand transition-opacity hover:opacity-80"
                  onClick={() => (source ? source.addSheet() : addSheet.mutate())}
                >
                  + {t("sheet.addSheet")}
                </button>
              </>
            ) : null}

            {state.isTeacher ? (
              <>
                <i className="not-italic text-caption text-ink-tertiary" aria-hidden="true">
                  ·
                </i>
                <button
                  type="button"
                  className="shrink-0 text-caption-strong whitespace-nowrap text-success transition-opacity hover:opacity-80"
                  onClick={() => setGrantOpen(true)}
                >
                  {t(`permission.modes.${state.permissionMode}`)}
                </button>
              </>
            ) : (
              <>
                <i className="not-italic text-caption text-ink-tertiary" aria-hidden="true">
                  ·
                </i>
                <span
                  className={`shrink-0 text-caption-strong whitespace-nowrap ${
                    canDraw ? "text-success" : "text-ink-tertiary"
                  }`}
                >
                  {canDraw ? t("status.canDraw") : t("status.viewOnly")}
                </span>
              </>
            )}
          </div>
        </div>
        )}

        {footerActions ? (
          <div className="absolute right-4 bottom-4 z-10 flex flex-wrap items-center justify-end gap-2">
            {footerActions}
          </div>
        ) : null}
      </div>

      <EraseReasonDialog
        open={reasonOpen}
        pending={erase.isPending}
        reason={reason}
        onReasonChange={setReason}
        onCancel={closeReasonDialog}
        onConfirm={removeSelected}
      />

      <BoardPagesSheet
        open={pagesOpen}
        onOpenChange={setPagesOpen}
        sheets={state.sheets}
        active={sheet}
        boardWidth={state.width}
        boardHeight={state.height}
        canAdd={state.isTeacher || Boolean(source)}
        onSelect={(index) => {
          setSheet(index);
          setPagesOpen(false);
        }}
        onAdd={() => (source ? source.addSheet() : addSheet.mutate())}
        canRename={state.isTeacher && !source}
        onRename={(index, title) => renameSheet.mutate({ index, title })}
      />

      <BoardPermissionDialog
        open={grantOpen}
        onOpenChange={setGrantOpen}
        pending={permissions.isPending}
        students={(members.data?.items ?? []).map(({ student }) => ({
          id: student.id,
          name: student.name,
          username: student.username,
        }))}
        onSubmit={(input) =>
          permissions.mutate(input, {
            onSuccess: (result) => {
              toast.success(
                "mode" in input && input.mode === "none"
                  ? t("permissionDialog.revoked", { count: result.revoked ?? 0 })
                  : t("permissionDialog.saved", { count: result.granted ?? 0 })
              );
              setGrantOpen(false);
            },
          })
        }
      />

      <FormulaSolverDialog
        open={formulaOpen}
        onOpenChange={(next) => {
          setFormulaOpen(next);
          if (!next) {
            setFormula("");
            setSolution(null);
          }
        }}
        formula={formula}
        onFormulaChange={setFormula}
        solution={solution}
        solving={solve.isPending}
        placing={adding}
        canPlace={canDraw}
        onSolve={solveFormula}
        onPlace={placeSolution}
        onPlaceResultOnly={placeResultOnly}
      />

      <PeriodicTableDialog
        open={periodicOpen}
        onOpenChange={setPeriodicOpen}
        lessonId={source ? undefined : lessonId}
        onPlace={source ? (strokes) => source.addStrokes(sheet, strokes) : undefined}
        sheet={sheet}
        canDraw={canDraw}
        color={color}
        boardWidth={state.width}
        boardHeight={canvasHeight}
        strokes={active?.strokes ?? []}
      />
    </div>
  );
}
