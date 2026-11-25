import type { Point, StrokeShapeDto } from "../api/board.dto";

export interface LentaPage {
  index: number;
  offset: number;
  height: number;
}

export interface Lenta {
  pages: LentaPage[];
  total: number;
}

export function buildLenta<S extends { index: number; strokes: readonly StrokeShapeDto[] }>(
  sheets: readonly S[],
  pageHeight: (strokes: readonly StrokeShapeDto[]) => number
): Lenta {
  let offset = 0;
  const pages = [...sheets]
    .sort((a, b) => a.index - b.index)
    .map((sheet) => {
      const page = { index: sheet.index, offset, height: pageHeight(sheet.strokes) };
      offset += page.height;
      return page;
    });
  return { pages, total: offset };
}

export function pageAt(pages: readonly LentaPage[], y: number): LentaPage | null {
  let found: LentaPage | null = pages[0] ?? null;
  for (const page of pages) if (y >= page.offset) found = page;
  return found;
}

const shiftPoints = (points: readonly Point[], dy: number): Point[] => points.map(([x, y]) => [x, y + dy] as Point);

export function shiftStroke<T extends StrokeShapeDto>(stroke: T, dy: number): T {
  if (!dy) return stroke;
  const shape = stroke as StrokeShapeDto;
  if ("y1" in shape && "y2" in shape) return { ...stroke, y1: shape.y1 + dy, y2: shape.y2 + dy };
  if ("y" in shape && typeof shape.y === "number") return { ...stroke, y: shape.y + dy };
  if ("points" in shape && Array.isArray(shape.points)) return { ...stroke, points: shiftPoints(shape.points, dy) };
  return stroke;
}

export function shiftChanges(changes: Record<string, unknown>, dy: number): Record<string, unknown> {
  if (!dy) return changes;
  const next: Record<string, unknown> = { ...changes };
  for (const key of ["y", "y1", "y2"]) {
    if (typeof next[key] === "number") next[key] = (next[key] as number) + dy;
  }
  if (Array.isArray(next.points)) next.points = shiftPoints(next.points as Point[], dy);
  return next;
}

export function strokeTop(stroke: StrokeShapeDto): number {
  if ("y1" in stroke && "y2" in stroke) return Math.min(stroke.y1, stroke.y2);
  if ("y" in stroke && typeof stroke.y === "number") return stroke.y;
  if ("points" in stroke && Array.isArray(stroke.points) && stroke.points.length) {
    return Math.min(...stroke.points.map(([, y]) => y));
  }
  return 0;
}
