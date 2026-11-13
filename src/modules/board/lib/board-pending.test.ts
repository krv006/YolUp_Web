import { describe, expect, it } from "vitest";
import type { StrokeDto, StrokeShapeDto } from "../api/board.dto";
import { confirmsPending } from "./board-pending";

const server = (stroke: object) => ({ id: "s1", by: "Ali", ...stroke }) as StrokeDto;

describe("pending stroke confirmation", () => {
  it("recognises our pen stroke after the server rounds and thins it", () => {
    const local: StrokeShapeDto = { points: [[120.04, 80], [130, 85], [140, 90], [150, 95]], color: "#1c1e3a", width: 4 };
    expect(confirmsPending(server({ points: [[120, 80], [140, 90]], color: "#1c1e3a", width: 4 }), local)).toBe(true);
    expect(confirmsPending(server({ points: [[300, 80], [140, 90]], color: "#1c1e3a", width: 4 }), local)).toBe(false);
  });

  it("matches lines and shapes by their geometry only", () => {
    expect(confirmsPending(server({ type: "line", x1: 1, y1: 2, x2: 30, y2: 40, width: 4 }), { type: "line", x1: 1, y1: 2, x2: 30, y2: 40, width: 4 })).toBe(true);
    expect(confirmsPending(server({ type: "rect", x: 10, y: 10, w: 50, h: 20 }), { type: "ellipse", x: 10, y: 10, w: 50, h: 20 })).toBe(false);
    expect(confirmsPending(server({ type: "rect", x: 10, y: 10, w: 50, h: 20 }), { type: "rect", x: 10, y: 10, w: 50, h: 21 })).toBe(false);
  });

  it("matches text even when the server moved it up from the bottom edge", () => {
    expect(confirmsPending(server({ type: "text", text: "Salom", x: 40, y: 1580 }), { type: "text", text: "Salom ", x: 40, y: 1610 })).toBe(true);
    expect(confirmsPending(server({ type: "text", text: "Salom", x: 40, y: 100 }), { type: "text", text: "Hayr", x: 40, y: 100 })).toBe(false);
    expect(confirmsPending(server({ type: "math", latex: "x^2", x: 40, y: 100 }), { type: "math", latex: "x^2", x: 40, y: 100 })).toBe(true);
  });
});
