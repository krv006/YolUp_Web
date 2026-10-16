import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { Atom, Calculator, Check, FilePlus2, ImagePlus, Undo2, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button, Dialog, DialogContent } from "@/shared/ui/legacy";
import type {
  BoardPaper,
  FormulaSolutionDto,
  Point,
  StrokeDto,
  StrokeInput,
  StrokeShapeDto,
  TextLineDto,
} from "../api/board.dto";
import { BOARD_COLORS, BOARD_TEXT_SIZE, BOARD_WIDTHS } from "../constants/board.constants";
import { FLOW_MARGIN, nextFlowPoint, nextTextPoint, strokeSpan } from "../lib/board-flow";
import { compressImage } from "../lib/compress-image";
import { buildStroke } from "../lib/board.geometry";
import { hasRichFormatting, linesToPlainText } from "../lib/rich-text";
import { useBoardDrawing } from "../model/use-board-drawing";
import { BoardStroke } from "./board-stroke";
import { BoardToolbar, type BoardTool } from "./board-toolbar";
import { FormulaPalette } from "./formula-palette";
import { MathFieldInput, type MathFieldInputHandle } from "./math-field-input";
import { PeriodicTableDialog } from "./periodic-table-dialog";
import { RichTextInput } from "./rich-text-input";

const MAX_UNDO = 60;
const MAX_IMAGES = 6;
const PAPER_STEP = 40;
const RULED_STEP = 48;
const PAPERS: BoardPaper[] = ["blank", "dots", "grid", "ruled"];

export interface HomeworkBoardSheetState {
  strokes: StrokeDto[];
  paper: BoardPaper;
}

function newId(): string {
  return globalThis.crypto.randomUUID().replace(/-/g, "").slice(0, 12);
}

function PaperLayer({ paper, width, height }: { paper: BoardPaper; width: number; height: number }) {
  if (paper === "blank") return null;
  const id = `hw-paper-${paper}`;
  return (
    <g pointerEvents="none">
      <defs>
        {paper === "dots" ? (
          <pattern id={id} width={PAPER_STEP} height={PAPER_STEP} patternUnits="userSpaceOnUse">
            <circle cx={PAPER_STEP} cy={PAPER_STEP} r={1.6} fill="#bec3d2" />
          </pattern>
        ) : null}
        {paper === "grid" ? (
          <pattern id={id} width={PAPER_STEP} height={PAPER_STEP} patternUnits="userSpaceOnUse">
            <path d={`M ${PAPER_STEP} 0 V ${PAPER_STEP} M 0 ${PAPER_STEP} H ${PAPER_STEP}`} fill="none" stroke="#e2e8f0" strokeWidth={1} />
          </pattern>
        ) : null}
        {paper === "ruled" ? (
          <pattern id={id} width={RULED_STEP} height={RULED_STEP} patternUnits="userSpaceOnUse">
            <path d={`M 0 ${RULED_STEP} H ${RULED_STEP}`} fill="none" stroke="#cbd5e1" strokeWidth={1} />
          </pattern>
        ) : null}
      </defs>
      <rect x={0} y={0} width={width} height={height} fill={`url(#${id})`} />
    </g>
  );
}

export interface HomeworkBoardEditorProps {
  /** Har sheet — chiziqlar va daftar turi. */
  initialSheets: HomeworkBoardSheetState[];
  /** Fanga mos standart daftar turi (yangi sahifa shu bilan ochiladi). */
  defaultPaper: BoardPaper;
  width: number;
  height: number;
  mathEnabled: boolean;
  chemistryEnabled: boolean;
  /** Har o'zgarishdan keyin to'liq holat (ota-komponent avtosaqlashni o'zi boshqaradi). */
  onChange: (sheets: HomeworkBoardSheetState[]) => void;
  onSolve: (expression: string) => Promise<FormulaSolutionDto>;
}

/**
 * Uy vazifasi doskasi: dars doskasining barcha asboblari (qalam, marker, shakllar, matn, formula, o'chirgich,
 * formula yechuvchi, davriy jadval), lekin shaxsiy — realtime va ruxsatlarsiz; o'chirishga sabab kerak emas, bekor qilish
 * (undo) bor. Holat shu yerda saqlanadi va `onChange` orqali ota-komponentga uzatiladi.
 */
