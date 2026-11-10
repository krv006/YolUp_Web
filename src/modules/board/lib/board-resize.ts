import type { Point, StrokeDto } from "../api/board.dto";
import { shapeBox, type SheetSize, type StrokeBox } from "./board-edit";
import { CODE_PAD } from "./code-highlight";

export type ResizeHandle = "nw" | "ne" | "sw" | "se" | "start" | "end" | "e";

export interface HandlePoint {
  id: ResizeHandle;
  point: Point;
}

const MIN_SHAPE = 2;
const MIN_CODE_WIDTH = 40;

function clampPoint([x, y]: Point, sheet: SheetSize): Point {
  return [Math.min(Math.max(x, 0), sheet.width), Math.min(Math.max(y, 0), sheet.height)];
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}

export function resizeHandles(stroke: StrokeDto, box: StrokeBox | null): HandlePoint[] {
  switch (stroke.type) {
    case "rect":
    case "ellipse": {
      const shape = shapeBox(stroke)!;
      return [
        { id: "nw", point: [shape.minX, shape.minY] },
        { id: "ne", point: [shape.maxX, shape.minY] },
        { id: "sw", point: [shape.minX, shape.maxY] },
        { id: "se", point: [shape.maxX, shape.maxY] },
      ];
    }
    case "line":
      return [
        { id: "start", point: [stroke.x1, stroke.y1] },
        { id: "end", point: [stroke.x2, stroke.y2] },
      ];
    case "code":
      return box ? [{ id: "e", point: [box.maxX, (box.minY + box.maxY) / 2] }] : [];
    default:
      return [];
  }
}

export function resizeStroke(
  stroke: StrokeDto,
  handle: ResizeHandle,
  pointer: Point,
  sheet: SheetSize
): { stroke: StrokeDto; changes: Record<string, number> } | null {
  const [px, py] = clampPoint(pointer, sheet);
  if ((stroke.type === "rect" || stroke.type === "ellipse") && ["nw", "ne", "sw", "se"].includes(handle)) {
    const shape = shapeBox(stroke)!;
    const anchorX = handle === "nw" || handle === "sw" ? shape.maxX : shape.minX;
    const anchorY = handle === "nw" || handle === "ne" ? shape.maxY : shape.minY;
    const changes = {
      x: round(Math.min(anchorX, px)),
      y: round(Math.min(anchorY, py)),
      w: round(Math.max(MIN_SHAPE, Math.abs(px - anchorX))),
      h: round(Math.max(MIN_SHAPE, Math.abs(py - anchorY))),
    };
    return { stroke: { ...stroke, ...changes }, changes };
  }
  if (stroke.type === "line" && (handle === "start" || handle === "end")) {
    const changes: Record<string, number> =
      handle === "start" ? { x1: round(px), y1: round(py) } : { x2: round(px), y2: round(py) };
    return { stroke: { ...stroke, ...changes }, changes };
  }
  if (stroke.type === "code" && handle === "e") {
    const left = stroke.x - CODE_PAD;
    const w = round(Math.min(Math.max(px - left, MIN_CODE_WIDTH), sheet.width - stroke.x));
    return { stroke: { ...stroke, w }, changes: { w } };
  }
  return null;
}

export function resizedBox(box: StrokeBox, stroke: StrokeDto): StrokeBox {
  const shape = shapeBox(stroke);
  if (shape) {
    const pad = (stroke.width ?? 4) / 2;
    return { minX: shape.minX - pad, minY: shape.minY - pad, maxX: shape.maxX + pad, maxY: shape.maxY + pad };
  }
  if (stroke.type === "code" && stroke.w) return { ...box, maxX: stroke.x - CODE_PAD + stroke.w };
  return box;
}
