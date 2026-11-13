import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type FormEvent, type PointerEvent, type ReactNode } from "react";
import { Check, ChevronLeft, ChevronRight, Eye, Pencil, Users, Wifi, X } from "lucide-react";
import { useIsCompact } from "@/shared/hooks/use-media-query";
import { Icon } from "@/shared/ui/icon";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useAuth } from "@/modules/auth";
import { useCourseStudents } from "@/modules/course";
import type {
  BoardSource,
  FormulaSolutionDto,
  Point,
  StrokeDto,
  StrokeShapeDto,
  StrokeUpdate,
  TextLineDto,
} from "../api/board.dto";
import {
  BOARD_COLORS,
  BOARD_TEXT_SIZE,
  BOARD_WIDTHS,
  CODE_TEXT_COLOR,
  CODE_TEXT_SIZE,
  ERASER_SIZES,
  MOBILE_BOARD_COLORS,
  MOBILE_BOARD_WIDTHS,
} from "../constants/board.constants";
import {
  estimateTextWidth,
  FLOW_MARGIN,
  freeTextBaseline,
  nextTextPoint,
  strokeSpan,
  type BoardObstacle,
} from "../lib/board-flow";
import { canEditStroke } from "../lib/board-edit";
import { resizedBox, resizeHandles } from "../lib/board-resize";
import { buildStroke } from "../lib/board.geometry";
import { clientToBoard, measureNode, textWidth } from "../lib/board-measure";
import { strokesAlong } from "../lib/board-select";
import { BOARD_ZOOM, clampZoom, zoomScroll } from "../lib/board-zoom";
import { BoardZoomControls } from "./board-zoom-controls";
import { CODE_PAD, detectCodeLanguage } from "../lib/code-highlight";
import { hasRichFormatting, linesToPlainText, plainTextToLines } from "../lib/rich-text";
import {
  useAddSheet,
  useRenameSheet,
  useSetCurrentSheet,
  useAddStroke,
  useBoard,
  useEraseStrokes,
  useSetBoardPermissions,
  useSolveFormula,
  useUpdateStroke,
} from "../model/board.queries";
import { useBoardDrawing } from "../model/use-board-drawing";
import { useBoardRealtime } from "../model/use-board-realtime";
import { useBoardSelection } from "../model/use-board-selection";
import { BoardStroke } from "./board-stroke";
import { BoardToolbar, type BoardTool } from "./board-toolbar";
import { CodeEditor } from "./code-editor";
import {
  MobileBoardFooter,
  MobileBoardHeader,
  MobileBoardPill,
  MobileBoardToolbar,
} from "./board-mobile";
import { BoardPagesSheet } from "./board-pages-sheet";
import { BoardPermissionDialog } from "./board-permission-dialog";
import { EraseReasonDialog } from "./erase-reason-dialog";
import { FormulaSolverDialog } from "./formula-solver-dialog";
import { FormulaPalette } from "./formula-palette";
import { InlineTextEditor } from "./inline-text-editor";
import { MathFieldInput, type MathFieldInputHandle } from "./math-field-input";
import { PeriodicTableDialog } from "./periodic-table-dialog";
import { RichTextInput } from "./rich-text-input";
import { SelectionOverlay } from "./selection-overlay";
import { SelectionToolbar } from "./selection-toolbar";

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
  mobile?: BoardMobileChrome;
}

export interface BoardMobileChrome {
  title?: string;
  subtitle: ReactNode;
  live?: boolean;
  backLabel: string;
  onBack: () => void;
  action?: ReactNode;
  footer?: ReactNode;
}

type PlacedTool = "text" | "math" | "code";

interface InlineText {
  anchor: Point;
  size: number;
  color: string;
  original: string;
  obstacles?: BoardObstacle[];
}

const PENDING_TEXT_MS = 8000;

function sameText(stroke: StrokeDto, pending: StrokeDto): boolean {
  return (
    stroke.type === "text" &&
    pending.type === "text" &&
    stroke.text.trim() === pending.text.trim() &&
    Math.abs(stroke.x - pending.x) < 1 &&
    Math.abs(stroke.y - pending.y) < 1
  );
}

