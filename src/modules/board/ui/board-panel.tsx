import { useMemo, useRef, useState, type FormEvent } from "react";
import { Atom, Calculator, Check, Eye, FilePlus2, Pencil, UserCheck, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useCourseStudents } from "@/modules/course";
import { Button, Dialog, DialogContent } from "@/shared/ui/legacy";
import type { FormulaSolutionDto, Point, StrokeShapeDto, TextLineDto } from "../api/board.dto";
import { BOARD_COLORS, BOARD_TEXT_SIZE, BOARD_WIDTHS } from "../constants/board.constants";
import { FLOW_MARGIN, nextTextPoint, strokeSpan } from "../lib/board-flow";
import { buildStroke } from "../lib/board.geometry";
import { hasRichFormatting, linesToPlainText } from "../lib/rich-text";
import {
  useAddSheet,
  useAddStroke,
  useBoard,
  useEraseStrokes,
  useGrantDraw,
  useSolveFormula,
} from "../model/board.queries";
import { useBoardDrawing } from "../model/use-board-drawing";
import { useBoardRealtime } from "../model/use-board-realtime";
import { BoardStroke } from "./board-stroke";
import { BoardToolbar, type BoardTool } from "./board-toolbar";
import { FormulaPalette } from "./formula-palette";
import { MathFieldInput, type MathFieldInputHandle } from "./math-field-input";
import { PeriodicTableDialog } from "./periodic-table-dialog";
import { RichTextInput } from "./rich-text-input";

export interface BoardPanelProps {
  lessonId: string;
  courseId: string | null;
  currentUserId?: string | null;
}

