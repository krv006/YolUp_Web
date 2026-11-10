import { describe, expect, it } from "vitest";
import { mapChildScores, scoreSeries } from "./child-scores";

describe("child scores", () => {
  const scores = mapChildScores(
    {
      range: "6m",
      period_type: "month",
      summary: { overall: 8.1, homework: 8.5, quiz: 9, exam: null, count: 4 },
      periods: [
        { start: "2026-10-01", overall: 7.5, homework: 7.5, quiz: null, exam: null, count: 1 },
        { start: "2026-11-01", overall: 9, homework: 9, quiz: 9, count: 2 },
      ],
    },
    "8w"
  );

  it("keeps the server range, period type and empty kinds as null", () => {
    expect(scores.range).toBe("6m");
    expect(scores.periodType).toBe("month");
    expect(scores.summary.exam).toBeNull();
    expect(scores.periods[1].values.exam).toBeNull();
  });

  it("builds a series for the chosen kind with gaps", () => {
    expect(scoreSeries(scores, "quiz")).toEqual([null, 9]);
    expect(scoreSeries(scores, "overall")).toEqual([7.5, 9]);
  });
});
