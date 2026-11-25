import { describe, expect, it } from "vitest";
import type { StrokeShapeDto } from "../api/board.dto";
import { buildLenta, pageAt, shiftChanges, shiftStroke, strokeTop } from "./board-lenta";

const pen = (points: Array<[number, number]>) => ({ points, color: "#000", width: 2 }) as StrokeShapeDto;
const rect = { type: "rect", x: 10, y: 40, w: 50, h: 20, color: "#000", width: 2 } as StrokeShapeDto;
const line = { type: "line", x1: 0, y1: 300, x2: 10, y2: 120, color: "#000", width: 2 } as StrokeShapeDto;

describe("board lenta", () => {
  it("stacks the pages one under another in page order", () => {
    const lenta = buildLenta(
      [
        { index: 1, strokes: [pen([[0, 1200]])] },
        { index: 0, strokes: [] },
      ],
      (strokes) => (strokes.length ? 1300 : 900)
    );
    expect(lenta.pages).toEqual([
      { index: 0, offset: 0, height: 900 },
      { index: 1, offset: 900, height: 1300 },
    ]);
    expect(lenta.total).toBe(2200);
  });

  it("finds the page under a point, the first page above the lenta and the last below it", () => {
    const pages = [
      { index: 0, offset: 0, height: 900 },
      { index: 1, offset: 900, height: 900 },
    ];
    expect(pageAt(pages, 120)?.index).toBe(0);
    expect(pageAt(pages, 900)?.index).toBe(1);
    expect(pageAt(pages, 5000)?.index).toBe(1);
    expect(pageAt(pages, -20)?.index).toBe(0);
    expect(pageAt([], 10)).toBeNull();
  });

  it("moves every kind of stroke down and back without touching x", () => {
    expect(shiftStroke(pen([[5, 10], [7, 20]]), 900)).toMatchObject({ points: [[5, 910], [7, 920]] });
    expect(shiftStroke(rect, 900)).toMatchObject({ x: 10, y: 940 });
    expect(shiftStroke(line, -100)).toMatchObject({ y1: 200, y2: 20 });
    expect(shiftStroke(rect, 0)).toBe(rect);
  });

  it("shifts only the position fields of an edit", () => {
    expect(shiftChanges({ y: 950, h: 40, color: "#f00" }, -900)).toEqual({ y: 50, h: 40, color: "#f00" });
    expect(shiftChanges({ points: [[1, 905]] }, -900)).toEqual({ points: [[1, 5]] });
  });

  it("reads the top of a stroke to decide its page", () => {
    expect(strokeTop(pen([[0, 50], [0, 30]]))).toBe(30);
    expect(strokeTop(line)).toBe(120);
    expect(strokeTop(rect)).toBe(40);
  });
});