export function BoardPanel({ lessonId, courseId, currentUserId }: BoardPanelProps) {
  const { t } = useTranslation("board");
  const realtime = useBoardRealtime(lessonId, true, currentUserId);
  const board = useBoard(lessonId, { live: realtime.connected });
  const addStroke = useAddStroke(lessonId);
  const addSheet = useAddSheet(lessonId);
  const erase = useEraseStrokes(lessonId);
  const grant = useGrantDraw(lessonId);
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

  const [placement, setPlacement] = useState<{ tool: "text" | "math"; point: Point } | null>(null);
  const [draftText, setDraftText] = useState("");
  const [draftLines, setDraftLines] = useState<TextLineDto[]>([]);
  const mathFieldRef = useRef<MathFieldInputHandle>(null);

  const [formulaOpen, setFormulaOpen] = useState(false);
  const [periodicOpen, setPeriodicOpen] = useState(false);
  const [formula, setFormula] = useState("");
  const [solution, setSolution] = useState<FormulaSolutionDto | null>(null);

  const state = board.data;
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
  const canPlaceBlock = Boolean(draftPlainText.trim()) && !addStroke.isPending;

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
    setSelected(id);
    setReason("");
    setReasonOpen(true);
  }

  function closeReasonDialog() {
    setReasonOpen(false);
    setSelected(null);
    setReason("");
  }

  async function removeSelected(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
      setSolution(await solve.mutateAsync(formula));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("formulaDialog.solveError"));
    }
  }

  function placeSolution() {
    if (!solution) return;
    const steps = solution.steps?.length ? `\n${solution.steps.join("\n")}` : "";
    const text = `${solution.pretty}\n${solution.result}${steps}`;
    const [x, y] = flowPointFor(text.split("\n").length);
    addStroke.mutate(
      {
        sheet,
        stroke: { type: "text", text, x, y, size: BOARD_TEXT_SIZE, color },
      },
      {
        onSuccess: () => {
          setFormulaOpen(false);
          setFormula("");
          setSolution(null);
        },
      }
    );
  }

  if (board.isLoading) return <div className="board-loading">{t("status.loading")}</div>;
  if (board.isError || !state)
    return (
      <div className="board-error">
        <p>{board.error?.message}</p>
        <Button onClick={() => board.refetch()}>{t("status.retry")}</Button>
      </div>
    );

  const preview =
    draft && tool !== "erase" && tool !== "text" && tool !== "math"
      ? buildStroke({ kind: tool, ...draft, color, width: strokeWidth })
      : null;

  return (
    <div className="board-panel">
      <div className="board-toolbar">
        <div className="board-status">
          <span
            className={`board-permission ${canDraw ? "is-can-draw" : ""}`}
            title={canDraw ? t("status.canDrawTitle") : t("status.viewOnlyTitle")}
          >
            {canDraw ? <Pencil size={13} /> : <Eye size={13} />}
            {canDraw ? t("status.canDraw") : t("status.viewOnly")}
          </span>
          <span
            className="board-live"
            title={realtime.connected ? t("status.liveConnectedTitle") : t("status.liveDisconnectedTitle")}
          >
            <i className={`board-live-dot ${realtime.connected ? "is-live" : ""}`} aria-hidden="true" />
            {realtime.connected ? t("status.live") : t("status.slowMode")}
          </span>
        </div>

        <div className="board-sheets">
          {state.sheets.map((item) => (
            <button
              key={item.index}
              type="button"
              className={sheet === item.index ? "is-active" : ""}
              onClick={() => setSheet(item.index)}
            >
              #{item.index + 1}
            </button>
          ))}
          {state.isTeacher ? (
            <Button size="sm" variant="secondary" onClick={() => addSheet.mutate()}>
              <FilePlus2 size={15} /> {t("sheet.addSheet")}
            </Button>
          ) : null}
        </div>

        <div className="board-toolbar-actions">
          {state.isTeacher ? (
            <Button size="sm" variant="secondary" onClick={() => setGrantOpen(true)}>
              <UserCheck size={15} /> {t("permission.grantButton")}
            </Button>
          ) : null}
          {state.mathEnabled ? (
            <Button size="sm" variant="secondary" onClick={() => setFormulaOpen(true)}>
              <Calculator size={15} /> {t("solver.button")}
            </Button>
          ) : null}
          {state.chemistryEnabled ? (
            <Button size="sm" variant="secondary" onClick={() => setPeriodicOpen(true)}>
              <Atom size={15} /> {t("periodic.button")}
            </Button>
          ) : null}
        </div>
      </div>

      <BoardToolbar
        tool={tool}
        color={color}
        width={strokeWidth}
        canDraw={canDraw}
        onToolChange={setTool}
        onColorChange={setColor}
        onWidthChange={setStrokeWidth}
      />

      <div className="board-canvas-wrap">
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
              <RichTextInput onChange={setDraftLines} onSubmit={() => placeBlock()} onCancel={closePlacement} />
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

      <Dialog
        open={reasonOpen}
        onOpenChange={(open) => (open ? setReasonOpen(true) : closeReasonDialog())}
      >
        {reasonOpen && (
          <DialogContent
            title={t("eraseDialog.title")}
            description={t("eraseDialog.description")}
          >
            <form className="dialog-form" onSubmit={removeSelected}>
              <label className="field-group">
                <span>{t("eraseDialog.reasonLabel")}</span>
                <div className="input-shell">
                  <input
                    autoFocus
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    required
                  />
                </div>
              </label>
              <div className="dialog-actions">
                <Button type="button" variant="secondary" onClick={closeReasonDialog}>
                  {t("eraseDialog.cancel")}
                </Button>
                <Button type="submit" loading={erase.isPending}>
                  {t("eraseDialog.confirm")}
                </Button>
              </div>
            </form>
          </DialogContent>
        )}
      </Dialog>

      <Dialog open={grantOpen} onOpenChange={setGrantOpen}>
        {grantOpen && (
          <DialogContent
            title={t("grantDialog.title")}
            description={t("grantDialog.description")}
          >
            <div className="board-student-list">
              {(members.data?.items ?? []).map(({ student }) => (
                <button
                  key={student.id}
                  disabled={grant.isPending}
                  onClick={() =>
                    grant.mutate(student.id, {
                      onSuccess: () => toast.success(t("grantDialog.granted", { name: student.name })),
                    })
                  }
                >
                  <span>
                    <strong>{student.name}</strong>
                    <small>@{student.username}</small>
                  </span>
                  <UserCheck size={17} />
                </button>
              ))}
              {!members.isLoading && !members.data?.items?.length ? <p>{t("grantDialog.noStudents")}</p> : null}
            </div>
          </DialogContent>
        )}
      </Dialog>

      <Dialog open={formulaOpen} onOpenChange={setFormulaOpen}>
        {formulaOpen && (
          <DialogContent title={t("formulaDialog.title")} description={t("formulaDialog.description")}>
            <form className="dialog-form" onSubmit={solveFormula}>
              <label className="field-group">
                <span>{t("formulaDialog.formulaLabel")}</span>
                <div className="input-shell">
                  <input
                    autoFocus
                    value={formula}
                    onChange={(event) => setFormula(event.target.value)}
                    required
                  />
                </div>
              </label>
              {solution ? (
                <div className="formula-solution">
                  <pre>{solution.pretty}</pre>
                  <strong>{solution.result}</strong>
                  {solution.steps?.map((step) => <p key={step}>{step}</p>)}
                </div>
              ) : null}
              <div className="dialog-actions">
                <Button type="submit" variant="secondary" loading={solve.isPending}>
                  {t("formulaDialog.solve")}
                </Button>
                {solution && canDraw ? (
                  <Button type="button" loading={addStroke.isPending} onClick={placeSolution}>
                    {t("formulaDialog.place")}
                  </Button>
                ) : null}
              </div>
            </form>
          </DialogContent>
        )}
      </Dialog>

      <PeriodicTableDialog
        open={periodicOpen}
        onOpenChange={setPeriodicOpen}
        lessonId={lessonId}
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
