import { useCallback, useEffect, useLayoutEffect, useRef, useState, type MouseEvent, type PointerEvent, type RefObject } from "react";
import type { Point, StrokeDto } from "../api/board.dto";
import { clampMove, type SheetSize, type StrokeBox } from "../lib/board-edit";
import { boardScale, clientToBoard, measureNode, strokeNode } from "../lib/board-measure";
import { resizeStroke, type ResizeHandle } from "../lib/board-resize";
import { boxOfStroke, pickStroke } from "../lib/board-select";

const HIT_PX = 10;
const DRAG_START = 2;
const NUDGE_COMMIT_MS = 400;

export type BoardDrag =
  | { kind: "move"; id: string; dx: number; dy: number }
  | { kind: "resize"; id: string; stroke: StrokeDto };

export interface UseBoardSelectionInit {
  svgRef: RefObject<SVGSVGElement | null>;
  strokes: StrokeDto[];
  sheet: SheetSize;
  viewHeight: number;
  active: boolean;
  canEdit: (stroke: StrokeDto) => boolean;
  onMove: (id: string, delta: [number, number]) => void;
  onResize: (id: string, changes: Record<string, number>) => void;
  onDenied: () => void;
  onOpen: (stroke: StrokeDto) => void;
}

interface DragState {
  id: string;
  stroke: StrokeDto;
  start: Point;
  delta: [number, number];
  moved: boolean;
  handle: ResizeHandle | null;
  preview: StrokeDto | null;
  changes: Record<string, number> | null;
}

