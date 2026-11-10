import type { Point, StrokeDto, StrokeUpdate } from "../api/board.dto";

const PROTECTED_FIELDS = new Set(["id", "type", "by", "by_id", "edited_by"]);
const ANCHOR_RIGHT_GAP = 40;
const ANCHOR_BOTTOM_GAP = 20;

export interface SheetSize {
  width: number;
  height: number;
}

export interface StrokeBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}

export function shapeBox(stroke: StrokeDto): StrokeBox | null {
  switch (stroke.type) {
    case "line":
      return {
        minX: Math.min(stroke.x1, stroke.x2),
        minY: Math.min(stroke.y1, stroke.y2),
        maxX: Math.max(stroke.x1, stroke.x2),
        maxY: Math.max(stroke.y1, stroke.y2),
      };
    case "rect":
    case "ellipse":
      return { minX: stroke.x, minY: stroke.y, maxX: stroke.x + stroke.w, maxY: stroke.y + stroke.h };
    case "text":
    case "math":
    case "code":
      return null;
    default: {
      const points: Point[] = stroke.points ?? [];
      if (!points.length) return null;
      const xs = points.map((point) => point[0]);
      const ys = points.map((point) => point[1]);
      return { minX: Math.min(...xs), minY: Math.min(...ys), maxX: Math.max(...xs), maxY: Math.max(...ys) };
    }
  }
}

export function clampMove(stroke: StrokeDto, [dx, dy]: [number, number], sheet: SheetSize): [number, number] {
  const box = shapeBox(stroke);
  if (!box) {
    const x = Number((stroke as { x?: number }).x ?? 0);
    const y = Number((stroke as { y?: number }).y ?? 0);
    return [
      clamp(x + dx, 0, sheet.width - ANCHOR_RIGHT_GAP) - x,
      clamp(y + dy, 0, sheet.height - ANCHOR_BOTTOM_GAP) - y,
    ];
  }
  return [clamp(dx, -box.minX, sheet.width - box.maxX), clamp(dy, -box.minY, sheet.height - box.maxY)];
}

export function moveStroke(stroke: StrokeDto, delta: [number, number], sheet: SheetSize): StrokeDto {
  const [dx, dy] = clampMove(stroke, delta, sheet);
  if (!dx && !dy) return stroke;
  switch (stroke.type) {
    case "line":
      return { ...stroke, x1: round(stroke.x1 + dx), y1: round(stroke.y1 + dy), x2: round(stroke.x2 + dx), y2: round(stroke.y2 + dy) };
    case "rect":
    case "ellipse":
    case "text":
    case "math":
    case "code":
      return { ...stroke, x: round(stroke.x + dx), y: round(stroke.y + dy) };
    default:
      return { ...stroke, points: (stroke.points ?? []).map(([x, y]) => [round(x + dx), round(y + dy)] as Point) };
  }
}

export function applyStrokeUpdate(stroke: StrokeDto, update: StrokeUpdate, sheet: SheetSize): StrokeDto {
  const changes = Object.fromEntries(
    Object.entries(update.changes ?? {}).filter(([key]) => !PROTECTED_FIELDS.has(key))
  );
  const merged = { ...stroke, ...changes } as StrokeDto;
  return update.move ? moveStroke(merged, update.move, sheet) : merged;
}

export function canEditStroke(
  stroke: Pick<StrokeDto, "by_id">,
  { isTeacher, userId, personal = false }: { isTeacher: boolean; userId?: string | null; personal?: boolean }
): boolean {
  if (personal || isTeacher) return true;
  return Boolean(userId && stroke.by_id && String(stroke.by_id) === String(userId));
}

export function replaceStroke(strokes: StrokeDto[], next: StrokeDto): StrokeDto[] {
  return strokes.some((item) => item.id === next.id) ? strokes.map((item) => (item.id === next.id ? next : item)) : strokes;
}
