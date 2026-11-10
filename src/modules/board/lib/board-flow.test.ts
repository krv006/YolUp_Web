import { describe, expect, it } from "vitest";
import { estimateTextWidth, freeTextBaseline, textRow } from "./board-flow";

const size = 22;
const row = textRow(size);
const base = { x: 100, size, lines: 1, width: 200, maxBaseline: 880 };
const line = (index: number, left = 0, right = 500) => ({
  left,
  right,
  top: index * row,
  bottom: index * row + size * 1.32,
});

describe("freeTextBaseline", () => {
  it("snaps the text to the row under the pointer", () => {
    expect(freeTextBaseline({ ...base, y: row * 3 + 5, obstacles: [] })).toBeCloseTo(row * 3 + size);
  });

  it("puts consecutive lines on adjacent rows", () => {
    expect(freeTextBaseline({ ...base, y: row * 3 + 5, obstacles: [line(3)] })).toBeCloseTo(row * 4 + size);
  });

  it("moves below a block that already occupies the row", () => {
    const block = { left: 90, right: 400, top: row * 2, bottom: row * 7 + size * 1.32 };
    expect(freeTextBaseline({ ...base, y: row * 4 + 3, obstacles: [block] })).toBeCloseTo(row * 8 + size);
  });

  it("allows text beside an element in the same row", () => {
    expect(freeTextBaseline({ ...base, y: row * 4 + 3, obstacles: [line(4, 600, 800)] })).toBeCloseTo(row * 4 + size);
  });

  it("finds a gap tall enough for every line of the block", () => {
    expect(freeTextBaseline({ ...base, lines: 2, y: row * 2, obstacles: [line(2), line(4)] })).toBeCloseTo(
      row * 5 + size
    );
  });

  it("looks above when nothing is free below", () => {
    const wall = { left: 0, right: 500, top: row * 3, bottom: 900 };
    expect(freeTextBaseline({ ...base, y: row * 5, obstacles: [wall, line(2)] })).toBeCloseTo(row * 1 + size);
  });

  it("keeps the clicked row when the whole column is taken", () => {
    const wall = { left: 0, right: 500, top: 0, bottom: 900 };
    expect(freeTextBaseline({ ...base, y: row * 3, obstacles: [wall] })).toBeCloseTo(row * 3 + size);
  });
});

describe("estimateTextWidth", () => {
  it("uses the longest line", () => {
    expect(estimateTextWidth("ab\nabcd", 10)).toBeCloseTo(4 * 10 * 0.56);
  });
});