export function useBoardSelection({
  svgRef,
  strokes,
  sheet,
  viewHeight,
  active,
  canEdit,
  onMove,
  onResize,
  onDenied,
  onOpen,
}: UseBoardSelectionInit) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drag, setDrag] = useState<BoardDrag | null>(null);
  const [box, setBox] = useState<StrokeBox | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const frameRef = useRef<number | null>(null);
  const nudgeRef = useRef<{ id: string; stroke: StrokeDto; delta: [number, number]; timer: ReturnType<typeof setTimeout> } | null>(null);
  const onMoveRef = useRef(onMove);

  useEffect(() => {
    onMoveRef.current = onMove;
  }, [onMove]);
  const selected = selectedId ? (strokes.find((stroke) => stroke.id === selectedId) ?? null) : null;
  const current = active ? selected : null;

  const measure = useCallback(
    (stroke: StrokeDto) => {
      const svg = svgRef.current;
      return svg ? measureNode(svg, stroke.id) : null;
    },
    [svgRef]
  );

  useLayoutEffect(() => {
    const svg = svgRef.current;
    if (!current || !svg) return undefined;
    const update = () => setBox(boxOfStroke(current, measure));
    const frame = globalThis.requestAnimationFrame(update);
    const node = strokeNode(svg, current.id);
    const target = node?.querySelector(".math-markup") ?? node;
    const observer = target ? new ResizeObserver(update) : null;
    if (target) observer?.observe(target);
    return () => {
      globalThis.cancelAnimationFrame(frame);
      observer?.disconnect();
    };
  }, [current, measure, svgRef]);

  useEffect(
    () => () => {
      if (frameRef.current !== null) globalThis.cancelAnimationFrame(frameRef.current);
      const pending = nudgeRef.current;
      if (pending) {
        clearTimeout(pending.timer);
        nudgeRef.current = null;
        const delta: [number, number] = [Math.round(pending.delta[0]), Math.round(pending.delta[1])];
        if (delta[0] || delta[1]) onMoveRef.current(pending.id, delta);
      }
    },
    []
  );

  function nudge(dx: number, dy: number) {
    if (!current) return;
    const previous = nudgeRef.current?.id === current.id ? nudgeRef.current : null;
    if (previous) clearTimeout(previous.timer);
    const id = current.id;
    const stroke = previous?.stroke ?? current;
    const base = previous?.delta ?? [0, 0];
    const delta = clampMove(stroke, [base[0] + dx, base[1] + dy], sheet);
    setDrag({ kind: "move", id, dx: delta[0], dy: delta[1] });
    const timer = setTimeout(() => {
      nudgeRef.current = null;
      setDrag(null);
      const rounded: [number, number] = [Math.round(delta[0]), Math.round(delta[1])];
      if (rounded[0] || rounded[1]) onMove(id, rounded);
    }, NUDGE_COMMIT_MS);
    nudgeRef.current = { id, stroke, delta, timer };
  }

  const strokeAt = useCallback(
    (point: Point): StrokeDto | null => {
      const svg = svgRef.current;
      if (!svg) return null;
      return pickStroke(strokes, point, { tolerance: HIT_PX / boardScale(svg, sheet.width), measure });
    },
    [svgRef, strokes, sheet.width, measure]
  );

  const clear = useCallback(() => {
    setSelectedId(null);
    setBox(null);
  }, []);

  function toPoint(event: PointerEvent<SVGSVGElement>): Point {
    return clientToBoard(event.currentTarget, event.clientX, event.clientY, sheet.width, viewHeight);
  }

  function pickAt(event: PointerEvent<SVGSVGElement> | MouseEvent<SVGSVGElement>): StrokeDto | null {
    const point = clientToBoard(event.currentTarget, event.clientX, event.clientY, sheet.width, viewHeight);
    const tolerance = HIT_PX / boardScale(event.currentTarget, sheet.width);
    return pickStroke(strokes, point, { tolerance, measure });
  }

  function onDoubleClick(event: MouseEvent<SVGSVGElement>) {
    if (!active) return;
    const stroke = pickAt(event);
    if (stroke && canEdit(stroke)) onOpen(stroke);
  }

  function onPointerDown(event: PointerEvent<SVGSVGElement>) {
    if (!active) return;
    const point = toPoint(event);
    const handle = (event.target as Element | null)?.closest?.("[data-handle]")?.getAttribute("data-handle") as ResizeHandle | null;
    if (handle && current) {
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      dragRef.current = { id: current.id, stroke: current, start: point, delta: [0, 0], moved: false, handle, preview: null, changes: null };
      return;
    }
    const stroke = pickAt(event);
    if (!stroke) {
      clear();
      return;
    }
    if (!canEdit(stroke)) {
      clear();
      onDenied();
      return;
    }
    event.preventDefault();
    setSelectedId(stroke.id);
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { id: stroke.id, stroke, start: point, delta: [0, 0], moved: false, handle: null, preview: null, changes: null };
  }

  function onPointerMove(event: PointerEvent<SVGSVGElement>) {
    const state = dragRef.current;
    if (!state) return;
    const point = toPoint(event);
    const raw: [number, number] = [point[0] - state.start[0], point[1] - state.start[1]];
    if (!state.moved && Math.hypot(raw[0], raw[1]) < DRAG_START) return;
    state.moved = true;
    if (state.handle) {
      const resized = resizeStroke(state.stroke, state.handle, point, sheet);
      state.preview = resized?.stroke ?? null;
      state.changes = resized?.changes ?? null;
    } else {
      state.delta = clampMove(state.stroke, raw, sheet);
    }
    if (frameRef.current !== null) return;
    frameRef.current = globalThis.requestAnimationFrame(() => {
      frameRef.current = null;
      const live = dragRef.current;
      if (!live?.moved) return setDrag(null);
      setDrag(
        live.handle
          ? live.preview
            ? { kind: "resize", id: live.id, stroke: live.preview }
            : null
          : { kind: "move", id: live.id, dx: live.delta[0], dy: live.delta[1] }
      );
    });
  }

  function onPointerUp() {
    const state = dragRef.current;
    dragRef.current = null;
    if (frameRef.current !== null) {
      globalThis.cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    setDrag(null);
    if (!state?.moved) return;
    if (state.handle) {
      if (state.changes) onResize(state.id, state.changes);
      return;
    }
    const delta: [number, number] = [Math.round(state.delta[0]), Math.round(state.delta[1])];
    if (delta[0] || delta[1]) onMove(state.id, delta);
  }

  return {
    selected: current,
    box: current ? box : null,
    drag,
    select: setSelectedId,
    clear,
    strokeAt,
    nudge,
    handlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp, onDoubleClick },
  };
}
