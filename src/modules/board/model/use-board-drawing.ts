import { useRef, useState, type PointerEvent } from "react";
import type { Point, StrokeShapeDto } from "../api/board.dto";
import { buildStroke, type DrawKind } from "../lib/board.geometry";
import type { BoardTool } from "../ui/board-toolbar";

const PLACED_TOOLS = new Set<BoardTool>(["text", "math"]);

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
    setDraft({ from: point, to: point, points: [point] });
  }

  function handlePointerMove(event: PointerEvent<SVGSVGElement>) {
    if (!draft) return;
    const point = toBoardPoint(event);
    setDraft((current) =>
      current ? { ...current, to: point, points: [...current.points, point] } : current
    );
  }

  function handlePointerUp() {
    if (!draft) return;
    const stroke = buildStroke({
      kind: tool as DrawKind,
      from: draft.from,
      to: draft.to,
      points: draft.points,
      color,
      width: strokeWidth,
    });
    if (stroke) onCommit(stroke);
    setDraft(null);
  }

  return { svgRef, draft, handlePointerDown, handlePointerMove, handlePointerUp };
}
