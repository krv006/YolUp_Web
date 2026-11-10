import { describe, expect, it } from "vitest";
import type { StrokeDto } from "../api/board.dto";
import { applyStrokeUpdate, canEditStroke, clampMove, moveStroke, replaceStroke } from "./board-edit";
import { parseBoardEvent } from "./board-socket-manager";

const SHEET = { width: 1600, height: 900 };

describe("moveStroke", () => {
  it("moves every point of a pen stroke and keeps shapes inside the sheet", () => {
    const pen = { id: "p", points: [[10, 10], [50, 40]], color: "#000" } as StrokeDto;
    expect(moveStroke(pen, [100, 20], SHEET)).toMatchObject({ points: [[110, 30], [150, 60]] });

    const rect = { id: "r", type: "rect", x: 1500, y: 800, w: 80, h: 60 } as StrokeDto;
    expect(moveStroke(rect, [200, 200], SHEET)).toMatchObject({ x: 1520, y: 840 });

    const line = { id: "l", type: "line", x1: 5, y1: 5, x2: 40, y2: 20 } as StrokeDto;
    expect(moveStroke(line, [-50, -50], SHEET)).toMatchObject({ x1: 0, y1: 0, x2: 35, y2: 15 });
  });

  it("clamps text, formula and code anchors like the server", () => {
    const code = { id: "c", type: "code", text: "SELECT 1;", x: 1550, y: 870 } as StrokeDto;
    expect(clampMove(code, [100, 100], SHEET)).toEqual([10, 10]);
    expect(moveStroke(code, [100, 100], SHEET)).toMatchObject({ x: 1560, y: 880 });
    const text = { id: "t", type: "text", text: "Salom", x: 20, y: 30 } as StrokeDto;
    expect(moveStroke(text, [-40, 15], SHEET)).toMatchObject({ x: 0, y: 45 });
  });
});

describe("applyStrokeUpdate", () => {
  it("merges changes but never overwrites identity or author fields", () => {
    const code = { id: "c", type: "code", text: "a", language: "auto", x: 80, y: 120, by: "Aziza", by_id: "u1" } as StrokeDto;
    const next = applyStrokeUpdate(code, { changes: { text: "SELECT 2;", language: "sql", id: "x", by_id: "u2", type: "text" } }, SHEET);
    expect(next).toMatchObject({ id: "c", type: "code", text: "SELECT 2;", language: "sql", by_id: "u1" });
  });

  it("applies changes and a move together", () => {
    const rect = { id: "r", type: "rect", x: 10, y: 10, w: 20, h: 20, color: "#000" } as StrokeDto;
    expect(applyStrokeUpdate(rect, { changes: { color: "#f00", w: 40 }, move: [5, 5] }, SHEET)).toMatchObject({
      x: 15,
      y: 15,
      w: 40,
      color: "#f00",
    });
  });
});

describe("canEditStroke", () => {
  it("lets teachers edit everything and students only their own elements", () => {
    expect(canEditStroke({ by_id: "u2" }, { isTeacher: true, userId: "t1" })).toBe(true);
    expect(canEditStroke({ by_id: "u1" }, { isTeacher: false, userId: "u1" })).toBe(true);
    expect(canEditStroke({ by_id: "u2" }, { isTeacher: false, userId: "u1" })).toBe(false);
    expect(canEditStroke({}, { isTeacher: false, userId: "u1" })).toBe(false);
    expect(canEditStroke({}, { isTeacher: false, userId: null, personal: true })).toBe(true);
  });
});

describe("stroke_updated", () => {
  it("is parsed from the socket and replaces the element in place", () => {
    const event = parseBoardEvent({ type: "stroke_updated", sheet: "1", stroke: { id: "b", type: "text", text: "Yangi", x: 1, y: 2 } });
    expect(event).toMatchObject({ type: "stroke_updated", sheet: 1, stroke: { id: "b", text: "Yangi" } });
    const strokes = [{ id: "a" }, { id: "b", text: "Eski" }, { id: "c" }] as StrokeDto[];
    const next = replaceStroke(strokes, (event as { stroke: StrokeDto }).stroke);
    expect(next.map((item) => item.id)).toEqual(["a", "b", "c"]);
    expect(next[1]).toMatchObject({ text: "Yangi" });
    expect(replaceStroke(strokes, { id: "z" } as StrokeDto)).toBe(strokes);
  });
});