function strokeKey(stroke: StrokeShapeDto): string {
  return JSON.stringify(stroke, (key, value) =>
    key === "id" ? undefined : typeof value === "number" ? Math.round(value * 10) / 10 : value
  );
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
  mobile,
}: BoardPanelProps) {
  const { t } = useTranslation("board");
  const isCompact = useIsCompact();
  const mobileLayout = Boolean(isCompact && mobile);
  const { user } = useAuth();
  const userId = currentUserId ?? user?.id ?? null;
  const realtime = useBoardRealtime(lessonId, !source, userId);
  const board = useBoard(lessonId, { live: realtime.connected, enabled: !source });
  const addStroke = useAddStroke(lessonId);
  const addSheet = useAddSheet(lessonId);
  const erase = useEraseStrokes(lessonId);
  const updateMutation = useUpdateStroke(lessonId);
  const permissions = useSetBoardPermissions(lessonId);
  const renameSheet = useRenameSheet(lessonId);
  const solve = useSolveFormula(lessonId);
  const currentSheet = useSetCurrentSheet(lessonId);
  const members = useCourseStudents(board.data?.isTeacher ? courseId : null, { page_size: 100 });

  const [localSheet, setLocalSheet] = useState(0);
  const sheet = sheetIndex ?? localSheet;
  const setSheet = onSheetChange ?? setLocalSheet;
  const [tool, setTool] = useState<BoardTool>("pen");
  const [color, setColor] = useState<string>(mobileLayout ? MOBILE_BOARD_COLORS[1] : BOARD_COLORS[0]);
  const [strokeWidth, setStrokeWidth] = useState<number>(mobileLayout ? MOBILE_BOARD_WIDTHS[1] : BOARD_WIDTHS[1]);
  const [textSize, setTextSize] = useState<number>(BOARD_TEXT_SIZE);
  const [eraserSize, setEraserSize] = useState<number>(ERASER_SIZES[1].value);
  const [eraserAt, setEraserAt] = useState<Point | null>(null);
  const [erasing, setErasing] = useState<string[] | null>(null);
  const [eraseIds, setEraseIds] = useState<string[]>([]);
  const eraserLast = useRef<Point | null>(null);
  const [history, setHistory] = useState<Array<{ sheet: number; shape: StrokeShapeDto }>>([]);
  const [redoStack, setRedoStack] = useState<Array<{ sheet: number; shape: StrokeShapeDto }>>([]);
  const [selected, setSelected] = useState<string | null>(null);

  const [reasonOpen, setReasonOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [grantOpen, setGrantOpen] = useState(false);
  const [pagesOpen, setPagesOpen] = useState(false);

  const [placement, setPlacement] = useState<{
    tool: PlacedTool;
    point: Point;
    editingId?: string;
    inline?: InlineText;
  } | null>(null);
  const [inlineText, setInlineText] = useState("");
  const inlineActive = useRef(false);
  const [pendingTexts, setPendingTexts] = useState<StrokeDto[]>([]);
  const [initialLines, setInitialLines] = useState<TextLineDto[] | undefined>(undefined);
  const [draftText, setDraftText] = useState("");
  const [draftLines, setDraftLines] = useState<TextLineDto[]>([]);
  const [draftCode, setDraftCode] = useState("");
  const [codeLanguage, setCodeLanguage] = useState("auto");
  const mathFieldRef = useRef<MathFieldInputHandle>(null);

  const [formulaOpen, setFormulaOpen] = useState(false);
  const [periodicOpen, setPeriodicOpen] = useState(false);
  const [formula, setFormula] = useState("");
  const [solution, setSolution] = useState<FormulaSolutionDto | null>(null);

  const state = source ? source.state : board.data;
  const active = state?.sheets.find((item) => item.index === sheet) ?? state?.sheets[0];
  const canDraw = Boolean(state?.canDraw);
  const followSheet = !source && board.data && !board.data.isTeacher ? board.data.currentSheet : null;
  const lastFollowed = useRef<number | null>(null);

  useEffect(() => {
    if (followSheet === null || followSheet === lastFollowed.current) return;
    lastFollowed.current = followSheet;
    setSheet(followSheet);
  }, [followSheet, setSheet]);

  const { mutate: announceSheet } = currentSheet;
  function changeSheet(next: number) {
    setSheet(next);
    if (!source && board.data?.isTeacher) announceSheet(next);
  }

  const boardHeight = state?.height ?? 900;
  const boardWidth = state?.width ?? 1600;
  const [canvasWrap, setCanvasWrap] = useState<HTMLDivElement | null>(null);
  const [viewRatio, setViewRatio] = useState(0);
  const [viewWidth, setViewWidth] = useState(0);
  const [zoom, setZoom] = useState(1);
  const zoomRef = useRef(1);
  const pendingScroll = useRef<{ left: number; top: number } | null>(null);
  const gestureCancel = useRef<() => void>(() => undefined);

  const zoomBy = useCallback(
    (factor: number, clientX?: number, clientY?: number) => {
      const previous = zoomRef.current;
      const next = clampZoom(previous * factor);
      if (next === previous) return;
      if (canvasWrap) {
        const rect = canvasWrap.getBoundingClientRect();
        pendingScroll.current = zoomScroll(
          { left: canvasWrap.scrollLeft, top: canvasWrap.scrollTop },
          { x: (clientX ?? rect.left + rect.width / 2) - rect.left, y: (clientY ?? rect.top + rect.height / 2) - rect.top },
          next / previous
        );
      }
      zoomRef.current = next;
      setZoom(next);
    },
    [canvasWrap]
  );

  useLayoutEffect(() => {
    const pending = pendingScroll.current;
    if (!canvasWrap || !pending) return;
    pendingScroll.current = null;
    canvasWrap.scrollLeft = pending.left;
    canvasWrap.scrollTop = pending.top;
  }, [zoom, canvasWrap]);

  useEffect(() => {
    if (!canvasWrap) return undefined;
    let pinch: { distance: number; zoom: number; x: number; y: number } | null = null;
    const measure = (touches: TouchList) => ({
      distance: Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY),
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2,
    });
    const onWheel = (event: WheelEvent) => {
      if (!event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      zoomBy(Math.exp(-event.deltaY * 0.002), event.clientX, event.clientY);
    };
    const onTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 2) return;
      gestureCancel.current();
      pinch = { ...measure(event.touches), zoom: zoomRef.current };
    };
    const onTouchMove = (event: TouchEvent) => {
      if (!pinch || event.touches.length !== 2) return;
      event.preventDefault();
      const now = measure(event.touches);
      canvasWrap.scrollLeft -= now.x - pinch.x;
      canvasWrap.scrollTop -= now.y - pinch.y;
      pinch = { ...pinch, x: now.x, y: now.y };
      zoomBy((pinch.zoom * now.distance) / pinch.distance / zoomRef.current, now.x, now.y);
    };
    const onTouchEnd = (event: TouchEvent) => {
      if (event.touches.length < 2) pinch = null;
    };
    let gestureZoom = 1;
    const onGestureStart = (event: Event) => {
      event.preventDefault();
      gestureZoom = zoomRef.current;
    };
    const onGestureChange = (event: Event) => {
      event.preventDefault();
      if (pinch) return;
      const gesture = event as Event & { scale?: number; clientX?: number; clientY?: number };
      if (!gesture.scale) return;
      zoomBy((gestureZoom * gesture.scale) / zoomRef.current, gesture.clientX, gesture.clientY);
    };
    canvasWrap.addEventListener("wheel", onWheel, { passive: false });
    canvasWrap.addEventListener("touchstart", onTouchStart, { passive: true });
    canvasWrap.addEventListener("touchmove", onTouchMove, { passive: false });
    canvasWrap.addEventListener("touchend", onTouchEnd);
    canvasWrap.addEventListener("touchcancel", onTouchEnd);
    canvasWrap.addEventListener("gesturestart", onGestureStart);
    canvasWrap.addEventListener("gesturechange", onGestureChange);
    return () => {
      canvasWrap.removeEventListener("gesturestart", onGestureStart);
      canvasWrap.removeEventListener("gesturechange", onGestureChange);
      canvasWrap.removeEventListener("wheel", onWheel);
      canvasWrap.removeEventListener("touchstart", onTouchStart);
      canvasWrap.removeEventListener("touchmove", onTouchMove);
      canvasWrap.removeEventListener("touchend", onTouchEnd);
      canvasWrap.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [canvasWrap, zoomBy]);

  useEffect(() => {
    if (!canvasWrap) return undefined;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 0) {
        setViewRatio(height / width);
        setViewWidth(width);
      }
    });
    observer.observe(canvasWrap);
    return () => observer.disconnect();
  }, [canvasWrap]);

  const canvasHeight = useMemo(() => {
    const bottom = (active?.strokes ?? []).reduce((max, stroke) => {
      const span = strokeSpan(stroke);
      return span ? Math.max(max, span.bottom) : max;
    }, 0);
    return Math.max(boardHeight, Math.ceil(bottom + FLOW_MARGIN), Math.floor(boardWidth * viewRatio));
  }, [active?.strokes, boardHeight, boardWidth, viewRatio]);

  function flowPointFor(lines: number): Point {
    return nextTextPoint(active?.strokes ?? [], {
      boardWidth: state?.width ?? 1200,
      boardHeight: canvasHeight,
      size: BOARD_TEXT_SIZE,
      lines,
    });
  }

  function sendStroke(stroke: StrokeShapeDto) {
    if (source) return source.addStroke(sheet, stroke);
    if (!realtime.sendStroke(sheet, stroke)) addStroke.mutate({ sheet, stroke });
  }

  function commitStroke(stroke: StrokeShapeDto) {
    setHistory((current) => [...current, { sheet, shape: stroke }]);
    setRedoStack([]);
    sendStroke(stroke);
  }

  const lastOwn = history.filter((entry) => entry.sheet === sheet).at(-1) ?? null;
  const activeStrokes = active?.strokes;
  const undoTarget = useMemo(() => {
    if (!lastOwn) return null;
    const key = strokeKey(lastOwn.shape);
    return [...(activeStrokes ?? [])].reverse().find((stroke) => strokeKey(stroke) === key) ?? null;
  }, [activeStrokes, lastOwn]);

  function undo() {
    if (!lastOwn || !undoTarget) return;
    setHistory((current) => {
      const index = current.lastIndexOf(lastOwn);
      return current.filter((_, position) => position !== index);
    });
    setRedoStack((current) => [...current, lastOwn]);
    if (source) source.eraseStroke(sheet, undoTarget.id);
    else erase.mutate({ sheet, strokeIds: [undoTarget.id], reason: t("mobile.undoReason") });
  }

  function redo() {
    const entry = redoStack.at(-1);
    if (!entry) return;
    setRedoStack((current) => current.slice(0, -1));
    setHistory((current) => [...current, entry]);
    if (entry.sheet !== sheet) setSheet(entry.sheet);
    if (source) source.addStroke(entry.sheet, entry.shape);
    else if (!realtime.sendStroke(entry.sheet, entry.shape)) addStroke.mutate({ sheet: entry.sheet, stroke: entry.shape });
  }

  const { svgRef, draft, handlePointerDown, handlePointerMove, handlePointerUp, cancel: cancelDrawing } = useBoardDrawing({
    width: state?.width ?? 1600,
    height: state?.height ?? 900,
    tool,
    color,
    strokeWidth,
    enabled: canDraw,
    onCommit: commitStroke,
    onPlacePoint: (point) => {
      if (tool !== "text" && tool !== "math" && tool !== "code") return;
      if (tool === "text" && !mobileLayout) return placeInlineText(point);
      setDraftText("");
      setDraftLines([]);
      setDraftCode("");
      setPlacement({ tool, point });
    },
  });

  function updateStroke(strokeId: string, update: StrokeUpdate) {
    if (source) return source.updateStroke(sheet, strokeId, update);
    updateMutation.mutate({ sheet, strokeId, update });
  }

  const selection = useBoardSelection({
    svgRef,
    strokes: activeStrokes ?? [],
    sheet: { width: boardWidth, height: boardHeight },
    viewHeight: canvasHeight,
    active: tool === "select" && canDraw,
    canEdit: (stroke: StrokeDto) =>
      canEditStroke(stroke, { isTeacher: Boolean(state?.isTeacher), userId, personal: Boolean(source) }),
    onMove: (strokeId, delta) => updateStroke(strokeId, { move: delta }),
    onResize: (strokeId, changes) => updateStroke(strokeId, { changes }),
    onDenied: () => toast.info(t("edit.notOwner")),
    onOpen: openEditor,
  });

  const selectedStroke = selection.selected;
  useEffect(() => {
    if (!selectedStroke || placement || reasonOpen) return undefined;
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable='true'], [role='dialog']")) return;
      const step = event.shiftKey ? 10 : 1;
      const arrows: Record<string, [number, number]> = {
        ArrowLeft: [-step, 0],
        ArrowRight: [step, 0],
        ArrowUp: [0, -step],
        ArrowDown: [0, step],
      };
      if (arrows[event.key]) {
        event.preventDefault();
        selection.nudge(...arrows[event.key]);
      } else if (event.key === "Escape") {
        selection.clear();
      } else if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        deleteSelected(selectedStroke.id);
      } else if (event.key === "Enter") {
        event.preventDefault();
        openEditor(selectedStroke);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  function deleteSelected(strokeId: string) {
    selection.clear();
    if (source) return source.eraseStroke(sheet, strokeId);
    setSelected(strokeId);
    setReason(mobileLayout ? t("eraseDialog.reasons.wrongAnswer") : "");
    setReasonOpen(true);
  }
  const drag = selection.drag;

  const draftPlainText =
    placement?.tool === "text" ? linesToPlainText(draftLines) : placement?.tool === "code" ? draftCode : draftText;
  const adding = !source && addStroke.isPending;
  const canPlaceBlock = Boolean(draftPlainText.trim()) && !adding;

  function startInline(inline: InlineText, point: Point, editingId?: string) {
    inlineActive.current = true;
    setInlineText(inline.original);
    setPlacement({ tool: "text", point, editingId, inline });
  }

  function placeInlineText(point: Point) {
    if (inlineActive.current) return commitInline();
    const hit = selection.strokeAt(point);
    if (hit?.type === "text" && canEditStroke(hit, { isTeacher: Boolean(state?.isTeacher), userId, personal: Boolean(source) })) {
      return openEditor(hit);
    }
    const obstacles = textObstacles();
    const anchor = freeTextAnchor(anchorFor(point, "text")[0], point[1], "", textSize, obstacles);
    startInline({ anchor, size: textSize, color, original: "", obstacles }, point);
  }

  function typeInline(value: string) {
    setInlineText(value);
    const inline = placement?.inline;
    if (!placement || !inline?.obstacles) return;
    const anchor = freeTextAnchor(inline.anchor[0], placement.point[1], value, inline.size, inline.obstacles);
    if (anchor[1] !== inline.anchor[1]) setPlacement({ ...placement, inline: { ...inline, anchor } });
  }

  function textObstacles(): BoardObstacle[] {
    const svg = svgRef.current;
    return [...(activeStrokes ?? []), ...pendingTexts].flatMap((stroke) => {
      if (stroke.type !== "text" && stroke.type !== "math" && stroke.type !== "code") return [];
      const box = svg ? measureNode(svg, stroke.id) : null;
      if (box) return [{ left: box.minX, right: box.maxX, top: box.minY, bottom: box.maxY }];
      const span = strokeSpan(stroke);
      const content = stroke.type === "math" ? stroke.latex : stroke.text;
      const right = stroke.x + estimateTextWidth(content, stroke.size ?? BOARD_TEXT_SIZE);
      return span ? [{ left: stroke.x, right, ...span }] : [];
    });
  }

  function freeTextAnchor(x: number, y: number, text: string, size: number, obstacles: BoardObstacle[]): Point {
    const svg = svgRef.current;
    const measured = svg ? textWidth(text, size, getComputedStyle(svg).fontFamily) : null;
    const width = Math.max(size, measured ?? estimateTextWidth(text, size));
    const lines = text.split("\n").length;
    return [x, freeTextBaseline({ x, y, size, lines, width, obstacles, maxBaseline: boardHeight - 20 })];
  }

  function commitInline() {
    if (!inlineActive.current || !placement?.inline) return;
    inlineActive.current = false;
    const { inline, editingId } = placement;
    const text = inlineText.replace(/\s+$/, "");
    const point = placement.point;
    closePlacement();
    if (!text.trim()) return;
    if (editingId) {
      if (text !== inline.original) updateStroke(editingId, { changes: { text, lines: [] } });
      return;
    }
    const [x, y] = inline.obstacles
      ? freeTextAnchor(inline.anchor[0], point[1], text, inline.size, inline.obstacles)
      : inline.anchor;
    const stroke: StrokeShapeDto = { type: "text", text, x, y, size: inline.size, color: inline.color };
    const pending = { ...stroke, id: `pending-${Date.now()}` } as StrokeDto;
    setPendingTexts((current) => [...current, pending]);
    globalThis.setTimeout(() => setPendingTexts((current) => current.filter((item) => item.id !== pending.id)), PENDING_TEXT_MS);
    commitStroke(stroke);
  }

  function closePlacement() {
    setPlacement(null);
    setInlineText("");
    setDraftText("");
    setDraftLines([]);
    setDraftCode("");
    setInitialLines(undefined);
  }

  function openEditor(stroke: StrokeDto) {
    if (stroke.type !== "text" && stroke.type !== "math" && stroke.type !== "code") return;
    if (stroke.type === "text" && !mobileLayout) {
      if (inlineActive.current) commitInline();
      startInline(
        { anchor: [stroke.x, stroke.y], size: stroke.size ?? BOARD_TEXT_SIZE, color: stroke.color ?? color, original: stroke.text },
        [stroke.x, stroke.y],
        stroke.id
      );
      return;
    }
    setDraftText("");
    setDraftLines([]);
    setDraftCode("");
    setInitialLines(undefined);
    if (stroke.type === "text") {
      const lines = stroke.lines?.length ? stroke.lines : plainTextToLines(stroke.text);
      setInitialLines(lines);
      setDraftLines(lines);
    } else if (stroke.type === "math") {
      setDraftText(stroke.latex);
    } else {
      setDraftCode(stroke.text);
      setCodeLanguage(stroke.language ?? "auto");
    }
    const size = stroke.size ?? (stroke.type === "code" ? CODE_TEXT_SIZE : BOARD_TEXT_SIZE);
    const point: Point =
      stroke.type === "code" ? [stroke.x - CODE_PAD, stroke.y - size * 1.05] : [stroke.x, stroke.y - BOARD_TEXT_SIZE * 0.35];
    setPlacement({ tool: stroke.type, point, editingId: stroke.id });
  }

  function saveEdit(strokeId: string, kind: PlacedTool) {
    if (kind === "math") {
      updateStroke(strokeId, { changes: { latex: draftText.trim() } });
    } else if (kind === "code") {
      const text = draftCode.replace(/\s+$/, "");
      updateStroke(strokeId, {
        changes: { text, language: codeLanguage === "auto" ? detectCodeLanguage(text) : codeLanguage },
      });
    } else {
      updateStroke(strokeId, {
        changes: { text: draftPlainText, lines: hasRichFormatting(draftLines) ? draftLines : [] },
      });
    }
    closePlacement();
  }

  function anchorFor(point: Point, kind: PlacedTool): Point {
    const width = state?.width ?? 1600;
    if (kind === "code") {
      return [Math.min(Math.max(point[0] + CODE_PAD, CODE_PAD), width - 40), point[1] + CODE_TEXT_SIZE * 1.05];
    }
    return [Math.min(Math.max(point[0], 8), width - 40), point[1] + BOARD_TEXT_SIZE * 0.35];
  }

  function placeBlock(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    if (!placement || !canPlaceBlock) return;
    if (placement.editingId) {
      saveEdit(placement.editingId, placement.tool);
      return;
    }
    let stroke: StrokeShapeDto;
    const [x, y] =
      placement.tool === "text"
        ? freeTextAnchor(
            anchorFor(placement.point, "text")[0],
            placement.point[1],
            draftPlainText,
            BOARD_TEXT_SIZE,
            textObstacles()
          )
        : anchorFor(placement.point, placement.tool);
    if (placement.tool === "math") {
      stroke = { type: "math", latex: draftText.trim(), x, y, size: BOARD_TEXT_SIZE, color };
    } else if (placement.tool === "code") {
      const text = draftCode.replace(/\s+$/, "");
      stroke = {
        type: "code",
        text,
        language: codeLanguage === "auto" ? detectCodeLanguage(text) : codeLanguage,
        x,
        y,
        size: CODE_TEXT_SIZE,
        color: CODE_TEXT_COLOR,
      };
    } else {
      stroke = {
        type: "text",
        text: draftPlainText,
        x,
        y,
        size: textSize,
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

  const handleStrokeClick = useCallback(() => undefined, []);

  const hiddenId = placement?.inline ? placement.editingId : undefined;
  const strokeNodes = useMemo(
    () =>
      (activeStrokes ?? []).map((stroke) => {
        if (stroke.id === hiddenId) return null;
        if (erasing?.includes(stroke.id)) {
          return (
            <g key={stroke.id} opacity={0.25}>
              <BoardStroke stroke={stroke} selected={false} onSelect={handleStrokeClick} />
            </g>
          );
        }
        if (drag?.kind === "resize" && drag.id === stroke.id) {
          return <BoardStroke key={stroke.id} stroke={drag.stroke} selected={false} onSelect={handleStrokeClick} />;
        }
        const node = (
          <BoardStroke key={stroke.id} stroke={stroke} selected={selected === stroke.id} onSelect={handleStrokeClick} />
        );
        return drag?.kind === "move" && drag.id === stroke.id ? (
          <g key={stroke.id} transform={`translate(${drag.dx} ${drag.dy})`}>
            {node}
          </g>
        ) : (
          node
        );
      }),
    [activeStrokes, selected, handleStrokeClick, drag, hiddenId, erasing]
  );
  const pendingNodes = pendingTexts
    .filter((pending) => !(activeStrokes ?? []).some((stroke) => sameText(stroke, pending)))
    .map((pending) => <BoardStroke key={pending.id} stroke={pending} selected={false} onSelect={() => undefined} />);

  function closeReasonDialog() {
    setReasonOpen(false);
    setSelected(null);
    setEraseIds([]);
    setReason("");
  }

  function eraserPoint(event: PointerEvent<SVGSVGElement>): Point {
    return clientToBoard(event.currentTarget, event.clientX, event.clientY, state?.width ?? 1200, canvasHeight);
  }

  function eraseBetween(from: Point, to: Point) {
    const measure = (stroke: StrokeDto) => (svgRef.current ? measureNode(svgRef.current, stroke.id) : null);
    const ids = strokesAlong(activeStrokes ?? [], from, to, eraserSize, measure);
    if (ids.length) setErasing((current) => (current ? [...new Set([...current, ...ids])] : current));
  }

  function finishErasing() {
    const ids = erasing ?? [];
    setErasing(null);
    eraserLast.current = null;
    if (!ids.length) return;
    if (source) {
      ids.forEach((id) => source.eraseStroke(sheet, id));
      return;
    }
    setEraseIds(ids);
    setReason(mobileLayout ? t("eraseDialog.reasons.wrongAnswer") : "");
    setReasonOpen(true);
  }

  const eraserHandlers = {
    onPointerDown(event: PointerEvent<SVGSVGElement>) {
      if (!canDraw || !event.isPrimary) return;
      const point = eraserPoint(event);
      event.currentTarget.setPointerCapture(event.pointerId);
      eraserLast.current = point;
      setEraserAt(point);
      setErasing([]);
      eraseBetween(point, point);
    },
    onPointerMove(event: PointerEvent<SVGSVGElement>) {
      if (!event.isPrimary) return;
      const point = eraserPoint(event);
      setEraserAt(point);
      if (!eraserLast.current) return;
      eraseBetween(eraserLast.current, point);
      eraserLast.current = point;
    },
    onPointerUp: finishErasing,
    onPointerCancel() {
      setErasing(null);
      eraserLast.current = null;
    },
    onPointerLeave() {
      if (!eraserLast.current) setEraserAt(null);
    },
  };

  async function removeSelected() {
    const strokeIds = eraseIds.length ? eraseIds : selected ? [selected] : [];
    if (!strokeIds.length || !reason.trim()) return;
    try {
      await erase.mutateAsync({ sheet, strokeIds, reason: reason.trim() });
      closeReasonDialog();
      toast.success(strokeIds.length > 1 ? t("eraseDialog.deletedCount", { count: strokeIds.length }) : t("eraseDialog.deleted"));
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
    draft && tool !== "erase" && tool !== "select" && tool !== "text" && tool !== "math" && tool !== "code"
      ? buildStroke({ kind: tool, ...draft, color, width: strokeWidth })
      : null;
  const scale = viewWidth ? (viewWidth * zoom) / state.width : 1;
  gestureCancel.current = () => {
    cancelDrawing();
    setErasing(null);
    eraserLast.current = null;
  };
  const overlayBox = selection.box && drag?.kind === "resize" ? resizedBox(selection.box, drag.stroke) : selection.box;
  const author = selection.selected?.by
    ? [
        selection.selected.by,
        selection.selected.edited_by && selection.selected.edited_by !== selection.selected.by
          ? t("edit.editedBy", { name: selection.selected.edited_by })
          : "",
      ]
        .filter(Boolean)
        .join(" · ")
    : undefined;
  const selectionToolbar = (docked: boolean) => {
    const target = selection.selected;
    if (!target || !selection.box || placement || drag) return null;
    return (
      <SelectionToolbar
        docked={docked}
        stroke={target}
        box={selection.box}
        boardWidth={state.width}
        onEdit={target.type === "text" || target.type === "math" || target.type === "code" ? () => openEditor(target) : undefined}
        onChange={(changes) => updateStroke(target.id, { changes })}
        onDelete={() => deleteSelected(target.id)}
      />
    );
  };

  const pointerHandlers =
    tool === "select"
      ? selection.handlers
      : tool === "erase"
        ? eraserHandlers
        : {
            onPointerDown: (event: PointerEvent<SVGSVGElement>) => {
              if (event.isPrimary) handlePointerDown(event);
            },
            onPointerMove: (event: PointerEvent<SVGSVGElement>) => {
              if (event.isPrimary) handlePointerMove(event);
            },
            onPointerUp: handlePointerUp,
            onPointerCancel: cancelDrawing,
          };


  const canvas = (
    <div className="relative h-full min-h-0">
      <div ref={setCanvasWrap} className="board-canvas-wrap h-full">
        <div className="board-zoom-layer" style={{ width: `${zoom * 100}%` }}>
          <svg
            ref={svgRef}
            className={`board-canvas board-canvas--${tool}`}
            viewBox={`0 0 ${state.width} ${canvasHeight}`}
            preserveAspectRatio="xMidYMin meet"
            style={{ aspectRatio: `${state.width} / ${canvasHeight}` }}
            {...pointerHandlers}
          >
            {strokeNodes}
            {pendingNodes}
            {selection.box && selection.selected ? (
              <SelectionOverlay
                box={overlayBox ?? selection.box}
                offset={drag?.kind === "move" ? [drag.dx, drag.dy] : undefined}
                scale={scale}
                label={author}
                handles={resizeHandles(drag?.kind === "resize" ? drag.stroke : selection.selected, overlayBox ?? selection.box)}
              />
            ) : null}
            {preview ? (
              <BoardStroke
                stroke={{ ...preview, id: "draft" }}
                selected={false}
                onSelect={() => undefined}
              />
            ) : null}
            {tool === "erase" && eraserAt ? (
              <circle className="board-eraser" cx={eraserAt[0]} cy={eraserAt[1]} r={eraserSize} />
            ) : null}
          </svg>

          {!mobileLayout ? selectionToolbar(false) : null}

          {placement && mobileLayout ? (
            <form
              ref={(node) => node?.scrollIntoView({ block: "nearest", behavior: "smooth" })}
              className="absolute inset-x-6 top-0 z-20 flex -translate-y-[34px] flex-col rounded-lg border border-line bg-surface p-3 shadow-lg"
              style={{ marginTop: `${(placement.point[1] / state.width) * 100}%` }}
              onPointerDown={(event) => event.stopPropagation()}
              onSubmit={placeBlock}
            >
              {placement.editingId ? (
                <strong className="text-title-sm text-ink">{t(`inline.edit.${placement.tool}`)}</strong>
              ) : (
                <div className="flex h-[38px] shrink-0 rounded-full bg-subtle p-[3px]" role="tablist">
                  {(state.codeEnabled ? (["text", "math", "code"] as const) : (["text", "math"] as const)).map((kind) => (
                    <button
                      key={kind}
                      type="button"
                      role="tab"
                      aria-selected={placement.tool === kind}
                      className={`flex-1 rounded-full text-body-sm transition-colors ${
                        placement.tool === kind ? "bg-surface font-semibold text-ink shadow-sm" : "font-medium text-ink-secondary"
                      }`}
                      onClick={() => {
                        setDraftText("");
                        setDraftLines([]);
                        setDraftCode("");
                        setPlacement({ ...placement, tool: kind });
                      }}
                    >
                      {t(`inline.${kind === "math" ? "formula" : kind}`)}
                    </button>
                  ))}
                </div>
              )}
              <div className="mt-[11px]">
                {placement.tool === "math" ? (
                  <div className="[&_.math-field]:min-h-[71px] [&_.math-field]:rounded-xl [&_.math-field]:border-[1.5px] [&_.math-field]:border-brand [&_.math-field]:bg-subtle">
                    <MathFieldInput ref={mathFieldRef} value={draftText} onChange={setDraftText} />
                  </div>
                ) : placement.tool === "code" ? (
                  <CodeEditor
                    variant="mobile"
                    value={draftCode}
                    onChange={setDraftCode}
                    language={codeLanguage}
                    onLanguageChange={setCodeLanguage}
                    languages={state.codeLanguages}
                    onSubmit={() => placeBlock()}
                    onCancel={closePlacement}
                  />
                ) : (
                  <RichTextInput
                    variant="mobile"
                    initialLines={initialLines}
                    onChange={setDraftLines}
                    onSubmit={() => placeBlock()}
                    onCancel={closePlacement}
                  />
                )}
              </div>
              <div className="mt-2.5 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  className="flex h-11 items-center justify-center rounded-full border border-line-strong bg-surface text-button text-ink"
                  onClick={closePlacement}
                >
                  {t("inline.cancel")}
                </button>
                <button
                  type="submit"
                  className="flex h-11 items-center justify-center rounded-full bg-brand text-button text-on-action disabled:opacity-40"
                  disabled={!canPlaceBlock}
                >
                  {placement.editingId ? t("inline.save") : t("inline.add")}
                </button>
              </div>
            </form>
          ) : placement?.inline ? (
            <InlineTextEditor
              value={inlineText}
              onChange={typeInline}
              anchor={placement.inline.anchor}
              size={placement.inline.size}
              color={placement.inline.color}
              boardWidth={state.width}
              scale={scale}
              onCommit={commitInline}
            />
          ) : placement ? (
            <form
              ref={(node) => node?.scrollIntoView({ block: "nearest", behavior: "smooth" })}
              className={`board-inline-editor is-wide is-${placement.tool} ${
                placement.point[0] > state.width * 0.6 ? "is-right" : ""
              }`}
              style={{
                top: 0,
                left: `min(${(placement.point[0] / state.width) * 100}%, calc(100% - min(640px, 100% - 24px) - 12px))`,
                marginTop: `${(placement.point[1] / state.width) * 100}%`,
              }}
              onPointerDown={(event) => event.stopPropagation()}
              onSubmit={placeBlock}
            >
              <span>
                {placement.editingId
                  ? t(`inline.edit.${placement.tool}`)
                  : t(`inline.${placement.tool === "math" ? "formula" : placement.tool}`)}
              </span>
              {placement.tool === "math" ? (
                <>
                  <FormulaPalette onInsert={(latex) => mathFieldRef.current?.insert(latex)} />
                  <MathFieldInput ref={mathFieldRef} value={draftText} onChange={setDraftText} />
                </>
              ) : placement.tool === "code" ? (
                <CodeEditor
                  value={draftCode}
                  onChange={setDraftCode}
                  language={codeLanguage}
                  onLanguageChange={setCodeLanguage}
                  languages={state.codeLanguages}
                  onSubmit={() => placeBlock()}
                  onCancel={closePlacement}
                />
              ) : (
                <RichTextInput
                  initialLines={initialLines}
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
      </div>
      <BoardZoomControls
        zoom={zoom}
        onZoomIn={() => zoomBy(BOARD_ZOOM.step)}
        onZoomOut={() => zoomBy(1 / BOARD_ZOOM.step)}
        onReset={() => zoomBy(1 / zoomRef.current)}
      />
    </div>
  );

  const dialogs = (
    <>
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
            changeSheet(index);
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
    </>
  );

  if (mobileLayout && mobile) {
    const page = (active?.index ?? sheet) + 1;
    const total = state.sheets.length;
    const pill = source ? null : !canDraw ? (
      <MobileBoardPill icon={<Eye size={14} />} tone="neutral">
        {t("status.viewOnly")}
      </MobileBoardPill>
    ) : !source && !realtime.connected ? (
      <MobileBoardPill icon={<Wifi size={14} />} tone="warning">
        {t("status.slowMode")}
      </MobileBoardPill>
    ) : state.isTeacher ? (
      <MobileBoardPill icon={<Pencil size={14} />} tone="success" onClick={() => setGrantOpen(true)}>
        {t(`mobile.modes.${state.permissionMode}`)}
      </MobileBoardPill>
    ) : (
      <MobileBoardPill icon={<Pencil size={14} />} tone="success">
        {t("status.canDraw")}
      </MobileBoardPill>
    );

    return (
      <div className="flex min-h-0 flex-1 flex-col [&_.board-canvas]:bg-none [&_.board-canvas-wrap]:bg-transparent">
        <MobileBoardHeader
          title={mobile.title ?? t("mobile.title", { page, total })}
          subtitle={mobile.subtitle}
          live={mobile.live}
          backLabel={mobile.backLabel}
          onBack={mobile.onBack}
          pill={pill}
          action={
            mobile.action ??
            (state.isTeacher ? (
              <button
                type="button"
                className="grid size-10 shrink-0 place-items-center rounded-full bg-surface text-ink"
                aria-label={t("permissionDialog.title")}
                onClick={() => setGrantOpen(true)}
              >
                <Users size={20} />
              </button>
            ) : null)
          }
        />

        <div className="relative mt-1 flex min-h-0 flex-1 flex-col">
          <div
            data-theme="light"
            className="min-h-0 flex-1 overflow-y-auto rounded-2xl bg-surface shadow-sm"
            style={{
              backgroundImage: "radial-gradient(circle, var(--border-default) 1px, transparent 1.5px)",
              backgroundSize: "28px 28px",
              backgroundPosition: "6px 6px",
            }}
          >
            {canvas}
          </div>
          {!source && !realtime.connected ? (
            <p
              role="status"
              className="absolute inset-x-1 -bottom-[13px] z-10 flex min-h-[60px] items-center gap-2.5 rounded-lg bg-warning-bg px-3 py-3 text-body-xs font-medium text-warning-fg"
            >
              <Icon name="warning-fill" size={18} className="shrink-0 text-accent-saffron-fg" />
              {t("status.slowSyncNote")}
            </p>
          ) : null}
        </div>

        {canDraw ? (
          <div className="mx-1 mt-1.5 flex min-h-[94px] shrink-0 flex-col justify-end gap-1.5">
            {selectionToolbar(true)}
            <MobileBoardToolbar
              tool={tool}
              color={color}
              width={strokeWidth}
              textSize={textSize}
              eraserSize={eraserSize}
              onToolChange={(next) => (next === "math" ? setFormulaOpen(true) : setTool(next))}
              onColorChange={setColor}
              onWidthChange={setStrokeWidth}
              onTextSizeChange={setTextSize}
              onEraserSizeChange={setEraserSize}
              onPeriodic={state.chemistryEnabled ? () => setPeriodicOpen(true) : undefined}
            />
          </div>
        ) : null}

        <div className="mx-1 mt-0.5">
          {mobile.footer ?? (
            <MobileBoardFooter
              page={page}
              total={total}
              showHistory={canDraw}
              canUndo={Boolean(undoTarget)}
              canRedo={redoStack.length > 0}
              onUndo={undo}
              onRedo={redo}
              onPrev={() => changeSheet(Math.max(0, sheet - 1))}
              onNext={() => changeSheet(Math.min(total - 1, sheet + 1))}
              onPages={() => setPagesOpen(true)}
              onAdd={state.isTeacher || source ? () => (source ? source.addSheet() : addSheet.mutate()) : undefined}
            />
          )}
        </div>
        {dialogs}
      </div>
    );
  }

  return (
    <div className="board-panel flex min-h-0 flex-1 flex-col">
      <div
        data-theme="light"
        className="relative min-h-0 flex-1 overflow-hidden rounded-xl bg-surface"
      >
        {canvas}

        {!source && !realtime.connected ? (
          <div className="pointer-events-none absolute inset-x-0 top-5 z-10 flex justify-center px-4">
            <p
              role="status"
              className="pointer-events-auto flex max-w-140 items-start gap-2.5 rounded-md bg-warning-bg px-4 py-3.5 text-body-sm text-warning-fg"
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
              textSize={textSize}
              eraserSize={eraserSize}
              canDraw={canDraw}
              chemistryEnabled={state.chemistryEnabled}
              codeEnabled={state.codeEnabled}
              onToolChange={setTool}
              onColorChange={setColor}
              onWidthChange={setStrokeWidth}
              onTextSizeChange={setTextSize}
              onEraserSizeChange={setEraserSize}
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
              onClick={() => changeSheet(sheet - 1)}
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
              onClick={() => changeSheet(sheet + 1)}
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

      {dialogs}
    </div>
  );
}
