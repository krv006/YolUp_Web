import { describe, expect, it } from "vitest";
import type { StrokeDto } from "../api/board.dto";
import { resizedBox, resizeHandles, resizeStroke } from "./board-resize";

const SHEET = { width: 1600, height: 900 };
const rect = { id: "r", type: "rect", x: 100, y: 100, w: 200, h: 100, width: 4 } as StrokeDto;
const line = { id: "l", type: "line", x1: 10, y1: 10, x2: 100, y2: 50 } as StrokeDto;
const code = { id: "c", type: "code", text: "SELECT 1;", x: 86, y: 120, size: 20 } as StrokeDto;

describe("resizeHandles", () => {
  it("offers corners for shapes, ends for lines and the right edge for code", () => {
    expect(resizeHandles(rect, null).map((item) => item.id)).toEqual(["nw", "ne", "sw", "se"]);
    expect(resizeHandles(line, null)).toEqual([
      { id: "start", point: [10, 10] },
      { id: "end", point: [100, 50] },
    ]);
    expect(resizeHandles(code, { minX: 80, minY: 99, maxX: 200, maxY: 129 })).toEqual([{ id: "e", point: [200, 114] }]);
    expect(resizeHandles({ id: "t", type: "text", text: "a", x: 0, y: 0 } as StrokeDto, null)).toEqual([]);
  });
});

describe("resizeStroke", () => {
  it("keeps the opposite corner fixed, even when the pointer crosses it", () => {
    expect(resizeStroke(rect, "se", [400, 260], SHEET)?.changes).toEqual({ x: 100, y: 100, w: 300, h: 160 });
    expect(resizeStroke(rect, "nw", [350, 250], SHEET)?.changes).toEqual({ x: 300, y: 200, w: 50, h: 50 });
  });

  it("moves one end of a line and stays on the sheet", () => {
    expect(resizeStroke(line, "end", [1700, -20], SHEET)?.changes).toEqual({ x2: 1600, y2: 0 });
  });

  it("changes only the width of a code block within the server limits", () => {
    expect(resizeStroke(code, "e", [500, 0], SHEET)?.changes).toEqual({ w: 420 });
    expect(resizeStroke(code, "e", [90, 0], SHEET)?.changes).toEqual({ w: 40 });
  });

  it("ignores handles that do not belong to the element", () => {
    expect(resizeStroke(line, "nw", [0, 0], SHEET)).toBeNull();
  });
});

describe("resizedBox", () => {
  it("follows the preview geometry", () => {
    const preview = resizeStroke(rect, "se", [400, 260], SHEET)!.stroke;
    expect(resizedBox({ minX: 0, minY: 0, maxX: 0, maxY: 0 }, preview)).toEqual({ minX: 98, minY: 98, maxX: 402, maxY: 262 });
    const wide = resizeStroke(code, "e", [500, 0], SHEET)!.stroke;
    expect(resizedBox({ minX: 80, minY: 99, maxX: 200, maxY: 129 }, wide)).toEqual({ minX: 80, minY: 99, maxX: 500, maxY: 129 });
  });
});
