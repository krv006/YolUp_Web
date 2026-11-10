import { useCallback, useEffect, useLayoutEffect, useRef, useState, type MouseEvent, type PointerEvent, type RefObject } from "react";
import type { Point, StrokeDto } from "../api/board.dto";
import { clampMove, type SheetSize, type StrokeBox } from "../lib/board-edit";
import { boardScale, clientToBoard, measureNode, strokeNode } from "../lib/board-measure";
import { boxOfStroke, pickStroke } from "../lib/board-select";

const HIT_PX = 10;
const DRAG_START = 2;

export interface BoardDrag {
  id: string;
  dx: number;
  dy: number;
}

export interface UseBoardSelectionInit {
  svgRef: RefObject<SVGSVGElement | null>;
  strokes: StrokeDto[];
  sheet: SheetSize;
  viewHeight: number;
  active: boolean;
  canEdit: (stroke: StrokeDto) => boolean;
  onMove: (id: string, delta: [number, number]) => void;
  onDenied: () => void;
  onOpen: (stroke: StrokeDto) => void;
}

interface DragState {
  id: string;
  stroke: StrokeDto;
  start: Point;
  delta: [number, number];
  moved: boolean;
}

export function useBoardSelection({
  svgRef,
  strokes,
  sheet,
  viewHeight,
  active,
  canEdit,
  onMove,
  onDenied,
  onOpen,
}: UseBoardSelectionInit) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drag, setDrag] = useState<BoardDrag | null>(null);
  const [box, setBox] = useState<StrokeBox | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const frameRef = useRef<number | null>(null);
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
    },
    []
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
    dragRef.current = { id: stroke.id, stroke, start: point, delta: [0, 0], moved: false };
  }

  function onPointerMove(event: PointerEvent<SVGSVGElement>) {
    const state = dragRef.current;
    if (!state) return;
    const point = toPoint(event);
    const raw: [number, number] = [point[0] - state.start[0], point[1] - state.start[1]];
    if (!state.moved && Math.hypot(raw[0], raw[1]) < DRAG_START) return;
    state.moved = true;
    state.delta = clampMove(state.stroke, raw, sheet);
    if (frameRef.current !== null) return;
    frameRef.current = globalThis.requestAnimationFrame(() => {
      frameRef.current = null;
      const live = dragRef.current;
      setDrag(live?.moved ? { id: live.id, dx: live.delta[0], dy: live.delta[1] } : null);
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
    const delta: [number, number] = [Math.round(state.delta[0]), Math.round(state.delta[1])];
    if (delta[0] || delta[1]) onMove(state.id, delta);
  }

  return {
    selected: current,
    box: current ? box : null,
    drag,
    select: setSelectedId,
    clear,
    handlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp, onDoubleClick },
  };
}
