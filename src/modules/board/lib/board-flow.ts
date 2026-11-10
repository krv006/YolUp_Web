import type { Point, StrokeDto } from "../api/board.dto";

export const FLOW_MARGIN = 48;
export const FLOW_GAP = 18;
export const FLOW_LINE_HEIGHT = 1.4;

const ROW = 12;

interface VerticalSpan {
  top: number;
  bottom: number;
}

function textSpan(y: number, size: number, lines: number): VerticalSpan {
  const lineHeight = size * 1.35;
  return { top: y - size, bottom: y + (lines - 1) * lineHeight + size * 0.32 };
}

export function strokeSpan(stroke: StrokeDto): VerticalSpan | null {
  switch (stroke.type) {
    case "line":
      return { top: Math.min(stroke.y1, stroke.y2), bottom: Math.max(stroke.y1, stroke.y2) };
    case "rect":
    case "ellipse":
      return { top: stroke.y, bottom: stroke.y + stroke.h };
    case "text":
      return textSpan(stroke.y, stroke.size ?? 22, String(stroke.text ?? "").split("\n").length);
    case "math":
      return textSpan(stroke.y, stroke.size ?? 22, 1);
    case "code": {
      const size = stroke.size ?? 20;
      const lines = String(stroke.text ?? "").split("\n").length;
      return { top: stroke.y - size * 1.05, bottom: stroke.y + (lines - 1) * size * 1.35 + size * 0.45 };
    }
    default: {
      const points: Point[] = stroke.points ?? [];
      if (!points.length) return null;
      const ys = points.map((point) => point[1]);
      return { top: Math.min(...ys), bottom: Math.max(...ys) };
    }
  }
}

export function textBlockHeight(size: number, lines: number): number {
  return size * (1 + (Math.max(1, lines) - 1) * 1.35) + size * 0.32;
}

export interface FlowInit {
  boardWidth: number;
  boardHeight: number;
  blockHeight: number;
}

export function nextFlowPoint(strokes: StrokeDto[], init: FlowInit): Point {
  const { boardHeight, blockHeight } = init;
  const top = FLOW_MARGIN;
  const bottom = Math.max(top + ROW, boardHeight - FLOW_MARGIN);
  const rows = Math.max(1, Math.ceil((bottom - top) / ROW));
  const occupied = new Array<boolean>(rows).fill(false);

  strokes.forEach((stroke) => {
    const span = strokeSpan(stroke);
    if (!span) return;
    const pad = FLOW_GAP / 2;
    const from = Math.floor((span.top - pad - top) / ROW);
    const to = Math.ceil((span.bottom + pad - top) / ROW);
    for (let index = Math.max(0, from); index < Math.min(rows, to); index += 1) {
      occupied[index] = true;
    }
  });

  const needed = Math.max(1, Math.ceil(blockHeight / ROW));
  let run = 0;
  for (let index = 0; index < rows; index += 1) {
    run = occupied[index] ? 0 : run + 1;
    if (run >= needed) {
      return [FLOW_MARGIN, top + (index - needed + 1) * ROW];
    }
  }

  const lowest = strokes.reduce((max, stroke) => {
    const span = strokeSpan(stroke);
    return span ? Math.max(max, span.bottom) : max;
  }, top);
  return [FLOW_MARGIN, lowest + FLOW_GAP];
}

export function nextTextPoint(
  strokes: StrokeDto[],
  { boardWidth, boardHeight, size, lines }: { boardWidth: number; boardHeight: number; size: number; lines: number }
): Point {
  const blockHeight = textBlockHeight(size, lines);
  const [x, y] = nextFlowPoint(strokes, { boardWidth, boardHeight, blockHeight });
  return [x, y + size];
}

export interface BoardObstacle {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export const TEXT_LINE_HEIGHT = 1.35;
const OVERLAP_TOLERANCE = 2;

export function textRow(size: number): number {
  return size * TEXT_LINE_HEIGHT;
}

export function estimateTextWidth(text: string, size: number): number {
  return Math.max(1, ...text.split("\n").map((line) => line.length)) * size * 0.56;
}

export interface FreeTextInit {
  x: number;
  y: number;
  size: number;
  lines: number;
  width: number;
  obstacles: BoardObstacle[];
  maxBaseline: number;
}

export function freeTextBaseline({ x, y, size, lines, width, obstacles, maxBaseline }: FreeTextInit): number {
  const row = textRow(size);
  const height = Math.max(1, lines) * row;
  const relevant = obstacles.filter(
    (item) => item.right - OVERLAP_TOLERANCE > x && item.left + OVERLAP_TOLERANCE < x + width
  );
  const isFree = (top: number) =>
    relevant.every((item) => item.bottom - OVERLAP_TOLERANCE <= top || item.top + OVERLAP_TOLERANCE >= top + height);
  const start = Math.max(0, Math.floor(y / row));
  const last = Math.max(start, Math.floor((maxBaseline - size) / row));
  for (let index = start; index <= last; index += 1) {
    if (isFree(index * row)) return index * row + size;
  }
  for (let index = start - 1; index >= 0; index -= 1) {
    if (isFree(index * row)) return index * row + size;
  }
  return start * row + size;
}
