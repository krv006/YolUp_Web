import { describe, expect, it } from "vitest";
import { parseBoardEvent } from "./board-socket-manager";

describe("attention event", () => {
  it("reads the check the server pushes when it is due", () => {
    expect(parseBoardEvent({ type: "attention", check: { id: 42, due_at: "2026-11-11T10:00:00+05:00" } })).toEqual({
      type: "attention",
      checkId: "42",
      dueAt: "2026-11-11T10:00:00+05:00",
    });
  });

  it("ignores an attention event without a check", () => {
    expect(parseBoardEvent({ type: "attention" })).toBeNull();
    expect(parseBoardEvent({ type: "attention", check: null })).toBeNull();
  });
});
