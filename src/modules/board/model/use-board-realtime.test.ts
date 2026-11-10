import { describe, expect, it } from "vitest";
import { mapBoardDto } from "../lib/board.mappers";
import { applyBoardEvent } from "./use-board-realtime";

const state = mapBoardDto({
  sheets: [
    { index: 0, strokes: [{ id: "a", type: "text", text: "Eski", x: 1, y: 2 }, { id: "b", type: "rect", x: 0, y: 0, w: 10, h: 10 }] },
    { index: 1, strokes: [{ id: "a", type: "text", text: "Boshqa sheet", x: 1, y: 2 }] },
  ],
});

describe("applyBoardEvent stroke_updated", () => {
  it("replaces the element on its own sheet and keeps the layer order", () => {
    const next = applyBoardEvent(state, {
      type: "stroke_updated",
      sheet: 0,
      stroke: { id: "a", type: "text", text: "Yangi", x: 50, y: 60, edited_by: "Bekzod" },
    });
    expect(next?.sheets[0].strokes.map((stroke) => stroke.id)).toEqual(["a", "b"]);
    expect(next?.sheets[0].strokes[0]).toMatchObject({ text: "Yangi", x: 50, edited_by: "Bekzod" });
    expect(next?.sheets[1].strokes[0]).toMatchObject({ text: "Boshqa sheet" });
  });
});
