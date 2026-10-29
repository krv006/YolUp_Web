import { useEffect, useRef, useState, type PointerEvent } from "react";
import type { Point, StrokeShapeDto } from "../api/board.dto";
import { buildStroke, type DrawKind } from "../lib/board.geometry";
import type { BoardTool } from "../ui/board-toolbar";

const PLACED_TOOLS = new Set<BoardTool>(["text", "math"]);
const MIN_POINT_DISTANCE = 2;

export interface UseBoardDrawingInit {
  width: number;
  height: number;
  tool: BoardTool;
  color: string;
  strokeWidth: number;
  enabled: boolean;
  onCommit: (stroke: StrokeShapeDto) => void;
  onPlacePoint: (point: Point) => void;
}

export interface BoardDraft {
  from: Point;
  to: Point;
  points: Point[];
}

export function useBoardDrawing({
  width,
  height,
  tool,
  color,
  strokeWidth,
  enabled,
  onCommit,
  onPlacePoint,
}: UseBoardDrawingInit) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [draft, setDraft] = useState<BoardDraft | null>(null);
  const liveRef = useRef<BoardDraft | null>(null);
  const frameRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (frameRef.current !== null) globalThis.cancelAnimationFrame(frameRef.current);
    },
    []
  );

  function scheduleRender() {
    if (frameRef.current !== null) return;
    frameRef.current = globalThis.requestAnimationFrame(() => {
      frameRef.current = null;
      const live = liveRef.current;
      setDraft(live ? { from: live.from, to: live.to, points: live.points.slice() } : null);
    });
  }

  function toBoardPoint(event: PointerEvent<SVGSVGElement>): Point {
    const svg = svgRef.current!;
    const matrix = svg.getScreenCTM();
    if (!matrix) {
      const rect = svg.getBoundingClientRect();
      return [
        Math.round(((event.clientX - rect.left) * width) / rect.width),
        Math.round(((event.clientY - rect.top) * height) / rect.height),
      ];
    }
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
    return [Math.round(point.x), Math.round(point.y)];
  }

  function handlePointerDown(event: PointerEvent<SVGSVGElement>) {
    if (!enabled || tool === "erase") return;
    const point = toBoardPoint(event);

    if (PLACED_TOOLS.has(tool)) {
      onPlacePoint(point);
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    liveRef.current = { from: point, to: point, points: [point] };
    setDraft({ from: point, to: point, points: [point] });
  }

  function handlePointerMove(event: PointerEvent<SVGSVGElement>) {
    const live = liveRef.current;
    if (!live) return;
    const point = toBoardPoint(event);
    const last = live.points[live.points.length - 1];
    live.to = point;
    if (!last || Math.hypot(point[0] - last[0], point[1] - last[1]) >= MIN_POINT_DISTANCE) live.points.push(point);
    scheduleRender();
  }

  function handlePointerUp() {
    const live = liveRef.current;
    if (!live) return;
    liveRef.current = null;
    if (frameRef.current !== null) {
      globalThis.cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    const last = live.points[live.points.length - 1];
    if (last && (last[0] !== live.to[0] || last[1] !== live.to[1])) live.points.push(live.to);
    const stroke = buildStroke({
      kind: tool as DrawKind,
      from: live.from,
      to: live.to,
      points: live.points,
      color,
      width: strokeWidth,
    });
    if (stroke) onCommit(stroke);
    setDraft(null);
  }

  return { svgRef, draft, handlePointerDown, handlePointerMove, handlePointerUp };
}
