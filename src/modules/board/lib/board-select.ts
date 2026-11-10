import type { Point, StrokeDto } from "../api/board.dto";
import { shapeBox, type StrokeBox } from "./board-edit";

export interface PickOptions {
  tolerance: number;
  measure: (stroke: StrokeDto) => StrokeBox | null;
}

export function distanceToSegment([px, py]: Point, [ax, ay]: Point, [bx, by]: Point): number {
  const dx = bx - ax;
  const dy = by - ay;
  const length = dx * dx + dy * dy;
  const t = length ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / length)) : 0;
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

function insideBox([x, y]: Point, box: StrokeBox, pad: number): boolean {
  return x >= box.minX - pad && x <= box.maxX + pad && y >= box.minY - pad && y <= box.maxY + pad;
}

export function hitsStroke(stroke: StrokeDto, point: Point, { tolerance, measure }: PickOptions): boolean {
  const reach = tolerance + (stroke.width ?? 4) / 2;
  switch (stroke.type) {
    case "line":
      return distanceToSegment(point, [stroke.x1, stroke.y1], [stroke.x2, stroke.y2]) <= reach;
    case "rect":
    case "ellipse":
      return insideBox(point, shapeBox(stroke)!, reach);
    case "text":
    case "math":
    case "code": {
      const box = measure(stroke);
      return box ? insideBox(point, box, tolerance / 2) : false;
    }
    default: {
      const points: Point[] = stroke.points ?? [];
      if (points.length === 1) return Math.hypot(point[0] - points[0][0], point[1] - points[0][1]) <= reach;
      for (let index = 1; index < points.length; index += 1) {
        if (distanceToSegment(point, points[index - 1], points[index]) <= reach) return true;
      }
      return false;
    }
  }
}

export function pickStroke(strokes: StrokeDto[], point: Point, options: PickOptions): StrokeDto | null {
  for (let index = strokes.length - 1; index >= 0; index -= 1) {
    if (hitsStroke(strokes[index], point, options)) return strokes[index];
  }
  return null;
}

export function boxOfStroke(stroke: StrokeDto, measure: (stroke: StrokeDto) => StrokeBox | null): StrokeBox | null {
  const box = shapeBox(stroke) ?? measure(stroke);
  if (!box) return null;
  const pad = stroke.type === "text" || stroke.type === "math" || stroke.type === "code" ? 0 : (stroke.width ?? 4) / 2;
  return { minX: box.minX - pad, minY: box.minY - pad, maxX: box.maxX + pad, maxY: box.maxY + pad };
}
