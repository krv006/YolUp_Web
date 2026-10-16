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
