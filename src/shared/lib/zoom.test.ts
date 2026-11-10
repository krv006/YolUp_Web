import { describe, expect, it } from "vitest";
import { clampZoom, stepZoom, ZOOM_MAX, ZOOM_MIN } from "./zoom";

describe("stepZoom", () => {
  it("moves to the neighbouring step", () => {
    expect(stepZoom(1, 1)).toBe(1.25);
    expect(stepZoom(1, -1)).toBe(0.75);
  });

  it("snaps a pinch value to the next step in the chosen direction", () => {
    expect(stepZoom(1.37, 1)).toBe(1.5);
    expect(stepZoom(1.37, -1)).toBe(1.25);
  });

  it("stays at the limits", () => {
    expect(stepZoom(ZOOM_MAX, 1)).toBe(ZOOM_MAX);
    expect(stepZoom(ZOOM_MIN, -1)).toBe(ZOOM_MIN);
  });
});

describe("clampZoom", () => {
  it("keeps the value inside the allowed range", () => {
    expect(clampZoom(10)).toBe(ZOOM_MAX);
    expect(clampZoom(0.1)).toBe(ZOOM_MIN);
    expect(clampZoom(1.4)).toBe(1.4);
  });
});
