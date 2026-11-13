import { describe, expect, it } from "vitest";
import { BOARD_ZOOM, clampZoom, zoomScroll } from "./board-zoom";

describe("board zoom", () => {
  it("stays between the limits and rounds to whole percents", () => {
    expect(clampZoom(0.1)).toBe(BOARD_ZOOM.min);
    expect(clampZoom(9)).toBe(BOARD_ZOOM.max);
    expect(clampZoom(1.23456)).toBe(1.23);
  });

  it("keeps the point under the cursor in place", () => {
    expect(zoomScroll({ left: 0, top: 0 }, { x: 100, y: 50 }, 2)).toEqual({ left: 100, top: 50 });
    expect(zoomScroll({ left: 300, top: 120 }, { x: 100, y: 50 }, 0.5)).toEqual({ left: 100, top: 35 });
  });

  it("never scrolls before the start", () => {
    expect(zoomScroll({ left: 0, top: 0 }, { x: 100, y: 100 }, 0.5)).toEqual({ left: 0, top: 0 });
  });
});
