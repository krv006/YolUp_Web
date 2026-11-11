import { describe, expect, it } from "vitest";
import { attentionPollInterval } from "./live.queries";

const ANSWER_WINDOW_MS = 15_000;

describe("attention check polling", () => {
  it("polls inside the answer window until the server push has been seen", () => {
    expect(attentionPollInterval(false, true)).toBeLessThan(ANSWER_WINDOW_MS / 2);
    expect(attentionPollInterval(false, false)).toBeLessThan(ANSWER_WINDOW_MS / 2);
  });

  it("slows down only while pushes arrive over an open socket", () => {
    expect(attentionPollInterval(true, true)).toBeGreaterThan(ANSWER_WINDOW_MS);
    expect(attentionPollInterval(true, false)).toBeLessThan(ANSWER_WINDOW_MS / 2);
  });
});
