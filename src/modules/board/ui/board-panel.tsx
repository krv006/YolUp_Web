import { useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Atom, Calculator, Check, Eye, FilePlus2, Pencil, UserCheck, X } from "lucide-react";
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
}

export function BoardPanel({
  lessonId,
  courseId,
  currentUserId,
  statusNote,
  footerActions,
  source,
}: BoardPanelProps) {
  const { t } = useTranslation("board");
  const realtime = useBoardRealtime(lessonId, !source, currentUserId);
  const board = useBoard(lessonId, { live: realtime.connected, enabled: !source });
  const addStroke = useAddStroke(lessonId);
  const addSheet = useAddSheet(lessonId);
  const erase = useEraseStrokes(lessonId);
  const permissions = useSetBoardPermissions(lessonId);
  const solve = useSolveFormula(lessonId);
  const members = useCourseStudents(board.data?.isTeacher ? courseId : null, { page_size: 100 });

  const [sheet, setSheet] = useState(0);
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

  const chip =
    "flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-subtle px-3 text-caption-strong text-ink-secondary transition-colors hover:bg-muted hover:text-ink";

  return (
    <div className="board-panel flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-caption-strong ${
            canDraw ? "text-success-text" : "text-ink-tertiary"
          }`}
          title={canDraw ? t("status.canDrawTitle") : t("status.viewOnlyTitle")}
        >
          {canDraw ? <Pencil size={13} /> : <Eye size={13} />}
          {canDraw ? t("status.canDraw") : t("status.viewOnly")}
        </span>

        {statusNote ? (
          <span className="flex h-8 shrink-0 items-center gap-1.5 text-caption-strong text-ink-tertiary">
            <i className="size-1.5 shrink-0 rounded-full bg-ink-tertiary" aria-hidden="true" />
            {statusNote}
          </span>
        ) : null}

        {source || statusNote ? null : (
          <span
            className="flex h-8 shrink-0 items-center gap-1.5 text-caption-strong text-ink-tertiary"
            title={
              realtime.connected
                ? t("status.liveConnectedTitle")
                : t("status.liveDisconnectedTitle")
            }
          >
            <i
              className={`size-1.5 shrink-0 rounded-full ${
                realtime.connected ? "bg-success" : "bg-saffron-strong"
              }`}
              aria-hidden="true"
            />
            {realtime.connected ? t("status.live") : t("status.slowMode")}
          </span>
        )}

        <span className="flex-1" />

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            className={`${chip} lg:hidden`}
            onClick={() => setPagesOpen(true)}
          >
            <FilePlus2 size={14} /> #{sheet + 1}
          </button>

          <span className="hidden items-center gap-1.5 lg:flex">
          {state.sheets.map((item) => (
            <button
              key={item.index}
              type="button"
              className={`grid h-8 min-w-8 shrink-0 place-items-center rounded-full px-2.5 text-caption-strong transition-colors ${
                sheet === item.index
                  ? "bg-action text-on-action"
                  : "bg-subtle text-ink-secondary hover:bg-muted hover:text-ink"
              }`}
              onClick={() => setSheet(item.index)}
            >
              #{item.index + 1}
            </button>
          ))}

          {state.isTeacher || source ? (
            <button
              type="button"
              className={chip}
              onClick={() => (source ? source.addSheet() : addSheet.mutate())}
            >
              <FilePlus2 size={14} /> {t("sheet.addSheet")}
            </button>
          ) : null}
          </span>

          {state.mathEnabled ? (
            <button type="button" className={chip} onClick={() => setFormulaOpen(true)}>
              <Calculator size={14} /> {t("solver.button")}
            </button>
          ) : null}

          {state.chemistryEnabled ? (
            <button type="button" className={chip} onClick={() => setPeriodicOpen(true)}>
              <Atom size={14} /> {t("periodic.button")}
            </button>
          ) : null}

          {state.isTeacher ? (
            <button type="button" className={chip} onClick={() => setGrantOpen(true)}>
              <UserCheck size={14} /> {t("permission.grantButton")}
            </button>
          ) : null}
        </div>
      </div>

      <div
        data-theme="light"
        className="relative min-h-0 flex-1 overflow-hidden rounded-2xl bg-surface"
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

        {canDraw ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-4 z-10 flex justify-center px-4">
            <div className="pointer-events-auto max-w-full overflow-x-auto rounded-2xl">
              <BoardToolbar
                tool={tool}
                color={color}
                width={strokeWidth}
                canDraw={canDraw}
                onToolChange={setTool}
                onColorChange={setColor}
                onWidthChange={setStrokeWidth}
              />
            </div>
          </div>
        ) : null}

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
