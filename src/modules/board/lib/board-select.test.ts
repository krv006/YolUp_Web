import { describe, expect, it } from "vitest";
import type { StrokeDto } from "../api/board.dto";
import { boxOfStroke, distanceToSegment, pickStroke } from "./board-select";

const measure = (stroke: StrokeDto) =>
  stroke.type === "text" ? { minX: stroke.x, minY: stroke.y - 20, maxX: stroke.x + 100, maxY: stroke.y + 6 } : null;
const options = { tolerance: 10, measure };

const strokes = [
  { id: "rect", type: "rect", x: 100, y: 100, w: 200, h: 100, width: 4 },
  { id: "line", type: "line", x1: 0, y1: 400, x2: 400, y2: 400, width: 4 },
  { id: "pen", points: [[500, 500], [600, 520], [700, 500]], width: 4 },
  { id: "text", type: "text", text: "Salom", x: 120, y: 150 },
] as StrokeDto[];

describe("distanceToSegment", () => {
  it("measures to the closest point of the segment", () => {
    expect(distanceToSegment([5, 3], [0, 0], [10, 0])).toBe(3);
    expect(distanceToSegment([-4, 3], [0, 0], [10, 0])).toBe(5);
  });
});

describe("pickStroke", () => {
  it("prefers the topmost element under the pointer", () => {
    expect(pickStroke(strokes, [130, 145], options)?.id).toBe("text");
    expect(pickStroke(strokes, [250, 190], options)?.id).toBe("rect");
  });

  it("finds thin lines and pen strokes within the tolerance", () => {
    expect(pickStroke(strokes, [200, 409], options)?.id).toBe("line");
    expect(pickStroke(strokes, [600, 528], options)?.id).toBe("pen");
    expect(pickStroke(strokes, [600, 560], options)).toBeNull();
  });
});

describe("boxOfStroke", () => {
  it("includes half the line width for shapes and uses the measurement for text", () => {
    expect(boxOfStroke(strokes[0], measure)).toEqual({ minX: 98, minY: 98, maxX: 302, maxY: 202 });
    expect(boxOfStroke(strokes[3], measure)).toEqual({ minX: 120, minY: 130, maxX: 220, maxY: 156 });
  });
});