export function HomeworkBoardEditor({
  initialSheets,
  defaultPaper,
  width,
  height,
  mathEnabled,
  chemistryEnabled,
  onChange,
  onSolve,
}: HomeworkBoardEditorProps) {
  const { t } = useTranslation("board");
  const [sheets, setSheets] = useState<HomeworkBoardSheetState[]>(() =>
    initialSheets.length ? initialSheets : [{ strokes: [], paper: defaultPaper }]
  );
  const [history, setHistory] = useState<HomeworkBoardSheetState[][]>([]);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [sheet, setSheet] = useState(0);
  const [tool, setTool] = useState<BoardTool>("pen");
  const [color, setColor] = useState<string>(BOARD_COLORS[0]);
  const [strokeWidth, setStrokeWidth] = useState<number>(BOARD_WIDTHS[1]);

  const [placement, setPlacement] = useState<{ tool: "text" | "math"; point: Point } | null>(null);
  const [draftText, setDraftText] = useState("");
  const [draftLines, setDraftLines] = useState<TextLineDto[]>([]);
  const mathFieldRef = useRef<MathFieldInputHandle>(null);

  const [formulaOpen, setFormulaOpen] = useState(false);
  const [periodicOpen, setPeriodicOpen] = useState(false);
  const [formula, setFormula] = useState("");
  const [solution, setSolution] = useState<FormulaSolutionDto | null>(null);
  const [solving, setSolving] = useState(false);

  const active = useMemo(() => sheets[sheet]?.strokes ?? [], [sheets, sheet]);
  const paper = sheets[sheet]?.paper ?? defaultPaper;
  const imageCount = sheets.reduce((sum, item) => sum + item.strokes.filter((stroke) => stroke.type === "image").length, 0);

  const canvasHeight = useMemo(() => {
    const bottom = active.reduce((max, stroke) => {
      const span = strokeSpan(stroke);
      return span ? Math.max(max, span.bottom) : max;
    }, 0);
    return Math.max(height, Math.ceil(bottom + FLOW_MARGIN));
  }, [active, height]);

  function apply(next: HomeworkBoardSheetState[], remember = true) {
    if (remember) setHistory((current) => [...current.slice(-(MAX_UNDO - 1)), sheets]);
    setSheets(next);
    onChange(next);
  }

  function commitMany(strokes: StrokeInput[], target = sheet) {
    if (!strokes.length) return;
    const added = strokes.map((stroke) => ({ ...stroke, id: newId() }) as StrokeDto);
    apply(sheets.map((item, index) => (index === target ? { ...item, strokes: [...item.strokes, ...added] } : item)));
  }

  function setPaper(next: BoardPaper) {
    apply(sheets.map((item, index) => (index === sheet ? { ...item, paper: next } : item)));
  }

  async function pickImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (imageCount >= MAX_IMAGES) return toast.error(t("homeworkBoard.tooManyImages", { max: MAX_IMAGES }));
    try {
      const image = await compressImage(file);
      const scale = Math.min(1, 760 / image.width, 520 / image.height);
      const w = Math.round(image.width * scale);
      const h = Math.round(image.height * scale);
      const [x, y] = nextFlowPoint(active, { boardWidth: width, boardHeight: canvasHeight, blockHeight: h });
      commitMany([{ type: "image", src: image.src, x, y, w, h }]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("homeworkBoard.imageError"));
    }
  }

  function undo() {
    setHistory((current) => {
      const previous = current[current.length - 1];
      if (!previous) return current;
      setSheets(previous);
      onChange(previous);
      setSheet((index) => Math.min(index, previous.length - 1));
      return current.slice(0, -1);
    });
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();
        undo();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function flowPointFor(lines: number): Point {
    return nextTextPoint(active, { boardWidth: width, boardHeight: canvasHeight, size: BOARD_TEXT_SIZE, lines });
  }

  const { svgRef, draft, handlePointerDown, handlePointerMove, handlePointerUp } = useBoardDrawing({
    width,
    height,
    tool,
    color,
    strokeWidth,
    enabled: true,
    onCommit: (stroke: StrokeShapeDto) => commitMany([stroke]),
    onPlacePoint: () => {
      if (tool !== "text" && tool !== "math") return;
      setDraftText("");
      setDraftLines([]);
      setPlacement({ tool, point: flowPointFor(1) });
    },
  });

  const draftPlainText = placement?.tool === "text" ? linesToPlainText(draftLines) : draftText;
  const canPlaceBlock = Boolean(draftPlainText.trim());

  function closePlacement() {
    setPlacement(null);
    setDraftText("");
    setDraftLines([]);
  }

  function placeBlock(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    if (!placement || !canPlaceBlock) return;
    if (placement.tool === "math") {
      const [x, y] = flowPointFor(1);
      commitMany([{ type: "math", latex: draftText.trim(), x, y, size: BOARD_TEXT_SIZE, color }]);
    } else {
      const [x, y] = flowPointFor(Math.max(1, draftLines.length));
      commitMany([
        {
          type: "text",
          text: draftPlainText,
          x,
          y,
          size: BOARD_TEXT_SIZE,
          color,
          ...(hasRichFormatting(draftLines) ? { lines: draftLines } : {}),
        },
      ]);
    }
    closePlacement();
  }

  function eraseStroke(id: string) {
    if (tool !== "erase") return;
    apply(
      sheets.map((item, index) =>
        index === sheet ? { ...item, strokes: item.strokes.filter((stroke) => stroke.id !== id) } : item
      )
    );
  }

  function addSheet() {
    apply([...sheets, { strokes: [], paper }]);
    setSheet(sheets.length);
  }

  async function solveFormula(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSolving(true);
    try {
      setSolution(await onSolve(formula));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("formulaDialog.solveError"));
    } finally {
      setSolving(false);
    }
  }

  function placeSolution() {
    if (!solution) return;
    const steps = solution.steps?.length ? `\n${solution.steps.join("\n")}` : "";
    const text = `${solution.pretty}\n${solution.result}${steps}`;
    const [x, y] = flowPointFor(text.split("\n").length);
    commitMany([{ type: "text", text, x, y, size: BOARD_TEXT_SIZE, color }]);
    setFormulaOpen(false);
    setFormula("");
    setSolution(null);
  }

  const preview =
    draft && tool !== "erase" && tool !== "text" && tool !== "math"
      ? buildStroke({ kind: tool, ...draft, color, width: strokeWidth })
      : null;

  return (
    <div className="board-panel homework-board">
      <div className="board-toolbar">
        <div className="board-sheets">
          {sheets.map((_items, index) => (
            <button key={index} type="button" className={sheet === index ? "is-active" : ""} onClick={() => setSheet(index)}>
              #{index + 1}
            </button>
          ))}
          <Button size="sm" variant="secondary" onClick={addSheet} disabled={sheets.length >= 20}>
            <FilePlus2 size={15} /> {t("sheet.addSheet")}
          </Button>
        </div>

        <div className="board-toolbar-actions">
          <div className="homework-board-papers" role="group" aria-label={t("homeworkBoard.paper")}>
            {PAPERS.map((item) => (
              <button key={item} type="button" className={paper === item ? "is-active" : ""} onClick={() => setPaper(item)}>
                {t(`homeworkBoard.papers.${item}`)}
              </button>
            ))}
          </div>
          <input ref={imageInputRef} type="file" accept="image/*" hidden onChange={pickImage} />
          <Button size="sm" variant="secondary" onClick={() => imageInputRef.current?.click()}>
            <ImagePlus size={15} /> {t("homeworkBoard.image")}
          </Button>
          <Button size="sm" variant="secondary" onClick={undo} disabled={!history.length}>
            <Undo2 size={15} /> {t("homeworkBoard.undo")}
          </Button>
          {mathEnabled ? (
            <Button size="sm" variant="secondary" onClick={() => setFormulaOpen(true)}>
              <Calculator size={15} /> {t("solver.button")}
            </Button>
          ) : null}
          {chemistryEnabled ? (
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
        canDraw
        onToolChange={setTool}
        onColorChange={setColor}
        onWidthChange={setStrokeWidth}
      />

      <div className="board-canvas-wrap">
        <svg
          ref={svgRef}
          className={`board-canvas board-canvas--${tool}`}
          viewBox={`0 0 ${width} ${canvasHeight}`}
          preserveAspectRatio="xMidYMin meet"
          style={{ aspectRatio: `${width} / ${canvasHeight}` }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <PaperLayer paper={paper} width={width} height={canvasHeight} />
          {active.map((stroke) => (
            <BoardStroke key={stroke.id} stroke={stroke} selected={false} onSelect={eraseStroke} />
          ))}
          {preview ? (
            <BoardStroke stroke={{ ...preview, id: "draft" }} selected={false} onSelect={() => undefined} />
          ) : null}
        </svg>

        {placement ? (
          <form
            ref={(node) => node?.scrollIntoView({ block: "nearest", behavior: "smooth" })}
            className={`board-inline-editor is-wide is-${placement.tool}`}
            style={{
              top: 0,
              left: `${(placement.point[0] / width) * 100}%`,
              marginTop: `${(placement.point[1] / width) * 100}%`,
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
              <button type="submit" className="is-primary" disabled={!canPlaceBlock} aria-label={t("inline.addAria")}>
                <Check size={15} />
              </button>
            </div>
          </form>
        ) : null}
      </div>

      <Dialog open={formulaOpen} onOpenChange={setFormulaOpen}>
        {formulaOpen && (
          <DialogContent title={t("formulaDialog.title")} description={t("formulaDialog.description")}>
            <form className="dialog-form" onSubmit={solveFormula}>
              <label className="field-group">
                <span>{t("formulaDialog.formulaLabel")}</span>
                <div className="input-shell">
                  <input autoFocus value={formula} onChange={(event) => setFormula(event.target.value)} required />
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
                <Button type="submit" variant="secondary" loading={solving}>
                  {t("formulaDialog.solve")}
                </Button>
                {solution ? (
                  <Button type="button" onClick={placeSolution}>
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
        onPlace={(strokes) => commitMany(strokes)}
        sheet={sheet}
        canDraw
        color={color}
        boardWidth={width}
        boardHeight={canvasHeight}
        strokes={active}
      />
    </div>
  );
}
