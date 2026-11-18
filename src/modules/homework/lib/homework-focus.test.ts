import { describe, expect, it } from "vitest";
import { mapHomeworkFocusDto } from "./homework.mappers";

describe("mapHomeworkFocusDto", () => {
  it("maps the page leaving summary with an open absence", () => {
    const focus = mapHomeworkFocusDto({
      exits: 2,
      away_seconds: 250,
      longest_seconds: 190,
      on_page_seconds: 900,
      total_seconds: 1150,
      timeline: [
        { left_at: "2026-11-18T09:02:00Z", returned_at: "2026-11-18T09:03:00Z", seconds: 60 },
        { left_at: "2026-11-18T09:10:00Z", returned_at: null, seconds: 190 },
      ],
    });
    expect(focus).toMatchObject({ exits: 2, awaySeconds: 250, longestSeconds: 190, onPageSeconds: 900 });
    expect(focus?.timeline[1]).toEqual({ leftAt: "2026-11-18T09:10:00Z", returnedAt: null, seconds: 190 });
  });

  it("keeps an untracked submission empty instead of inventing zeros", () => {
    expect(mapHomeworkFocusDto(undefined)).toBeNull();
    expect(mapHomeworkFocusDto({})).toMatchObject({ exits: 0, timeline: [] });
  });
});
